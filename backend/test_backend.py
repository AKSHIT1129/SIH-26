"""
Automated Verification & Unit Test Suite for SIH 2026 PS ID: 26169 (ISRO)
Validates mathematical models and behavioral dynamics:

1. Pipeline integration (7 subsystems):
   - 3D Kinematics & Target trajectories
   - Virtual Camera pinhole projection
   - AI Perception bounding box extraction
   - Extended Kalman Filter (EKF) state estimation
   - 2-Axis Gimbal PID coarse alignment
   - FSOC Optical physics (Gaussian beam, BER, RSSI)
   - Automated ISRO Benchmark logger

2. Specific behavioral tests:
   - EKF state uncertainty covariance growth during extended occlusion
   - Gimbal slew rate clamping at maximum hardware limit (45 deg/s) & monotonic error reduction
   - Optical link budget causality (error increase -> power decrease -> BER degradation)
   - Atmospheric channel attenuation scaling across weather presets (Clear vs. Fog)
"""

import sys
import numpy as np
from app.core.kinematics_3d import TargetKinematics3D
from app.core.virtual_camera import VirtualCamera
from app.core.ai_detector import AITargetDetector
from app.core.kalman_tracker import KalmanPredictiveTracker
from app.core.gimbal_controller import GimbalPIDController
from app.core.fsoc_optics import FSOCOpticsEngine
from app.core.benchmark_logger import ISROBenchmarkLogger


def test_full_pipeline():
    print("\n--- [1] Testing 3D Kinematics Engine ---")
    kinematics = TargetKinematics3D()
    kinematics.set_trajectory_mode("orbit", speed=20.0)
    data = kinematics.update(0.1)
    assert "position" in data and len(data["position"]) == 3
    assert data["distance"] > 0
    print(f"[PASS] Target Position: {data['position']}, Distance: {data['distance']:.2f} m, Azimuth: {data['true_azimuth_deg']:.2f} deg")

    print("\n--- [2] Testing Virtual Camera Projection ---")
    camera = VirtualCamera()
    cam_data = camera.project_world_to_camera_frame(
        target_world_pos=np.array(data["position"]),
        gimbal_azimuth_deg=data["true_azimuth_deg"],
        gimbal_elevation_deg=data["true_elevation_deg"]
    )
    assert cam_data["in_fov"] is True
    assert cam_data["u"] is not None and cam_data["v"] is not None
    print(f"[PASS] Camera Pixel Coords: u={cam_data['u']}, v={cam_data['v']}, Angular Error: {cam_data['pointing_error_mrad']:.3f} mrad")

    print("\n--- [3] Testing AI Perception & Detector ---")
    detector = AITargetDetector()
    ai_data = detector.detect(cam_data, is_occluded=False, atmospheric_visibility=1.0)
    assert ai_data["detected"] is True
    assert ai_data["confidence"] > 0.5
    print(f"[PASS] AI Detection: {ai_data['target_class']}, Confidence: {ai_data['confidence']*100:.1f}%, BBox: {ai_data['bbox']}")

    print("\n--- [4] Testing EKF State Estimation & Occlusion Predictor ---")
    tracker = KalmanPredictiveTracker()
    kf_data = tracker.update((cam_data["u"], cam_data["v"]), dt=0.016)
    assert kf_data["state_label"] in ["ACQUIRING", "TRACKING"]
    print(f"[PASS] EKF Tracking State: {kf_data['state_label']}, Est: ({kf_data['estimated_u']}, {kf_data['estimated_v']})")
    
    # Test Occlusion Trajectory Extrapolation (Missing measurement for 10 frames)
    for _ in range(10):
        kf_data_occ = tracker.update(None, dt=0.016)
    assert kf_data_occ["state_label"] == "OCCLUSION_PREDICTING"
    assert len(kf_data_occ["future_trajectory"]) > 0
    print(f"[PASS] EKF Occlusion Handling: Status={kf_data_occ['state_label']}, Extrapolated Horizon Steps={len(kf_data_occ['future_trajectory'])}")

    print("\n--- [5] Testing Gimbal PID Coarse Alignment ---")
    gimbal = GimbalPIDController()
    gimbal_data = gimbal.update(
        target_u=cam_data["u"],
        target_v=cam_data["v"],
        fx=camera.fx,
        fy=camera.fy,
        cx=camera.cx,
        cy=camera.cy,
        dt=0.016,
        tracking_active=True
    )
    assert "error_azimuth_deg" in gimbal_data
    print(f"[PASS] Gimbal Alignment: Azimuth={gimbal_data['gimbal_azimuth_deg']} deg, Total Error={gimbal_data['total_error_deg']} deg ({gimbal_data['total_error_mrad']} mrad)")

    print("\n--- [6] Testing FSOC Optical Physics & Link Budget ---")
    optics = FSOCOpticsEngine(wavelength_nm=1550.0, tx_power_mw=100.0)
    link_data = optics.calculate_link_budget(
        pointing_error_mrad=gimbal_data["total_error_mrad"],
        range_m=cam_data["range_m"],
        is_occluded=False
    )
    assert "rssi_dbm" in link_data and "ber" in link_data
    print(f"[PASS] FSOC Link: RSSI={link_data['rssi_dbm']} dBm, SNR={link_data['snr_db']} dB, BER={link_data['ber_scientific']}, Status={link_data['link_status']}")

    print("\n--- [7] Testing ISRO Automated Benchmark Report Generator ---")
    logger = ISROBenchmarkLogger()
    for step in range(50):
        logger.record_frame(
            sim_time=step * 0.016,
            tracking_error_deg=0.25,
            tracking_error_mrad=4.36,
            processing_latency_ms=6.5,
            is_locked=True,
            is_occluded=False,
            in_fov=True,
            rssi_dbm=-18.5,
            snr_db=26.5,
            ber=1e-9
        )
    report = logger.compute_summary_metrics()
    assert report["summary_metrics"]["lock_retention_rate_pct"] == 100.0
    print(f"[PASS] ISRO Performance Report: Lock Retention={report['summary_metrics']['lock_retention_rate_pct']}%, Avg Error={report['tracking_precision_metrics']['average_tracking_error_deg']} deg")
    
    csv_out = logger.export_csv()
    assert len(csv_out) > 50
    print(f"[PASS] CSV Export generated ({len(csv_out)} bytes)")
    
    print("\n=======================================================")
    print(" >>> ALL 7 ISRO BACKEND SUBSYSTEM TESTS PASSED (100%) <<<")
    print("=======================================================\n")


def test_behavioral_dynamics():
    print("\n--- [Behavioral Test 1] EKF Covariance Growth Under Occlusion ---")
    tracker = KalmanPredictiveTracker()
    # Initialize with 5 valid measurements
    init_res = None
    for i in range(5):
        init_res = tracker.update((960.0 + i * 2.0, 540.0 + i * 1.0), dt=0.016)
    
    initial_sigma = init_res["position_uncertainty_px"]
    sigmas = [initial_sigma]
    
    # Coast through 30 frames of missing measurements (0.5s occlusion)
    for _ in range(30):
        res = tracker.update(None, dt=0.016)
        sigmas.append(res["position_uncertainty_px"])
    
    # Verify monotonic uncertainty growth
    assert sigmas[-1] > sigmas[0], f"Expected final sigma ({sigmas[-1]}) > initial sigma ({sigmas[0]})"
    print(f"[PASS] EKF Uncertainty correctly grew from {sigmas[0]:.2f} px to {sigmas[-1]:.2f} px during occlusion.")

    print("\n--- [Behavioral Test 2] Gimbal Slew Rate Clamping & Monotonic Error Reduction ---")
    gimbal = GimbalPIDController(max_slew_rate_deg_s=45.0)
    fx, fy, cx, cy = 1000.0, 1000.0, 960.0, 540.0
    
    # Introduce a 100-pixel target offset
    target_u, target_v = 1060.0, 540.0
    
    prev_error = float('inf')
    for step in range(20):
        out = gimbal.update(target_u, target_v, fx, fy, cx, cy, dt=0.016, tracking_active=True)
        # Slew rates must be clamped within physical motor limits
        assert abs(out["slew_rate_az"]) <= 45.0 + 1e-3, f"Slew rate exceeded limit: {out['slew_rate_az']}"
        assert abs(out["slew_rate_el"]) <= 45.0 + 1e-3, f"Slew rate exceeded limit: {out['slew_rate_el']}"
        
        # In a closed-loop scenario, as the gimbal rotates, pixel error reduces
        target_u -= out["slew_rate_az"] * 0.016 * (fx * (np.pi / 180.0))
        curr_error = abs(target_u - cx)
        if step > 5:
            assert curr_error < prev_error or curr_error < 2.0
        prev_error = curr_error

    print(f"[PASS] Gimbal slew rate strictly bounded to <= 45.0 deg/s and error reduced to {curr_error:.2f} px.")

    print("\n--- [Behavioral Test 3] FSOC Optical Link Budget Causality ---")
    optics = FSOCOpticsEngine(wavelength_nm=1550.0, tx_power_mw=100.0)
    
    # Evaluate at 0 mrad, 4.36 mrad (0.25 deg), and 12.0 mrad (misaligned)
    link_0 = optics.calculate_link_budget(pointing_error_mrad=0.0, range_m=250.0)
    link_mid = optics.calculate_link_budget(pointing_error_mrad=4.36, range_m=250.0)
    link_high = optics.calculate_link_budget(pointing_error_mrad=12.0, range_m=250.0)
    
    assert link_0["rssi_dbm"] > link_mid["rssi_dbm"] > link_high["rssi_dbm"], "RSSI did not drop with pointing error!"
    assert link_0["ber"] <= link_mid["ber"] <= link_high["ber"], "BER did not increase with pointing error!"
    print(f"[PASS] Causal Link Verified: 0 mrad -> {link_0['rssi_dbm']:.1f} dBm (BER {link_0['ber_scientific']}) | 12 mrad -> {link_high['rssi_dbm']:.1f} dBm (BER {link_high['ber_scientific']})")

    print("\n--- [Behavioral Test 4] Atmospheric Channel Attenuation Scaling ---")
    optics_clear = FSOCOpticsEngine()
    optics_clear.configure(1550.0, 100.0, 2.0, weather="clear")
    res_clear = optics_clear.calculate_link_budget(pointing_error_mrad=1.0, range_m=500.0)
    
    optics_fog = FSOCOpticsEngine()
    optics_fog.configure(1550.0, 100.0, 2.0, weather="fog")
    res_fog = optics_fog.calculate_link_budget(pointing_error_mrad=1.0, range_m=500.0)
    
    assert res_clear["rssi_dbm"] > res_fog["rssi_dbm"], "Dense fog should attenuate significantly more than clear sky!"
    print(f"[PASS] Weather Attenuation: Clear Sky={res_clear['rssi_dbm']:.2f} dBm vs. Dense Fog={res_fog['rssi_dbm']:.2f} dBm")

    print("\n--- [Behavioral Test 5] AI Perception Temporal Beacon Acquisition Delay ---")
    detector = AITargetDetector(acquisition_duration_s=1.0)
    mock_cam = {
        "in_fov": True,
        "behind_camera": False,
        "u": 960.0,
        "v": 540.0,
        "range_m": 250.0,
        "apparent_radius_px": 12.0
    }
    # Frame 1: Initial candidate detection, acquiring
    res_f1 = detector.detect(mock_cam, is_occluded=False, dt=0.016)
    assert res_f1["detected"] is False, "Detector should not instantly confirm lock on frame 1"
    assert res_f1["detection_state"] == "ACQUIRING"
    assert res_f1["acquisition_progress_pct"] < 10.0
    
    # Progress through 0.5s of integration
    for _ in range(30):
        res_mid = detector.detect(mock_cam, is_occluded=False, dt=0.016)
    assert res_mid["detected"] is False
    assert res_mid["acquisition_progress_pct"] >= 40.0
    
    # Complete remaining frames past 1.0s threshold
    for _ in range(40):
        res_final = detector.detect(mock_cam, is_occluded=False, dt=0.016)
    assert res_final["detected"] is True
    assert res_final["detection_state"] == "DETECTED"
    assert res_final["acquisition_progress_pct"] == 100.0
    print(f"[PASS] Temporal Detection Acquisition Verified: Frame 1 (Acquiring, {res_f1['acquisition_progress_pct']}%) -> 0.5s ({res_mid['acquisition_progress_pct']}%) -> 1.0s (Confirmed Locked {res_final['confidence']*100:.1f}%)")

    print("\n=======================================================")
    print(" >>> ALL BEHAVIORAL DYNAMICS TESTS PASSED (100%) <<<")
    print("=======================================================\n")


if __name__ == "__main__":
    test_full_pipeline()
    test_behavioral_dynamics()
