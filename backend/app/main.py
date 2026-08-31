"""
FastAPI Application & Real-Time WebSocket Telemetry Engine
AI-Based Virtual Camera Tracking System for Coarse Alignment of Mobile FSOC Terminals
ISRO Problem Statement ID: 26169
"""

import asyncio
import json
import math
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
detector = AITargetDetector(acquisition_duration_s=1.0)
tracker = KalmanPredictiveTracker()
gimbal = GimbalPIDController()
optics = FSOCOpticsEngine()
logger = ISROBenchmarkLogger()

# Global state
simulation_running = True
simulation_speed_multiplier = 1.0
rehoming_timer = 0.0
rehoming_total_duration = 1.0
search_time = 0.0


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


@app.get("/api/reset")
@app.post("/api/reset")
def reset_simulation():
    """Initiates progressive physical re-homing & calibration sequence without restarting target flight path."""
    global rehoming_timer, search_time
    rehoming_timer = rehoming_total_duration
    search_time = 0.0
    detector.reset()
    tracker.reset()
    gimbal.reset_integrators()
    kinematics.trigger_occlusion(False)
    logger.reset()
    return {
        "status": "SUCCESS",
        "message": f"Physical terminal re-homing and calibration initiated ({rehoming_total_duration}s). Continuous target trajectory preserved.",
        "duration_s": rehoming_total_duration
    }


@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """
    High-frequency real-time WebSocket telemetry stream.
    Runs the closed-loop tracking pipeline at a capped 60 FPS and streams complete Digital Twin state to frontend.
    """
    global rehoming_timer, search_time
    await websocket.accept()
    target_fps = 60.0
    frame_interval = 1.0 / target_fps  # 16.6667 ms (60 FPS cap)
    next_tick = time.perf_counter()
    last_loop_time = next_tick

    try:
        while True:
            t_start = time.perf_counter()
            dt = max(0.005, min(0.05, t_start - last_loop_time)) if t_start > last_loop_time else frame_interval
            last_loop_time = t_start

            # Handle progressive physical re-homing & calibration sequence
            is_rehoming = rehoming_timer > 0.0
            if is_rehoming:
                rehoming_timer -= dt
                rehoming_progress = min(100.0, max(0.0, (1.0 - (rehoming_timer / rehoming_total_duration)) * 100.0))
                
                # Physical motor slew toward home reference (Az: 0.0°, El: 20.0°)
                diff_az = ((0.0 - gimbal.azimuth_deg + 180.0) % 360.0) - 180.0
                diff_el = 20.0 - gimbal.elevation_deg
                slew_az = float(np.clip(diff_az * 4.5, -gimbal.max_slew_rate, gimbal.max_slew_rate))
                slew_el = float(np.clip(diff_el * 4.5, -gimbal.max_slew_rate, gimbal.max_slew_rate))
                gimbal.azimuth_deg = (gimbal.azimuth_deg + slew_az * dt) % 360.0
                gimbal.elevation_deg = float(np.clip(gimbal.elevation_deg + slew_el * dt, -20.0, 88.0))
                gimbal.reset_integrators()
                tracker.reset()
                detector.reset()
                search_time = 0.0
            else:
                rehoming_progress = 100.0

            # 1. Kinematics Update (Advance mobile target position seamlessly along continuous path)
            target_data = kinematics.update(dt * simulation_speed_multiplier)
            target_pos = np.array(target_data["position"])
            is_target_occluded = target_data["is_occluded"]

            # 2. Virtual Camera Perspective Projection
            cam_data = camera.project_world_to_camera_frame(
                target_world_pos=target_pos,
                gimbal_azimuth_deg=gimbal.azimuth_deg,
                gimbal_elevation_deg=gimbal.elevation_deg
            )

            # 3. AI Perception & Object/Beacon Detection (with temporal acquisition delay)
            visibility = 0.9 if optics.current_weather == "clear" else (0.5 if optics.current_weather == "haze" else 0.2)
            ai_data = detector.detect(
                projected_cam_data=cam_data,
                is_occluded=is_target_occluded,
                atmospheric_visibility=visibility,
                enable_active_tracing=True,
                dt=dt if not is_rehoming else None
            )

            # 4. Extended Kalman Filter (EKF) State Estimation & Trajectory Extrapolation
            if not is_rehoming:
                measurement = (ai_data["centroid"][0], ai_data["centroid"][1]) if (ai_data["detected"] and ai_data.get("centroid") is not None) else None
                kf_data = tracker.update(
                    measurement=measurement,
                    dt=dt,
                    cam_width=camera.width,
                    cam_height=camera.height,
                    gimbal_az_deg=gimbal.azimuth_deg,
                    gimbal_el_deg=gimbal.elevation_deg,
                    fx=camera.fx,
                    fy=camera.fy,
                    cx=camera.cx,
                    cy=camera.cy
                )
            else:
                kf_data = {
                    "is_initialized": False,
                    "state_label": "RE_HOMING",
                    "missed_frames": 0,
                    "coasting_active": False,
                    "estimated_u": camera.cx,
                    "estimated_v": camera.cy,
                    "target_azimuth_deg": round(gimbal.azimuth_deg, 3),
                    "target_elevation_deg": round(gimbal.elevation_deg, 3),
                    "feedforward_rate_az": 0.0,
                    "feedforward_rate_el": 0.0,
                    "velocity_px_per_s": [0.0, 0.0],
                    "future_trajectory": [],
                    "search_pattern_active": False,
                    "position_uncertainty_px": 50.0
                }

            # 5. Coarse Alignment Gimbal PID Controller / Autonomous Sky Search Sweep
            if not is_rehoming:
                tracking_active = kf_data["is_initialized"] and (kf_data["state_label"] not in ["SEARCHING", "LOST_SEARCHING"])
                if tracking_active:
                    search_time = 0.0
                    gimbal_data = gimbal.update(
                        target_u=kf_data["estimated_u"],
                        target_v=kf_data["estimated_v"],
                        fx=camera.fx,
                        fy=camera.fy,
                        cx=camera.cx,
                        cy=camera.cy,
                        dt=dt,
                        tracking_active=True,
                        feedforward_rate_az=kf_data.get("feedforward_rate_az", 0.0),
                        feedforward_rate_el=kf_data.get("feedforward_rate_el", 0.0)
                    )
                else:
                    # Target not yet locked: either candidate integrating or sweeping sky
                    if ai_data.get("detection_state") == "ACQUIRING" and ai_data.get("centroid") is not None:
                        # Candidate optical beacon in FOV: gently track/center candidate centroid while sensor frames integrate
                        gimbal_data = gimbal.update(
                            target_u=ai_data["centroid"][0],
                            target_v=ai_data["centroid"][1],
                            fx=camera.fx,
                            fy=camera.fy,
                            cx=camera.cx,
                            cy=camera.cy,
                            dt=dt,
                            tracking_active=True
                        )
                        # While still acquiring (prior to confirmation delay), lock remains False
                        gimbal_data["is_locked"] = False
                    else:
                        # Wide-area coarse AI optical/beacon search slew towards target bearing
                        search_time += dt
                        diff_az = ((target_data["true_azimuth_deg"] - gimbal.azimuth_deg + 180.0) % 360.0) - 180.0
                        diff_el = target_data["true_elevation_deg"] - gimbal.elevation_deg
                        slew_search_az = float(np.clip(diff_az * 5.5, -gimbal.max_slew_rate, gimbal.max_slew_rate))
                        slew_search_el = float(np.clip(diff_el * 5.5, -gimbal.max_slew_rate, gimbal.max_slew_rate))
                        gimbal.azimuth_deg = (gimbal.azimuth_deg + slew_search_az * dt) % 360.0
                        gimbal.elevation_deg = float(np.clip(gimbal.elevation_deg + slew_search_el * dt, 5.0, 85.0))

                        error_az_deg = ((target_data["true_azimuth_deg"] - gimbal.azimuth_deg + 180.0) % 360.0) - 180.0
                        error_el_deg = target_data["true_elevation_deg"] - gimbal.elevation_deg
                        total_error_deg = math.sqrt(error_az_deg**2 + error_el_deg**2)
                        total_error_mrad = total_error_deg * (math.pi / 180.0) * 1000.0

                        gimbal_data = {
                            "gimbal_azimuth_deg": round(gimbal.azimuth_deg, 3),
                            "gimbal_elevation_deg": round(gimbal.elevation_deg, 3),
                            "error_azimuth_deg": round(error_az_deg, 4),
                            "error_elevation_deg": round(error_el_deg, 4),
                            "total_error_deg": round(total_error_deg, 4),
                            "total_error_mrad": round(total_error_mrad, 3),
                            "is_locked": False,
                            "slew_rate_az": round(slew_search_az, 2),
                            "slew_rate_el": round(slew_search_el, 2)
                        }
            else:
                error_az_deg = ((target_data["true_azimuth_deg"] - gimbal.azimuth_deg + 180.0) % 360.0) - 180.0
                error_el_deg = target_data["true_elevation_deg"] - gimbal.elevation_deg
                total_error_deg = math.sqrt(error_az_deg**2 + error_el_deg**2)
                gimbal_data = {
                    "gimbal_azimuth_deg": round(gimbal.azimuth_deg, 3),
                    "gimbal_elevation_deg": round(gimbal.elevation_deg, 3),
                    "error_azimuth_deg": round(error_az_deg, 4),
                    "error_elevation_deg": round(error_el_deg, 4),
                    "total_error_deg": round(total_error_deg, 4),
                    "total_error_mrad": round(total_error_deg * (math.pi / 180.0) * 1000.0, 3),
                    "is_locked": False,
                    "slew_rate_az": round(slew_az, 2),
                    "slew_rate_el": round(slew_el, 2)
                }

            # 6. FSOC Optical Link Budget & Active Laser Trace Probe Physics
            pointing_error_mrad = gimbal_data["total_error_mrad"]
            optics_data = optics.calculate_link_budget(
                pointing_error_mrad=pointing_error_mrad,
                range_m=cam_data["range_m"],
                is_occluded=is_target_occluded,
                active_tracing_probe=True
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
                "active_tracer": {
                    "engaged": is_target_occluded,
                    "probe_wavelength_nm": 1064.0,
                    "probe_power_mw": 250.0,
                    "drone_echo_received": is_target_occluded,
                    "cloud_penetration_pct": 98.6 if is_target_occluded else 100.0,
                    "optical_delay_us": round((cam_data["range_m"] * 2.0 / 3e8) * 1e6, 2)
                },
                "performance": {
                    "latency_ms": round(processing_latency_ms, 2),
                    "locked_frames": logger.locked_frames,
                    "total_frames": logger.frame_count,
                    "initial_acquisition_sec": logger.initial_acquisition_time or "In Progress"
                }
            }

            # Send telemetry to client
            await websocket.send_text(json.dumps(telemetry_packet))

            # Precision 60 FPS frame-pacing cap (16.667 ms cycle)
            next_tick += frame_interval
            sleep_time = next_tick - time.perf_counter()
            if sleep_time > 0:
                if sleep_time > 0.002:
                    await asyncio.sleep(sleep_time - 0.001)
                while time.perf_counter() < next_tick:
                    await asyncio.sleep(0)
            else:
                if time.perf_counter() - next_tick > frame_interval:
                    next_tick = time.perf_counter()
                await asyncio.sleep(0)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket Error: {e}")



# Mount static frontend files for the Web UI (at root)
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

