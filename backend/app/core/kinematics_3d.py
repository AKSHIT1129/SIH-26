"""
3D Kinematics and Target Trajectory Engine
Simulates mobile FSOC terminals (UAVs, High Altitude Platforms, Satellites)
with multiple flight dynamics, wind turbulence, vibrations, and occlusion zones.
"""

import math
import time
import numpy as np
from typing import Dict, Any, Tuple, Optional


class TargetKinematics3D:
    def __init__(self, 
                 base_origin: Tuple[float, float, float] = (0.0, 0.0, 0.0),
                 default_altitude: float = 120.0,
                 default_radius: float = 250.0):
        self.base_origin = np.array(base_origin, dtype=np.float64)
        self.altitude = default_altitude
        self.radius = default_radius
        
        # Flight state
        self.position = np.array([150.0, 100.0, default_altitude], dtype=np.float64)
        self.velocity = np.array([0.0, 0.0, 0.0], dtype=np.float64)
        self.acceleration = np.array([0.0, 0.0, 0.0], dtype=np.float64)
        
        # Trajectory parameters
        self.trajectory_mode = "orbit"  # orbit, figure8, linear_flyby, high_g_evasive, waypoint
        self.speed = 15.0  # m/s
        self.wind_turbulence_intensity = 0.5  # turbulence standard deviation (m/s^2)
        self.platform_jitter_amplitude = 0.05  # angular jitter (rad)
        
        # Occlusion configuration
        self.is_occluded = False
        self.manual_occlusion_override = False
        self.occlusion_zones = [
            {"center": np.array([120.0, 150.0, 120.0]), "radius": 35.0, "type": "cloud"},
            {"center": np.array([-100.0, 80.0, 100.0]), "radius": 40.0, "type": "building"}
        ]
        
        # Internal time
        self.t = 0.0
        self.last_update_time = time.time()

    def set_trajectory_mode(self, mode: str, speed: Optional[float] = None):
        valid_modes = ["orbit", "figure8", "linear_flyby", "high_g_evasive", "hover"]
        if mode in valid_modes:
            self.trajectory_mode = mode
        if speed is not None:
            self.speed = max(0.0, speed)

    def set_wind_and_turbulence(self, turbulence: float, jitter: float):
        self.wind_turbulence_intensity = max(0.0, turbulence)
        self.platform_jitter_amplitude = max(0.0, jitter)

    def trigger_occlusion(self, occluded: bool):
        self.manual_occlusion_override = occluded

    def update(self, dt: float = 0.016) -> Dict[str, Any]:
        """
        Advance target kinematics by dt seconds.
        Returns true 3D position, velocity, and occlusion status.
        """
        self.t += dt
        t = self.t
        omega = self.speed / max(10.0, self.radius)
        
        # Base trajectory generation
        prev_pos = self.position.copy()
        
        if self.trajectory_mode == "orbit":
            # Circular orbit around base station
            x = self.radius * math.cos(omega * t)
            y = self.radius * math.sin(omega * t)
            z = self.altitude + 15.0 * math.sin(0.2 * omega * t)
            self.position = np.array([x, y, z], dtype=np.float64)

        elif self.trajectory_mode == "figure8":
            # Lissajous figure-8 flight path
            x = self.radius * math.sin(omega * t)
            y = self.radius * math.sin(2.0 * omega * t) / 2.0
            z = self.altitude + 20.0 * math.cos(0.5 * omega * t)
            self.position = np.array([x, y, z], dtype=np.float64)

        elif self.trajectory_mode == "linear_flyby":
            # High speed straight-line pass
            x = -self.radius * 1.5 + (self.speed * t) % (3.0 * self.radius)
            y = 120.0 + 30.0 * math.sin(0.1 * t)
            z = self.altitude + 5.0 * math.sin(0.3 * t)
            self.position = np.array([x, y, z], dtype=np.float64)

        elif self.trajectory_mode == "high_g_evasive":
            # Rapid multi-axis accelerations simulating turbulent drone maneuvers
            x = self.radius * 0.8 * math.cos(omega * t * 1.5) + 30.0 * math.sin(3.0 * omega * t)
            y = self.radius * 0.8 * math.sin(omega * t) + 25.0 * math.cos(2.5 * omega * t)
            z = self.altitude + 35.0 * math.sin(1.2 * omega * t)
            self.position = np.array([x, y, z], dtype=np.float64)

        elif self.trajectory_mode == "hover":
            # Stationary hover with small drift
            x = 150.0 + 2.0 * math.sin(0.5 * t)
            y = 150.0 + 2.0 * math.cos(0.5 * t)
            z = self.altitude + 1.0 * math.sin(0.8 * t)
            self.position = np.array([x, y, z], dtype=np.float64)

        # Wind turbulence disturbance (Dryden wind model approximation)
        if self.wind_turbulence_intensity > 0:
            turbulence_noise = np.random.normal(0, self.wind_turbulence_intensity, 3) * dt
            self.position += turbulence_noise

        # Calculate instantaneous velocity & acceleration
        self.velocity = (self.position - prev_pos) / max(1e-5, dt)
        
        # Check for natural or manual occlusion
        occluded = self.manual_occlusion_override
        if not occluded:
            for zone in self.occlusion_zones:
                dist = np.linalg.norm(self.position - zone["center"])
                if dist < zone["radius"]:
                    occluded = True
                    break
        self.is_occluded = occluded

        # Compute range and true ground angles from base terminal
        rel_pos = self.position - self.base_origin
        distance = float(np.linalg.norm(rel_pos))
        true_azimuth = float(math.degrees(math.atan2(rel_pos[0], rel_pos[1])) % 360.0)
        true_elevation = float(math.degrees(math.atan2(rel_pos[2], math.sqrt(rel_pos[0]**2 + rel_pos[1]**2))))

        return {
            "time": self.t,
            "position": self.position.tolist(),
            "velocity": self.velocity.tolist(),
            "distance": distance,
            "true_azimuth_deg": true_azimuth,
            "true_elevation_deg": true_elevation,
            "is_occluded": self.is_occluded,
            "trajectory_mode": self.trajectory_mode
        }
