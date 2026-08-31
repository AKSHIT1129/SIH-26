"""
AI Perception & Beacon Detection Layer
Simulates real-time deep learning / computer vision object detection (YOLO / MobileNet / HSV Beacon Detector).
Extracts 2D bounding boxes [x, y, w, h], center centroid, detection confidence, and handles false alarms / occlusion misses.
"""

import time
import numpy as np
from typing import Dict, Any, Optional


class AITargetDetector:
    def __init__(self,
                 detection_confidence_base: float = 0.98,
                 false_positive_rate: float = 0.01,
                 model_name: str = "YOLOv8-FSOC-Aero"):
        self.model_name = model_name
        self.base_confidence = detection_confidence_base
        self.false_positive_rate = false_positive_rate
        self.detection_history = []
        self.inference_time_ms = 4.2  # Typical TensorRT/ONNX GPU inference time

    def detect(self,
               projected_cam_data: Dict[str, Any],
               is_occluded: bool = False,
               atmospheric_visibility: float = 1.0) -> Dict[str, Any]:
        """
        Runs perception algorithm on current virtual camera frame.
        Returns detected target bounding box, centroid, confidence, and detection status.
        """
        start_time = time.perf_counter()
        
        # If target is outside FOV or physically occluded by cloud/building
        if not projected_cam_data.get("in_fov", False) or is_occluded or projected_cam_data.get("behind_camera", False):
            # Target not visible
            inference_dur = (time.perf_counter() - start_time) * 1000.0 + self.inference_time_ms
            return {
                "detected": False,
                "target_class": None,
                "confidence": 0.0,
                "bbox": None,
                "centroid": None,
                "inference_time_ms": round(inference_dur, 2),
                "reason": "OCCLUDED_OR_OUT_OF_FOV" if is_occluded else "OUT_OF_FOV"
            }

        # Calculate dynamic confidence affected by distance and atmospheric haze
        dist = projected_cam_data.get("range_m", 200.0)
        u = projected_cam_data["u"]
        v = projected_cam_data["v"]
        radius = projected_cam_data["apparent_radius_px"]
        
        # Distance degradation factor (confidence drops smoothly beyond 5km)
        dist_factor = np.clip(1.0 - (dist / 10000.0), 0.5, 1.0)
        
        # Atmospheric visibility attenuation factor
        atm_factor = np.clip(atmospheric_visibility, 0.2, 1.0)
        
        # Final AI model confidence with small random perturbation
        noise = np.random.normal(0, 0.015)
        confidence = float(np.clip(self.base_confidence * dist_factor * atm_factor + noise, 0.0, 0.999))
        
        # Detection threshold check (e.g. 40% confidence threshold)
        if confidence < 0.40:
            inference_dur = (time.perf_counter() - start_time) * 1000.0 + self.inference_time_ms
            return {
                "detected": False,
                "target_class": "UAV_OPTICAL_TERMINAL",
                "confidence": round(confidence, 3),
                "bbox": None,
                "centroid": None,
                "inference_time_ms": round(inference_dur, 2),
                "reason": "LOW_CONFIDENCE_SIGNAL"
            }

        # Synthesize 2D bounding box [xmin, ymin, width, height]
        box_w = max(24.0, radius * 2.4)
        box_h = max(20.0, radius * 2.0)
        xmin = u - box_w / 2.0
        ymin = v - box_h / 2.0

        inference_dur = (time.perf_counter() - start_time) * 1000.0 + self.inference_time_ms

        result = {
            "detected": True,
            "target_class": "UAV_OPTICAL_TERMINAL",
            "confidence": round(confidence, 4),
            "bbox": [round(xmin, 1), round(ymin, 1), round(box_w, 1), round(box_h, 1)],
            "centroid": [round(u, 2), round(v, 2)],
            "apparent_radius_px": round(radius, 1),
            "inference_time_ms": round(inference_dur, 2),
            "model": self.model_name
        }
        
        return result
