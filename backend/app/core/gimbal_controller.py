"""
2-Axis Pan-Tilt Gimbal Controller for Coarse Alignment
Translates camera image pixel errors [delta_u, delta_v] into spherical angular rate commands
[Azimuth_dot, Elevation_dot] via dual-axis PID controllers with motor slew limits and deadbands.
"""

import math
import numpy as np
from typing import Dict, Any, Tuple


class GimbalPIDController:
    def __init__(self,
                 kp: float = 3.6,
                 ki: float = 0.80,
                 kd: float = 0.18,
                 max_slew_rate_deg_s: float = 60.0,
                 lock_threshold_deg: float = 0.50):
        # PID gains for Azimuth (Pan) and Elevation (Tilt)
        self.kp = kp
        self.ki = ki
        self.kd = kd
        
        # Physical gimbal kinematic constraints
        self.max_slew_rate = max_slew_rate_deg_s  # deg/s
        self.lock_threshold_deg = lock_threshold_deg  # threshold for COARSE LOCK
        self.deadband_deg = 0.02  # ignore noise below 0.02 deg
        
        # Current gimbal orientation
        self.azimuth_deg = 0.0    # 0 to 360 degrees
        self.elevation_deg = 20.0  # -20 to +90 degrees
        
        # Integrator and derivative state
        self.integral_az = 0.0
        self.integral_el = 0.0
        self.prev_error_az = 0.0
        self.prev_error_el = 0.0
        
        # Lock status
        self.is_locked = False
        self.lock_counter = 0

    def configure(self, kp: float, ki: float, kd: float, max_slew_rate: float, lock_threshold: float):
        self.kp = kp
        self.ki = ki
        self.kd = kd
        self.max_slew_rate = max(5.0, min(180.0, max_slew_rate))
        self.lock_threshold_deg = max(0.05, min(5.0, lock_threshold))

    def reset_integrators(self):
        self.integral_az = 0.0
        self.integral_el = 0.0
        self.prev_error_az = 0.0
        self.prev_error_el = 0.0
        self.lock_counter = 0

    def update(self,
               target_u: float,
               target_v: float,
               fx: float,
               fy: float,
               cx: float,
               cy: float,
               dt: float = 0.016,
               tracking_active: bool = True,
               feedforward_rate_az: float = 0.0,
               feedforward_rate_el: float = 0.0) -> Dict[str, Any]:
        """
        Calculates angular errors from optical center and updates gimbal orientation via PID control
        with feedforward velocity rate commands during predictive coasting.
        """
        # 1. Convert pixel coordinate error to angular error relative to optical boresight
        # Delta Azimuth = atan((u - cx) / fx)
        # Delta Elevation = atan((cy - v) / fy)  [Note: inverted because image v points down]
        error_az_rad = math.atan((target_u - cx) / fx)
        error_el_rad = math.atan((cy - target_v) / fy)
        
        error_az_deg = math.degrees(error_az_rad)
        error_el_deg = math.degrees(error_el_rad)

        if not tracking_active:
            # When tracking is inactive or lost, maintain current position
            return {
                "gimbal_azimuth_deg": round(self.azimuth_deg, 3),
                "gimbal_elevation_deg": round(self.elevation_deg, 3),
                "error_azimuth_deg": round(error_az_deg, 4),
                "error_elevation_deg": round(error_el_deg, 4),
                "total_error_deg": round(math.sqrt(error_az_deg**2 + error_el_deg**2), 4),
                "total_error_mrad": round(math.sqrt(error_az_rad**2 + error_el_rad**2) * 1000.0, 3),
                "is_locked": False,
                "slew_rate_az": 0.0,
                "slew_rate_el": 0.0
            }

        # Deadband application
        eff_error_az = 0.0 if abs(error_az_deg) < self.deadband_deg else error_az_deg
        eff_error_el = 0.0 if abs(error_el_deg) < self.deadband_deg else error_el_deg

        # Integrator update with anti-windup clamp
        self.integral_az = np.clip(self.integral_az + eff_error_az * dt, -15.0, 15.0)
        self.integral_el = np.clip(self.integral_el + eff_error_el * dt, -15.0, 15.0)

        # Derivative calculation
        deriv_az = (eff_error_az - self.prev_error_az) / max(1e-5, dt)
        deriv_el = (eff_error_el - self.prev_error_el) / max(1e-5, dt)
        
        self.prev_error_az = eff_error_az
        self.prev_error_el = eff_error_el

        # Dual-Axis PID command with Feedforward Kinematic Rate Compensation
        cmd_rate_az = self.kp * eff_error_az + self.ki * self.integral_az + self.kd * deriv_az + feedforward_rate_az
        cmd_rate_el = self.kp * eff_error_el + self.ki * self.integral_el + self.kd * deriv_el + feedforward_rate_el

        # Motor Slew Rate Limiting
        rate_az = float(np.clip(cmd_rate_az, -self.max_slew_rate, self.max_slew_rate))
        rate_el = float(np.clip(cmd_rate_el, -self.max_slew_rate, self.max_slew_rate))

        # Update physical gimbal angles
        self.azimuth_deg = (self.azimuth_deg + rate_az * dt) % 360.0
        self.elevation_deg = float(np.clip(self.elevation_deg + rate_el * dt, -20.0, 88.0))

        # Calculate total pointing error magnitude
        total_error_deg = math.sqrt(error_az_deg**2 + error_el_deg**2)
        total_error_mrad = math.sqrt(error_az_rad**2 + error_el_rad**2) * 1000.0

        # Check for Coarse Alignment Lock
        if total_error_deg <= self.lock_threshold_deg:
            self.lock_counter += 1
            if self.lock_counter >= 5:  # Require 5 consecutive stable frames
                self.is_locked = True
        else:
            self.lock_counter = 0
            self.is_locked = False

        return {
            "gimbal_azimuth_deg": round(self.azimuth_deg, 3),
            "gimbal_elevation_deg": round(self.elevation_deg, 3),
            "error_azimuth_deg": round(error_az_deg, 4),
            "error_elevation_deg": round(error_el_deg, 4),
            "total_error_deg": round(total_error_deg, 4),
            "total_error_mrad": round(total_error_mrad, 3),
            "is_locked": self.is_locked,
            "slew_rate_az": round(rate_az, 2),
            "slew_rate_el": round(rate_el, 2)
        }
