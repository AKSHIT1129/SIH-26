"""
Extended Kalman Filter (EKF) & Predictive Tracking Engine
Estimates 6-DOF Kinematics [theta_az, theta_el, omega_az, omega_el, alpha_az, alpha_el]
in spherical sky coordinate space.
Provides continuous trajectory extrapolation during cloud/building occlusions
and outputs feedforward angular rate commands so the gimbal actively tracks occluded targets.
"""

import math
import numpy as np
from typing import Dict, Any, List, Optional, Tuple


class KalmanPredictiveTracker:
    def __init__(self, dt_default: float = 0.016):
        self.dt = dt_default
        
        # State vector: [theta_az, theta_el, omega_az, omega_el, alpha_az, alpha_el]^T (degrees, deg/s, deg/s^2)
        self.x = np.zeros((6, 1), dtype=np.float64)
        
        # State covariance matrix P (initial angular uncertainty)
        self.P = np.eye(6, dtype=np.float64) * 2.0
        self.P[2:, 2:] *= 5.0
        
        # Measurement matrix H: we measure [theta_az, theta_el] in degrees
        self.H = np.zeros((2, 6), dtype=np.float64)
        self.H[0, 0] = 1.0
        self.H[1, 1] = 1.0
        
        # Measurement noise covariance R (sensor pixel/angle noise in deg^2)
        self.R = np.eye(2, dtype=np.float64) * 0.005
        
        # Process noise spectral density (acceleration disturbance)
        self.q_var = 18.0
        
        # Tracking status
        self.is_initialized = False
        self.missed_frames = 0
        self.max_coast_frames = 300  # Up to 5.0 seconds of continuous predictive coasting
        self.state_label = "SEARCHING"  # SEARCHING, ACQUIRING, TRACKING, OCCLUSION_PREDICTING, LOST_SEARCHING
        
        # Spiral search generator for loss-of-lock re-acquisition
        self.search_time = 0.0
        self.search_pattern_active = False

    def _get_transition_matrix(self, dt: float) -> np.ndarray:
        """Constructs 6x6 constant acceleration transition matrix F."""
        F = np.eye(6, dtype=np.float64)
        # Position += Vel * dt + 0.5 * Acc * dt^2
        F[0, 2] = dt
        F[0, 4] = 0.5 * dt**2
        F[1, 3] = dt
        F[1, 5] = 0.5 * dt**2
        # Velocity += Acc * dt
        F[2, 4] = dt
        F[3, 5] = dt
        return F

    def _get_process_noise(self, dt: float) -> np.ndarray:
        """Piecewise continuous white noise acceleration model Q."""
        q = self.q_var
        dt2 = dt**2
        dt3 = dt**3
        dt4 = dt**4
        dt5 = dt**5
        
        # 1D sub-matrix
        Q1D = np.array([
            [dt5 / 20.0, dt4 / 8.0, dt3 / 6.0],
            [dt4 / 8.0,  dt3 / 3.0, dt2 / 2.0],
            [dt3 / 6.0,  dt2 / 2.0, dt]
        ]) * q
        
        Q = np.zeros((6, 6), dtype=np.float64)
        Q[0:5:2, 0:5:2] = Q1D  # Indices 0, 2, 4 for Azimuth
        Q[1:6:2, 1:6:2] = Q1D  # Indices 1, 3, 5 for Elevation
        return Q

    def reset(self):
        self.x = np.zeros((6, 1), dtype=np.float64)
        self.P = np.eye(6, dtype=np.float64) * 2.0
        self.is_initialized = False
        self.missed_frames = 0
        self.state_label = "SEARCHING"
        self.search_time = 0.0
        self.search_pattern_active = False

    def update(self,
               measurement: Optional[Tuple[float, float]],
               dt: float = 0.016,
               cam_width: int = 1920,
               cam_height: int = 1080,
               gimbal_az_deg: float = 0.0,
               gimbal_el_deg: float = 0.0,
               fx: Optional[float] = None,
               fy: Optional[float] = None,
               cx: Optional[float] = None,
               cy: Optional[float] = None) -> Dict[str, Any]:
        """
        Runs EKF State Prediction and Measurement Update in spherical sky coordinates.
        During occlusions, seamlessly extrapolates target flight vector and calculates
        feedforward gimbal rate commands so the terminal actively tracks the occluded drone.
        """
        if dt <= 0:
            dt = 0.016

        # Camera intrinsic defaults if not passed
        if fx is None or fx <= 0:
            fx = (cam_width / 2.0) / math.tan(math.radians(45.0) / 2.0)
        if fy is None or fy <= 0:
            fy = fx
        if cx is None:
            cx = cam_width / 2.0
        if cy is None:
            cy = cam_height / 2.0

        F = self._get_transition_matrix(dt)
        Q = self._get_process_noise(dt)
        
        # 1. PREDICTION STEP (Propagate state kinematics along estimated velocity/acceleration)
        self.x = F @ self.x
        self.x[0, 0] = (self.x[0, 0] + 360.0) % 360.0
        self.P = F @ self.P @ F.T + Q

        # 2. MEASUREMENT UPDATE STEP (if visual beacon is detected)
        if measurement is not None and not np.isnan(measurement[0]) and not np.isnan(measurement[1]):
            u_meas, v_meas = measurement[0], measurement[1]
            
            # Convert pixel coords (u, v) into spherical target angles in the sky
            delta_az_deg = math.degrees(math.atan((u_meas - cx) / fx))
            delta_el_deg = math.degrees(math.atan((cy - v_meas) / fy))
            
            theta_az_meas = (gimbal_az_deg + delta_az_deg + 360.0) % 360.0
            theta_el_meas = float(np.clip(gimbal_el_deg + delta_el_deg, -20.0, 90.0))
            
            z = np.array([[theta_az_meas], [theta_el_meas]], dtype=np.float64)
            
            if not self.is_initialized:
                # First observation: initialize state vector
                self.x[0, 0] = theta_az_meas
                self.x[1, 0] = theta_el_meas
                self.x[2:, 0] = 0.0
                self.P = np.eye(6, dtype=np.float64) * 0.5
                self.P[2:, 2:] *= 10.0
                self.is_initialized = True
                self.missed_frames = 0
                self.state_label = "ACQUIRING"
            else:
                # Innovation residual with modular azimuth wrapping
                res_az = ((theta_az_meas - self.x[0, 0] + 180.0) % 360.0) - 180.0
                res_el = theta_el_meas - self.x[1, 0]
                y = np.array([[res_az], [res_el]], dtype=np.float64)
                
                # Kalman Gain calculation
                S = self.H @ self.P @ self.H.T + self.R
                K = self.P @ self.H.T @ np.linalg.inv(S)
                
                self.x = self.x + K @ y
                self.x[0, 0] = (self.x[0, 0] + 360.0) % 360.0
                
                I = np.eye(6, dtype=np.float64)
                self.P = (I - K @ self.H) @ self.P
                
                self.missed_frames = 0
                self.state_label = "TRACKING"
                self.search_pattern_active = False
                self.search_time = 0.0
        else:
            # 3. NO MEASUREMENT (Cloud Occlusion or Temporary Drop)
            self.missed_frames += 1
            
            if self.missed_frames <= self.max_coast_frames and self.is_initialized:
                # Coasting on high-precision 6-DOF trajectory extrapolation
                self.state_label = "OCCLUSION_PREDICTING"
                self.search_pattern_active = False
            else:
                # Prolonged occlusion exceeding coast horizon: trigger spiral search
                self.state_label = "LOST_SEARCHING"
                self.search_pattern_active = True
                self.search_time += dt

        # Target estimated spherical coordinates
        tgt_az_est = float(self.x[0, 0])
        tgt_el_est = float(self.x[1, 0])
        omega_az_est = float(self.x[2, 0])  # deg/s
        omega_el_est = float(self.x[3, 0])  # deg/s

        # Project estimated target onto camera sensor relative to current gimbal orientation
        diff_az = ((tgt_az_est - gimbal_az_deg + 180.0) % 360.0) - 180.0
        diff_el = tgt_el_est - gimbal_el_deg

        # Safe angular clamp to avoid math.tan singularity near +-90 deg
        clamped_diff_az = max(-85.0, min(85.0, diff_az))
        clamped_diff_el = max(-85.0, min(85.0, diff_el))
        
        # Pinhole projection for gimbal controller & UI reticle
        u_est = cx + fx * math.tan(math.radians(clamped_diff_az))
        v_est = cy - fy * math.tan(math.radians(clamped_diff_el))

        # Pixel velocities relative to camera
        u_vel = (omega_az_est * (fx * (math.pi / 180.0)))
        v_vel = -(omega_el_est * (fy * (math.pi / 180.0)))

        # Position uncertainty in pixels (converted from angular covariance)
        sigma_deg = float(np.sqrt(max(1e-4, self.P[0, 0] + self.P[1, 1])))
        pos_uncertainty_px = max(1.0, min(120.0, sigma_deg * (fx * (math.pi / 180.0))))

        # Generate future predicted trajectory horizon (next 1.0 second in 5 steps)
        future_trajectory = []
        if self.is_initialized and self.state_label in ["TRACKING", "OCCLUSION_PREDICTING"]:
            temp_x = self.x.copy()
            for step in range(1, 6):
                horizon_dt = step * 0.1
                F_h = self._get_transition_matrix(horizon_dt)
                pred_x = F_h @ temp_x
                h_az = (float(pred_x[0, 0]) + 360.0) % 360.0
                h_el = float(pred_x[1, 0])
                
                h_diff_az = ((h_az - gimbal_az_deg + 180.0) % 360.0) - 180.0
                h_diff_el = h_el - gimbal_el_deg

                h_clamped_diff_az = max(-85.0, min(85.0, h_diff_az))
                h_clamped_diff_el = max(-85.0, min(85.0, h_diff_el))
                
                h_u = cx + fx * math.tan(math.radians(h_clamped_diff_az))
                h_v = cy - fy * math.tan(math.radians(h_clamped_diff_el))
                
                future_trajectory.append({
                    "step": step,
                    "t_ahead_sec": round(horizon_dt, 2),
                    "u": round(h_u, 1),
                    "v": round(h_v, 1),
                    "target_az_deg": round(h_az, 2),
                    "target_el_deg": round(h_el, 2)
                })

        # Calculate Spiral Search offsets if re-acquisition active
        spiral_u_offset = 0.0
        spiral_v_offset = 0.0
        if self.search_pattern_active:
            theta = 4.0 * self.search_time
            radius_px = min(cam_width * 0.35, 25.0 * theta)
            spiral_u_offset = radius_px * math.cos(theta)
            spiral_v_offset = radius_px * math.sin(theta)

        return {
            "is_initialized": self.is_initialized,
            "state_label": self.state_label,
            "missed_frames": self.missed_frames,
            "coasting_active": self.state_label == "OCCLUSION_PREDICTING",
            "estimated_u": round(u_est + spiral_u_offset, 2),
            "estimated_v": round(v_est + spiral_v_offset, 2),
            "target_azimuth_deg": round(tgt_az_est, 3),
            "target_elevation_deg": round(tgt_el_est, 3),
            "feedforward_rate_az": round(omega_az_est, 3),
            "feedforward_rate_el": round(omega_el_est, 3),
            "velocity_px_per_s": [round(u_vel, 2), round(v_vel, 2)],
            "future_trajectory": future_trajectory,
            "search_pattern_active": self.search_pattern_active,
            "position_uncertainty_px": round(pos_uncertainty_px, 2)
        }

