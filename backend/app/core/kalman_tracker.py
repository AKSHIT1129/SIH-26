"""
Extended Kalman Filter (EKF) & Predictive Tracking Engine
Estimates kinematics [u, v, du/dt, dv/dt, d2u/dt2, d2v/dt2] in image coordinate space.
Provides seamless trajectory extrapolation during target occlusions (clouds/buildings)
and triggers autonomous spiral search patterns upon complete loss-of-lock.
"""

import math
import numpy as np
from typing import Dict, Any, List, Optional, Tuple


class KalmanPredictiveTracker:
    def __init__(self, dt_default: float = 0.016):
        self.dt = dt_default
        
        # State vector: [u, v, u_vel, v_vel, u_acc, v_acc]^T
        self.x = np.zeros((6, 1), dtype=np.float64)
        
        # State covariance matrix P (initial uncertainty)
        self.P = np.eye(6, dtype=np.float64) * 50.0
        
        # Measurement matrix H: we directly measure [u, v]
        self.H = np.zeros((2, 6), dtype=np.float64)
        self.H[0, 0] = 1.0
        self.H[1, 1] = 1.0
        
        # Measurement noise covariance R (sensor pixel noise)
        self.R = np.eye(2, dtype=np.float64) * 4.0
        
        # Process noise spectral density
        self.q_var = 12.0
        
        # Tracking status
        self.is_initialized = False
        self.missed_frames = 0
        self.max_coast_frames = 90  # ~1.5 - 2.0 seconds of pure prediction
        self.state_label = "SEARCHING"  # SEARCHING, ACQUIRING, TRACKING, OCCLUSION_PREDICTING, LOST
        
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
        Q[0:5:2, 0:5:2] = Q1D  # Indices 0, 2, 4 for u
        Q[1:6:2, 1:6:2] = Q1D  # Indices 1, 3, 5 for v
        return Q

    def reset(self):
        self.x = np.zeros((6, 1), dtype=np.float64)
        self.P = np.eye(6, dtype=np.float64) * 50.0
        self.is_initialized = False
        self.missed_frames = 0
        self.state_label = "SEARCHING"
        self.search_time = 0.0
        self.search_pattern_active = False

    def update(self,
               measurement: Optional[Tuple[float, float]],
               dt: float = 0.016,
               cam_width: int = 1920,
               cam_height: int = 1080) -> Dict[str, Any]:
        """
        Runs Kalman Predict and (if available) Measurement Update.
        Returns predicted state, filtered coordinates, tracking status, and trajectory vector.
        """
        F = self._get_transition_matrix(dt)
        Q = self._get_process_noise(dt)
        
        # PREDICTION STEP
        self.x = F @ self.x
        self.P = F @ self.P @ F.T + Q

        if measurement is not None and not np.isnan(measurement[0]):
            z = np.array([[measurement[0]], [measurement[1]]], dtype=np.float64)
            
            if not self.is_initialized:
                # First detection: initialize state
                self.x[0, 0] = z[0, 0]
                self.x[1, 0] = z[1, 0]
                self.x[2:, 0] = 0.0
                self.P = np.eye(6, dtype=np.float64) * 10.0
                self.is_initialized = True
                self.missed_frames = 0
                self.state_label = "ACQUIRING"
            else:
                # MEASUREMENT UPDATE STEP
                y = z - self.H @ self.x  # Innovation residual
                S = self.H @ self.P @ self.H.T + self.R  # Innovation covariance
                K = self.P @ self.H.T @ np.linalg.inv(S)  # Optimal Kalman Gain
                
                self.x = self.x + K @ y
                I = np.eye(6, dtype=np.float64)
                self.P = (I - K @ self.H) @ self.P  # Updated covariance
                
                self.missed_frames = 0
                self.state_label = "TRACKING"
                self.search_pattern_active = False
                self.search_time = 0.0
        else:
            # NO MEASUREMENT (Occlusion or Out-of-FOV)
            self.missed_frames += 1
            
            if self.missed_frames <= self.max_coast_frames and self.is_initialized:
                # Coasting on pure EKF trajectory prediction
                self.state_label = "OCCLUSION_PREDICTING"
                self.search_pattern_active = False
            else:
                # Target completely lost: activate spiral re-acquisition search
                self.state_label = "LOST_SEARCHING"
                self.search_pattern_active = True
                self.search_time += dt

        # Calculate estimated centroid
        u_est = float(self.x[0, 0])
        v_est = float(self.x[1, 0])
        u_vel = float(self.x[2, 0])
        v_vel = float(self.x[3, 0])

        # Generate future predicted trajectory horizon (next 1.0 second in 5 steps)
        future_trajectory = []
        if self.is_initialized and self.state_label in ["TRACKING", "OCCLUSION_PREDICTING"]:
            temp_x = self.x.copy()
            for step in range(1, 6):
                horizon_dt = step * 0.1
                F_h = self._get_transition_matrix(horizon_dt)
                pred_x = F_h @ temp_x
                future_trajectory.append({
                    "step": step,
                    "t_ahead_sec": round(horizon_dt, 2),
                    "u": round(float(pred_x[0, 0]), 1),
                    "v": round(float(pred_x[1, 0]), 1)
                })

        # Calculate Spiral Search offsets if in re-acquisition mode
        spiral_u_offset = 0.0
        spiral_v_offset = 0.0
        if self.search_pattern_active:
            # Archimedean spiral search: r = a + b*theta
            theta = 4.0 * self.search_time
            radius_px = min(cam_width * 0.35, 25.0 * theta)
            spiral_u_offset = radius_px * math.cos(theta)
            spiral_v_offset = radius_px * math.sin(theta)

        return {
            "is_initialized": self.is_initialized,
            "state_label": self.state_label,
            "missed_frames": self.missed_frames,
            "estimated_u": round(u_est + spiral_u_offset, 2),
            "estimated_v": round(v_est + spiral_v_offset, 2),
            "velocity_px_per_s": [round(u_vel, 2), round(v_vel, 2)],
            "future_trajectory": future_trajectory,
            "search_pattern_active": self.search_pattern_active,
            "position_uncertainty_px": round(float(np.sqrt(self.P[0, 0] + self.P[1, 1])), 2)
        }
