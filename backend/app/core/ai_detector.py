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
                 model_name: str = "YOLOv8-FSOC-Aero",
                 acquisition_duration_s: float = 1.25):
        self.model_name = model_name
        self.base_confidence = detection_confidence_base
        self.false_positive_rate = false_positive_rate
        self.acquisition_duration_s = acquisition_duration_s
        self.acquisition_timer = 0.0
        self.detection_state = "SEARCHING"  # SEARCHING, ACQUIRING, DETECTED, OCCLUDED
        self.detection_history = []
        self.inference_time_ms = 4.2  # Typical TensorRT/ONNX GPU inference time

    def reset(self):
        """Flushes temporal detection integration buffer upon reset or loss-of-lock."""
        self.acquisition_timer = 0.0
        self.detection_state = "SEARCHING"
        self.detection_history.clear()

    def detect(self,
               projected_cam_data: Dict[str, Any],
               is_occluded: bool = False,
               atmospheric_visibility: float = 1.0,
               enable_active_tracing: bool = True,
               dt: Optional[float] = None) -> Dict[str, Any]:
        """
        Runs perception algorithm on current virtual camera frame.
        When target first enters FOV, requires a realistic optical sensor exposure integration
        and temporal confirmation delay (~1.25s) before confirming lock.
        When cloud occlusion is active, deploys active SWIR laser tracing probe to receive
        the drone's transponder/retro-reflector echo return signal through the cloud layer.
        """
        start_time = time.perf_counter()
        
        # If target is outside FOV or behind camera
        if not projected_cam_data.get("in_fov", False) or projected_cam_data.get("behind_camera", False):
            if dt is not None:
                self.acquisition_timer = max(0.0, self.acquisition_timer - 1.5 * dt)
            else:
                self.acquisition_timer = 0.0
            self.detection_state = "SEARCHING"
            
            inference_dur = (time.perf_counter() - start_time) * 1000.0 + self.inference_time_ms
            return {
                "detected": False,
                "detection_state": "SEARCHING",
                "acquisition_progress_pct": 0.0,
                "target_class": None,
                "confidence": 0.0,
                "bbox": None,
                "centroid": None,
                "inference_time_ms": round(inference_dur, 2),
                "reason": "OUT_OF_FOV",
                "active_tracer_locked": False
            }

        dist = projected_cam_data.get("range_m", 200.0)
        u = projected_cam_data["u"]
        v = projected_cam_data["v"]
        radius = projected_cam_data["apparent_radius_px"]

        # Synthesize 2D bounding box [xmin, ymin, width, height]
        box_w = max(24.0, radius * 2.4)
        box_h = max(20.0, radius * 2.0)
        xmin = u - box_w / 2.0
        ymin = v - box_h / 2.0

        # When target is occluded by clouds:
        if is_occluded:
            if enable_active_tracing:
                # Active SWIR cloud-penetrating tracing probe receives drone transponder echo
                noise = np.random.normal(0, 0.008)
                confidence = float(np.clip(0.982 + noise, 0.94, 0.999))
                inference_dur = (time.perf_counter() - start_time) * 1000.0 + self.inference_time_ms
                self.detection_state = "DETECTED"
                self.acquisition_timer = self.acquisition_duration_s

                return {
                    "detected": True,
                    "detection_state": "DETECTED",
                    "acquisition_progress_pct": 100.0,
                    "target_class": "SWIR_ACTIVE_TRACER_ECHO",
                    "confidence": round(confidence, 4),
                    "bbox": [round(xmin, 1), round(ymin, 1), round(box_w, 1), round(box_h, 1)],
                    "centroid": [round(u, 2), round(v, 2)],
                    "apparent_radius_px": round(radius, 1),
                    "inference_time_ms": round(inference_dur, 2),
                    "model": "SWIR-LIDAR-ActiveTracer",
                    "active_tracer_locked": True,
                    "drone_echo_received": True,
                    "cloud_penetration_pct": 98.6
                }
            else:
                if dt is not None:
                    self.acquisition_timer = max(0.0, self.acquisition_timer - 2.0 * dt)
                self.detection_state = "OCCLUDED"
                inference_dur = (time.perf_counter() - start_time) * 1000.0 + self.inference_time_ms
                return {
                    "detected": False,
                    "detection_state": "OCCLUDED",
                    "acquisition_progress_pct": 0.0,
                    "target_class": None,
                    "confidence": 0.0,
                    "bbox": None,
                    "centroid": None,
                    "inference_time_ms": round(inference_dur, 2),
                    "reason": "OCCLUDED_WITHOUT_TRACER",
                    "active_tracer_locked": False
                }

        # Handle temporal beacon exposure integration & acquisition delay
        if dt is not None:
            self.acquisition_timer = min(self.acquisition_duration_s, self.acquisition_timer + dt)
            progress = min(100.0, (self.acquisition_timer / max(1e-4, self.acquisition_duration_s)) * 100.0)
            is_acquired = self.acquisition_timer >= self.acquisition_duration_s
        else:
            # Immediate acquisition when dt is omitted (for static unit tests)
            self.acquisition_timer = self.acquisition_duration_s
            progress = 100.0
            is_acquired = True

        # Standard optical detection in clear/hazy conditions
        dist_factor = np.clip(1.0 - (dist / 10000.0), 0.5, 1.0)
        atm_factor = np.clip(atmospheric_visibility, 0.2, 1.0)
        noise = np.random.normal(0, 0.015)
        base_conf = float(np.clip(self.base_confidence * dist_factor * atm_factor + noise, 0.0, 0.999))

        inference_dur = (time.perf_counter() - start_time) * 1000.0 + self.inference_time_ms

        if not is_acquired:
            # Target is candidate in FOV; integrating optical beacon frames
            self.detection_state = "ACQUIRING"
            acq_confidence = float(np.clip(0.30 + 0.65 * (progress / 100.0) + noise, 0.15, 0.95))
            return {
                "detected": False,
                "detection_state": "ACQUIRING",
                "acquisition_progress_pct": round(progress, 1),
                "target_class": "CANDIDATE_OPTICAL_BEACON",
                "confidence": round(acq_confidence, 3),
                "bbox": [round(xmin, 1), round(ymin, 1), round(box_w, 1), round(box_h, 1)],
                "centroid": [round(u, 2), round(v, 2)],
                "apparent_radius_px": round(radius, 1),
                "inference_time_ms": round(inference_dur, 2),
                "model": self.model_name,
                "reason": "ACQUIRING_TEMPORAL_INTEGRATION",
                "active_tracer_locked": False
            }

        if base_conf < 0.40:
            self.detection_state = "SEARCHING"
            return {
                "detected": False,
                "detection_state": "SEARCHING",
                "acquisition_progress_pct": round(progress, 1),
                "target_class": "UAV_OPTICAL_TERMINAL",
                "confidence": round(base_conf, 3),
                "bbox": None,
                "centroid": None,
                "inference_time_ms": round(inference_dur, 2),
                "reason": "LOW_CONFIDENCE_SIGNAL",
                "active_tracer_locked": False
            }

        self.detection_state = "DETECTED"
        return {
            "detected": True,
            "detection_state": "DETECTED",
            "acquisition_progress_pct": 100.0,
            "target_class": "UAV_OPTICAL_TERMINAL",
            "confidence": round(base_conf, 4),
            "bbox": [round(xmin, 1), round(ymin, 1), round(box_w, 1), round(box_h, 1)],
            "centroid": [round(u, 2), round(v, 2)],
            "apparent_radius_px": round(radius, 1),
            "inference_time_ms": round(inference_dur, 2),
            "model": self.model_name,
            "active_tracer_locked": False
        }
