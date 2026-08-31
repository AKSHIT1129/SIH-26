"""
Virtual Camera Sensor & Projection Engine
Models a physical wide-angle tracking camera mounted on the 2-axis Pan-Tilt gimbal.
Implements pinhole camera geometry, perspective projection, FOV clipping, and optical sensor noise.
"""

import math
import numpy as np
from typing import Dict, Any, Tuple, Optional


class VirtualCamera:
    def __init__(self,
                 resolution: Tuple[int, int] = (1920, 1080),
                 horizontal_fov_deg: float = 45.0,
                 focal_length_mm: float = 25.0,
                 sensor_noise_sigma: float = 0.5):
        self.width, self.height = resolution
        self.fov_h_deg = horizontal_fov_deg
        self.focal_length_mm = focal_length_mm
        self.sensor_noise_sigma = sensor_noise_sigma
        
        # Calculate intrinsic parameters
        self.fov_h_rad = math.radians(horizontal_fov_deg)
        self.fx = (self.width / 2.0) / math.tan(self.fov_h_rad / 2.0)
        self.aspect_ratio = self.height / self.width
        self.fov_v_rad = 2.0 * math.atan(math.tan(self.fov_h_rad / 2.0) * self.aspect_ratio)
        self.fov_v_deg = math.degrees(self.fov_v_rad)
        self.fy = self.fx  # Square pixels
        self.cx = self.width / 2.0
        self.cy = self.height / 2.0

    def configure_lens(self, fov_deg: float, focal_length_mm: float, noise_sigma: float):
        self.fov_h_deg = max(5.0, min(120.0, fov_deg))
        self.focal_length_mm = focal_length_mm
        self.sensor_noise_sigma = max(0.0, noise_sigma)
        
        self.fov_h_rad = math.radians(self.fov_h_deg)
        self.fx = (self.width / 2.0) / math.tan(self.fov_h_rad / 2.0)
        self.fov_v_rad = 2.0 * math.atan(math.tan(self.fov_h_rad / 2.0) * self.aspect_ratio)
        self.fov_v_deg = math.degrees(self.fov_v_rad)
        self.fy = self.fx

    def project_world_to_camera_frame(self,
                                      target_world_pos: np.ndarray,
                                      gimbal_azimuth_deg: float,
                                      gimbal_elevation_deg: float,
                                      base_pos: np.ndarray = np.array([0.0, 0.0, 0.0])) -> Dict[str, Any]:
        """
        Projects a 3D target point into the camera's 2D image plane based on gimbal orientation.
        Uses exact spherical basis vector decomposition.
        """
        # Relative vector from base terminal to target (World coordinates: X=East, Y=North, Z=Up)
        P_world = np.array(target_world_pos) - np.array(base_pos)
        distance = float(np.linalg.norm(P_world))
        
        if distance < 1e-3:
            distance = 1e-3

        # Gimbal orientation angles in radians
        az_rad = math.radians(gimbal_azimuth_deg)
        el_rad = math.radians(gimbal_elevation_deg)
        
        # Unit basis vectors of the Gimbal/Camera coordinate system in World frame:
        # Forward Optical Boresight (along pointing direction)
        v_forward = np.array([
            math.sin(az_rad) * math.cos(el_rad),
            math.cos(az_rad) * math.cos(el_rad),
            math.sin(el_rad)
        ])
        
        # Camera Right vector (+X_cam)
        v_right = np.array([
            math.cos(az_rad),
            -math.sin(az_rad),
            0.0
        ])
        
        # Camera Up vector (+Z_cam)
        v_up = np.array([
            -math.sin(az_rad) * math.sin(el_rad),
            -math.cos(az_rad) * math.sin(el_rad),
            math.cos(el_rad)
        ])
        
        # Project world position onto camera basis vectors
        x_cam = float(np.dot(P_world, v_right))    # Right
        z_forward = float(np.dot(P_world, v_forward))  # Forward optical depth
        y_up = float(np.dot(P_world, v_up))        # Up
        
        # Target is behind the camera plane
        if z_forward <= 0.1:
            return {
                "in_fov": False,
                "behind_camera": True,
                "u": None,
                "v": None,
                "norm_u": None,
                "norm_v": None,
                "apparent_radius_px": 8.0,
                "delta_az_deg": None,
                "delta_el_deg": None,
                "pointing_error_mrad": 999.0,
                "range_m": round(distance, 2)
            }

        # Pinhole projection onto image plane (u: right, v: down)
        u_ideal = self.fx * (x_cam / z_forward) + self.cx
        v_ideal = self.cy - (self.fy * (y_up / z_forward))
        
        # Add realistic sensor noise
        noise_u = float(np.random.normal(0, self.sensor_noise_sigma)) if self.sensor_noise_sigma > 0 else 0.0
        noise_v = float(np.random.normal(0, self.sensor_noise_sigma)) if self.sensor_noise_sigma > 0 else 0.0
        
        u = float(u_ideal + noise_u)
        v = float(v_ideal + noise_v)
        
        # Check if within sensor boundaries
        in_fov = (0 <= u < self.width) and (0 <= v < self.height)
        
        # Angular offset relative to optical boresight
        delta_az_rad = math.atan((u - self.cx) / self.fx)
        delta_el_rad = math.atan((self.cy - v) / self.fy)
        
        delta_az_deg = math.degrees(delta_az_rad)
        delta_el_deg = math.degrees(delta_el_rad)
        pointing_error_mrad = math.sqrt(delta_az_rad**2 + delta_el_rad**2) * 1000.0
        
        # Apparent beacon size in pixels
        apparent_radius_px = max(6.0, min(100.0, (2.0 * self.fx) / max(1.0, distance)))
        
        return {
            "in_fov": in_fov,
            "behind_camera": False,
            "u": round(u, 2),
            "v": round(v, 2),
            "norm_u": round(u / self.width, 4),
            "norm_v": round(v / self.height, 4),
            "apparent_radius_px": round(apparent_radius_px, 1),
            "delta_az_deg": round(delta_az_deg, 4),
            "delta_el_deg": round(delta_el_deg, 4),
            "pointing_error_mrad": round(pointing_error_mrad, 3),
            "range_m": round(distance, 2)
        }
