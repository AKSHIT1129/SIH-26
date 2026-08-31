"""
FastAPI Application & Real-Time WebSocket Telemetry Engine
AI-Based Virtual Camera Tracking System for Coarse Alignment of Mobile FSOC Terminals
ISRO Problem Statement ID: 26169
"""

import asyncio
import json
import time
import numpy as np
from typing import Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel

from app.core.kinematics_3d import TargetKinematics3D
from app.core.virtual_camera import VirtualCamera
from app.core.ai_detector import AITargetDetector
from app.core.kalman_tracker import KalmanPredictiveTracker
from app.core.gimbal_controller import GimbalPIDController
from app.core.fsoc_optics import FSOCOpticsEngine
from app.core.benchmark_logger import ISROBenchmarkLogger


app = FastAPI(
    title="ISRO FSOC AI Virtual Camera Tracking Engine",
    description="Software Digital Twin & Benchmark System for Mobile Free Space Optical Communication Terminals (PS ID: 26169)",
    version="1.0.0"
)

# Enable CORS for local React/Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize core subsystems
kinematics = TargetKinematics3D()
camera = VirtualCamera()
detector = AITargetDetector()
tracker = KalmanPredictiveTracker()
gimbal = GimbalPIDController()
optics = FSOCOpticsEngine()
logger = ISROBenchmarkLogger()

# Global state
simulation_running = True
simulation_speed_multiplier = 1.0


class ConfigPayload(BaseModel):
    trajectory_mode: Optional[str] = None
    target_speed: Optional[float] = None
    weather: Optional[str] = None
    laser_power_mw: Optional[float] = None
    beam_divergence_mrad: Optional[float] = None
    fov_deg: Optional[float] = None
    gimbal_slew_rate: Optional[float] = None
    gimbal_kp: Optional[float] = None
    gimbal_ki: Optional[float] = None
    gimbal_kd: Optional[float] = None
    wind_turbulence: Optional[float] = None


class OcclusionPayload(BaseModel):
    occluded: bool


import os
from fastapi.staticfiles import StaticFiles

# Resolve frontend directory path
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))


@app.get("/api/benchmark/report")
def get_benchmark_report():
    """Returns the official automated ISRO performance metrics report."""
    report = logger.compute_summary_metrics()
    return JSONResponse(content=report)


@app.get("/api/benchmark/csv")
def download_benchmark_csv():
    """Generates and downloads the telemetry dataset as a CSV file."""
    csv_data = logger.export_csv()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ISRO_FSOC_Tracking_Benchmark.csv"}
    )


@app.post("/api/config")
def update_configuration(config: ConfigPayload):
    """Updates optical, gimbal, trajectory, and atmospheric parameters."""
    if config.trajectory_mode or config.target_speed is not None:
        kinematics.set_trajectory_mode(
            mode=config.trajectory_mode or kinematics.trajectory_mode,
            speed=config.target_speed
        )
    if config.weather or config.laser_power_mw is not None or config.beam_divergence_mrad is not None:
        optics.configure(
            wavelength_nm=1550.0,
            tx_power_mw=config.laser_power_mw if config.laser_power_mw is not None else optics.tx_power_mw,
            beam_divergence_mrad=config.beam_divergence_mrad if config.beam_divergence_mrad is not None else (optics.beam_div_rad * 1000.0),
            weather=config.weather or optics.current_weather
        )
    if config.fov_deg is not None:
        camera.configure_lens(config.fov_deg, camera.focal_length_mm, camera.sensor_noise_sigma)
    if config.gimbal_kp is not None or config.gimbal_slew_rate is not None or config.gimbal_ki is not None or config.gimbal_kd is not None:
        gimbal.configure(
            kp=config.gimbal_kp if config.gimbal_kp is not None else gimbal.kp,
            ki=config.gimbal_ki if config.gimbal_ki is not None else gimbal.ki,
            kd=config.gimbal_kd if config.gimbal_kd is not None else gimbal.kd,
            max_slew_rate=config.gimbal_slew_rate if config.gimbal_slew_rate is not None else gimbal.max_slew_rate,
            lock_threshold=gimbal.lock_threshold_deg
        )
    if config.wind_turbulence is not None:
        kinematics.set_wind_and_turbulence(config.wind_turbulence, kinematics.platform_jitter_amplitude)

    return {
        "status": "SUCCESS", 
        "message": "Parameters updated successfully.",
        "active_trajectory": kinematics.trajectory_mode,
        "speed": kinematics.speed,
        "weather": optics.current_weather
    }


@app.post("/api/occlusion")
def toggle_occlusion(payload: OcclusionPayload):
    """Manually triggers target occlusion (behind clouds/buildings)."""
    kinematics.trigger_occlusion(payload.occluded)
    return {"status": "SUCCESS", "is_occluded": payload.occluded}


@app.post("/api/reset")
def reset_simulation():
    """Resets the simulation, Kalman filter, and benchmark loggers."""
    kinematics.t = 0.0
    tracker.reset()
    gimbal.reset_integrators()
    logger.reset()
    return {"status": "SUCCESS", "message": "Simulation and benchmark logger reset."}


@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """
    High-frequency real-time WebSocket telemetry stream.
    Runs the closed-loop tracking pipeline at 60 FPS and streams complete Digital Twin state to frontend.
    """
    await websocket.accept()
    last_loop_time = time.perf_counter()

    try:
        while True:
            t_start = time.perf_counter()
            dt = max(0.005, min(0.05, t_start - last_loop_time))
            last_loop_time = t_start

            # 1. Kinematics Update (Advance mobile target position)
            target_data = kinematics.update(dt * simulation_speed_multiplier)
            target_pos = np.array(target_data["position"])
            is_target_occluded = target_data["is_occluded"]

            # 2. Virtual Camera Perspective Projection
            cam_data = camera.project_world_to_camera_frame(
                target_world_pos=target_pos,
                gimbal_azimuth_deg=gimbal.azimuth_deg,
                gimbal_elevation_deg=gimbal.elevation_deg
            )

            # 3. AI Perception & Object/Beacon Detection
            visibility = 0.9 if optics.current_weather == "clear" else (0.5 if optics.current_weather == "haze" else 0.2)
            ai_data = detector.detect(
                projected_cam_data=cam_data,
                is_occluded=is_target_occluded,
                atmospheric_visibility=visibility
            )

            # 4. Extended Kalman Filter (EKF) State Estimation & Trajectory Extrapolation
            measurement = (cam_data["u"], cam_data["v"]) if (ai_data["detected"] and cam_data["u"] is not None) else None
            kf_data = tracker.update(
                measurement=measurement,
                dt=dt,
                cam_width=camera.width,
                cam_height=camera.height
            )

            # 5. Coarse Alignment Gimbal PID Controller
            tracking_active = kf_data["is_initialized"] and (kf_data["state_label"] != "LOST_SEARCHING")
            gimbal_data = gimbal.update(
                target_u=kf_data["estimated_u"],
                target_v=kf_data["estimated_v"],
                fx=camera.fx,
                fy=camera.fy,
                cx=camera.cx,
                cy=camera.cy,
                dt=dt,
                tracking_active=tracking_active
            )

            # 6. FSOC Optical Link Budget & Physics Calculation
            pointing_error_mrad = gimbal_data["total_error_mrad"]
            optics_data = optics.calculate_link_budget(
                pointing_error_mrad=pointing_error_mrad,
                range_m=cam_data["range_m"],
                is_occluded=is_target_occluded
            )

            # 7. Processing Latency calculation
            t_end = time.perf_counter()
            processing_latency_ms = (t_end - t_start) * 1000.0 + ai_data["inference_time_ms"]

            # 8. Record to ISRO Performance Logger
            logger.record_frame(
                sim_time=target_data["time"],
                tracking_error_deg=gimbal_data["total_error_deg"],
                tracking_error_mrad=pointing_error_mrad,
                processing_latency_ms=processing_latency_ms,
                is_locked=gimbal_data["is_locked"],
                is_occluded=is_target_occluded,
                in_fov=cam_data["in_fov"],
                rssi_dbm=optics_data["rssi_dbm"],
                snr_db=optics_data["snr_db"],
                ber=optics_data["ber"]
            )

            # 9. Construct Telemetry Packet
            telemetry_packet = {
                "timestamp": target_data["time"],
                "target": target_data,
                "camera": {
                    "width": camera.width,
                    "height": camera.height,
                    "fov_h_deg": camera.fov_h_deg,
                    "fov_v_deg": camera.fov_v_deg,
                    "in_fov": cam_data["in_fov"],
                    "u": cam_data["u"],
                    "v": cam_data["v"],
                    "apparent_radius_px": cam_data.get("apparent_radius_px", 10.0),
                    "range_m": cam_data["range_m"]
                },
                "ai": ai_data,
                "kalman": kf_data,
                "gimbal": gimbal_data,
                "optics": optics_data,
                "performance": {
                    "latency_ms": round(processing_latency_ms, 2),
                    "locked_frames": logger.locked_frames,
                    "total_frames": logger.frame_count,
                    "initial_acquisition_sec": logger.initial_acquisition_time or "In Progress"
                }
            }

            # Send telemetry to client
            await websocket.send_text(json.dumps(telemetry_packet))

            # Maintain ~60 FPS rate (16.6 ms cycle)
            elapsed = time.perf_counter() - t_start
            sleep_time = max(0.001, (1.0 / 60.0) - elapsed)
            await asyncio.sleep(sleep_time)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket Error: {e}")


# Mount static frontend files for the Web UI (at root)
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

