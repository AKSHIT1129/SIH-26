# Frontend Architecture, Component Specifications & Development Roadmap
### ISRO AI-Based Virtual Camera Tracking System for Mobile FSOC Terminals (PS ID: 26169)

---

## 📌 1. Overview & Objective

The frontend of the **ISRO FSOC Tracking System** is an aerospace-grade **Mission Control & Digital Twin Telemetry Console**. It visualizes a real-time cyber-physical closed loop (60 FPS telemetry stream) tracking mobile optical communication targets (such as UAVs, high-altitude platforms, and LEO satellite passes) using Free Space Optical Communication (FSOC).

This document serves as the **complete technical specification and developer roadmap** for frontend engineers who want to understand, build, style, or port this frontend to modern frameworks (e.g., React, Next.js, Vue, or Vanilla WebGL).

```
+----------------------------------------------------------------------------------------------------+
|                                    MISSION CONTROL HEADER BAR                                      |
|  [ISRO Logo / PS 26169]  |  Sim Time: 01:24.50  |  FPS: 60.0  |  Latency: 4.2ms  |  State: [LOCK]  |
+----------------------------------------------------------------------------------------------------+
|                                      KPI & 5-STEP PIPELINE STRIP                                   |
|  Pointing Error: 2.84 mrad (0.163°) | Max Limit: 8.72 mrad (0.50°) | Margin: +5.88 mrad            |
|  [1. Target Flight] -> [2. AI Detection] -> [3. EKF Prediction] -> [4. Gimbal Slew] -> [5. Laser Lock]
+-------------------------------------------------+--------------------------------------------------+
| SECTION I: 3D Spatial Digital Twin              | SECTION II: Optical Virtual Camera & AI HUD      |
| - Three.js 3D World (Ground Station + UAV)      | - 1st-Person Optical Camera (Telescope View)     |
| - 1550nm Laser LOS Line & Trajectory Trail      | - YOLOv8 AI Bounding Box & Centroid              |
| - Dynamic Cloud Occlusion Volumetric Mesh       | - EKF 5-step Prediction Horizon & Covariance     |
| - Satellite Minimap Radar Inset                 | - 8.72 mrad Coarse Alignment Tolerance Reticle   |
+-------------------------------------------------+--------------------------------------------------+
| SECTION III: Link Budget & Gimbal Actuation     | SECTION IV: Tracking Quality & Environment       |
| - Gimbal Azimuth & Elevation (with Slew Rate)   | - AI Beacon Confidence & EKF Precision           |
| - Optical RSSI (dBm / µW) & 10 Gbps Lock Status | - Target Trajectory Mode & Speed (m/s)           |
| - Bit Error Rate (BER) & Optical SNR (dB)       | - Atmospheric Channel Attenuation (dB/km)        |
+-------------------------------------------------+--------------------------------------------------+
| SECTION V: Real-time Pointing Error Plot        | SECTION VI: Mission Timeline Event Feed          |
| - Scrolling Chart.js / WebGL Error Graph (mrad) | - Live chronological log of mission milestones:  |
| - Red Threshold Line at 8.72 mrad limit         |   Acquisition, Cloud Occlusion, Slew Clamping    |
+-------------------------------------------------+--------------------------------------------------+
| MODALS: [System Parameters Config Drawer]  |  [ISRO Automated Performance Benchmark Report]        |
+----------------------------------------------------------------------------------------------------+
```

---

## 🧱 2. Frontend Component Hierarchy & Module Breakdown

The frontend consists of **8 decoupled core modules**:

```mermaid
graph TD
    App[app.js Root Entrypoint] --> Net[1. NetworkClient (WebSocket)]
    Net --> Twin[2. DigitalTwin3D (Three.js 3D Scene)]
    Net --> VCam[3. VirtualCameraView (1st-Person Optical View)]
    Net --> HUD[4. EOIRTrackingHUD (2D Canvas Reticle)]
    Net --> Map[5. TacticalMinimap (2D Radar Satellite Inset)]
    Net --> Tel[6. TelemetryConsole (DOM Metrics & KPI Strip)]
    Net --> Chart[7. ErrorChart (Chart.js Telemetry Graph)]
    Net --> Feed[8. EngineeringEventFeed (Timeline Logger)]
    App --> Modals[Config Drawer & Benchmark Report Modals]
```

### Module 1: Network & Telemetry Client (`NetworkClient`)
* **Role**: Manages WebSocket lifecycle (`ws://<host>:<port>/ws/telemetry`), calculates ping-pong latency, handles auto-reconnect with exponential backoff, and broadcasts parsed JSON telemetry packets to all consumer subsystems at 60 Hz.
* **REST Handlers**:
  - `POST /api/config`: Updates trajectory preset, weather channel, laser power, divergence, FOV, slew limit, and PID gains.
  - `POST /api/scenario/occlude`: Triggers synthetic cloud occlusion.
  - `POST /api/scenario/wind`: Injects wind disturbance.
  - `POST /api/scenario/reset`: Resets state estimator and simulation clock.
  - `GET /api/benchmark/report`: Retrieves structured JSON evaluation report.
  - `GET /api/benchmark/csv`: Downloads complete timestamped run log in CSV format.

### Module 2: 3D Spatial Digital Twin (`DigitalTwin3D`)
* **Technology**: Three.js WebGL Renderer + OrbitControls.
* **Responsibilities**:
  - Renders the Sriharikota Launch Range environment (procedural satellite terrain texture, runway markings, coordinate grid).
  - Ground Optical Terminal (pedestal, dual-axis yoke, optical telescope barrel with azimuth and elevation rotations).
  - Mobile Target Model (UAV airframe with spinning rotor blades, altitude trail, target velocity vector).
  - 1550nm FSOC Laser Beam Line: Color-coded dynamic laser cylinder connecting ground station aperture to target beacon (Green when pointing error $\le 8.72\text{ mrad}$, Red when misaligned).
  - Volumetric Cloud Occlusion Mesh: Appears dynamically across line-of-sight during occlusion scenarios.
  - Multi-Camera Modes:
    - `Free Cam`: 360° interactive orbital inspection.
    - `Follow Cam`: Smoothly tracks UAV position with offset.
    - `Terminal Cam`: Positioned on ground station pedestal looking up at target.

### Module 3: Optical Virtual Camera Viewport (`VirtualCameraView`)
* **Technology**: Dedicated Three.js WebGL Viewport sharing the main 3D world scene.
* **Responsibilities**:
  - Implements the exact 1st-person telescope perspective from the ground terminal's optical boresight.
  - Updates camera orientation directly from gimbal azimuth and elevation angles ($\text{pitch} = \text{el}$, $\text{yaw} = -\text{az}$).
  - Dynamically updates camera FOV ($45.0^\circ$ default) and aspect ratio.

### Module 4: EO/IR Optical Tracking HUD Overlay (`EOIRTrackingHUD`)
* **Technology**: HTML5 2D Canvas layered directly over the optical telescope viewport.
* **Visual Elements Rendered at 60 FPS**:
  - **Center Boresight Crosshair**: Optical terminal alignment origin $(u_0, v_0)$.
  - **8.72 mrad ($0.50^\circ$) Coarse Alignment Boundary Box**: Physical acceptance window for coarse-to-fine handover. Changes from cyan to emerald green when locked, amber when recovering, and red during beam drop.
  - **YOLOv8 AI Detection Box**: Yellow bounding box around detected beacon with confidence tag (e.g., `UAV_BEACON 98.4%`).
  - **6-DOF Extended Kalman Filter (EKF) State**:
    - Filtered centroid estimate $(\hat{u}, \hat{v})$.
    - Uncertainty Covariance Ellipse ($3\sigma$ confidence bounds) expanding during cloud occlusions.
    - 5-Step Trajectory Prediction Horizon trail showing future motion.
  - **State Badges**: `ACQUIRING`, `COARSE_LOCKED`, `OCCLUSION_COASTING`, `RE-ACQUIRING`.

### Module 5: Tactical Satellite Minimap (`TacticalMinimap`)
* **Technology**: 2D Canvas / Map Inset.
* **Responsibilities**: Displays top-down radar projection of ground station origin $(0,0)$ and moving target $(x,y)$, heading arrow, distance rings ($100\text{m}, 250\text{m}, 500\text{m}$), and GPS latitude/longitude readouts.

### Module 6: Telemetry & KPI Deck (`TelemetryConsole`)
* **Responsibilities**:
  - **Pointing Error Hero Counter**: Displays error in $\text{mrad}$ and degrees with color transitions.
  - **5-Step Live Tracking Pipeline Bar**:
    `1. Target Flight` $\to$ `2. AI Detection` $\to$ `3. EKF Prediction` $\to$ `4. Gimbal Slew` $\to$ `5. Laser Lock` (illuminates active stage).
  - **Actuation Metrics**: Gimbal Azimuth/Elevation angles and slew rates ($\le 45^\circ/\text{s}$).
  - **Link Budget Metrics**: RSSI ($\text{dBm}$ & $\mu\text{W}$), SNR ($\text{dB}$), Bit Error Rate (BER), and 10 Gbps carrier lock status.
  - **Environment Metrics**: Trajectory mode, speed ($\text{m/s}$), atmospheric channel loss ($\text{dB/km}$), transmitter power ($\text{mW}$).

### Module 7: Real-Time Error Plot (`ErrorChart`)
* **Technology**: Chart.js (with streaming buffer / ring buffer of last 100 frames).
* **Responsibilities**:
  - Plots continuous pointing error in $\text{mrad}$ over time.
  - Static horizontal threshold line at $8.72\text{ mrad}$.
  - Real-time statistical readouts: Current error, RMS error, Peak error.

### Module 8: Mission Timeline Event Feed (`EngineeringEventFeed`)
* **Responsibilities**:
  - Logs timestamped mission milestones (e.g., `[00:01.20] TARGET DETECTED: YOLOv8-FSOC confidence 98.2%`, `[00:04.50] COARSE ALIGNMENT LOCK: Error 2.14 mrad`, `[00:12.80] CLOUD OCCLUSION: EKF trajectory coasting active`).
  - Auto-scrolls to latest event with severity badge filtering (`INFO`, `LOCK`, `WARN`, `ALERT`).

---

## 📡 3. Telemetry WebSocket Data Contract

The backend broadcasts a single, structured JSON payload over WebSocket at 60 FPS:

```json
{
  "timestamp": 12.45,
  "target": {
    "time": 12.45,
    "position": [180.4, 95.2, 120.0],
    "velocity": [12.5, -4.2, 0.5],
    "speed": 15.0,
    "distance": 225.6,
    "azimuth_deg": 142.5,
    "elevation_deg": 28.4,
    "is_occluded": false
  },
  "camera": {
    "width": 1920,
    "height": 1080,
    "fov_h_deg": 45.0,
    "fov_v_deg": 25.3,
    "in_fov": true,
    "u": 984.2,
    "v": 528.6,
    "apparent_radius_px": 18.4,
    "range_m": 225.6
  },
  "ai": {
    "detected": true,
    "confidence": 0.984,
    "bbox": [965.8, 510.2, 36.8, 36.8],
    "centroid": [984.2, 528.6],
    "inference_time_ms": 3.8
  },
  "kalman": {
    "tracking_status": "COARSE_LOCKED",
    "estimated_u": 982.5,
    "estimated_v": 530.1,
    "estimated_vu": 12.4,
    "estimated_vv": -4.2,
    "sigma_pos": 1.40,
    "prediction_horizon": [
      [994.9, 525.9],
      [1007.3, 521.7],
      [1019.7, 517.5],
      [1032.1, 513.3],
      [1044.5, 509.1]
    ]
  },
  "gimbal": {
    "current_azimuth_deg": 142.2,
    "current_elevation_deg": 28.3,
    "slew_rate_az": 12.4,
    "slew_rate_el": 8.1,
    "error_az_deg": 0.124,
    "error_el_deg": -0.082,
    "total_error_deg": 0.149,
    "total_error_mrad": 2.84,
    "is_locked": true
  },
  "optics": {
    "rssi_dbm": -18.4,
    "received_power_uw": 14.45,
    "snr_db": 28.5,
    "ber": 1.20e-9,
    "link_margin_db": 12.4,
    "channel_loss_db": 0.05,
    "is_locked": true,
    "link_status": "LOCKED_OPTIMAL"
  },
  "performance": {
    "latency_ms": 4.2,
    "locked_frames": 745,
    "total_frames": 750,
    "initial_acquisition_sec": 0.42
  }
}
```

---

## 🎨 4. Design System & Styling Guidelines

* **Color Palette (Dark Tactical Aerospace Theme)**:
  - Background Canvas: `#060709` / `#0D1117` (Deep Obsidian / Space Navy)
  - Card & Panel Surfaces: `#131822` (Translucent Glassmorphic Border: `rgba(255,255,255,0.08)`)
  - Accent / Primary Action: `#EAB308` (ISRO Amber / Optical Gold)
  - Locked Status: `#10B981` / `#059669` (Emerald Green)
  - Cloud Occlusion / Warning: `#F59E0B` (Amber Alert)
  - Misalignment / Link Drop: `#EF4444` (Crimson Red)
  - Cyan Telecom Data: `#38BDF8` / `#0284C7` (Sky Optical Blue)
* **Typography**:
  - Monospace Data Figures: `"IBM Plex Mono"`, `"Roboto Mono"`
  - UI Labels & Headers: `"IBM Plex Sans"`, `"Inter"`, `"Cinzel"` (for ISRO Title)

---

## 🗺️ 5. Step-by-Step Frontend Development Roadmap

If a team member is building or re-architecting the frontend, follow this structured 6-phase roadmap:

| Phase | Milestone | Deliverables & Tasks |
| :--- | :--- | :--- |
| **Phase 1** | **Project Setup & WebSocket Plumbing** | • Initialize React/Next.js/HTML project.<br>• Set up `WebSocket` hook/service connecting to `ws://localhost:8000/ws/telemetry`.<br>• Verify 60 Hz deserialization and FPS counter. |
| **Phase 2** | **KPI Deck & Top Navigation** | • Implement Header with Sim Time, FPS, Latency, and State badge.<br>• Build the Hero Pointing Error counter ($\text{mrad}$ and $^\circ$).<br>• Implement the 5-Step Pipeline Strip (`Flight` $\to$ `AI` $\to$ `EKF` $\to$ `Gimbal` $\to$ `Laser`). |
| **Phase 3** | **Three.js 3D Spatial Digital Twin** | • Set up Three.js scene, lighting, and ground terrain.<br>• Build ground station model and target UAV with coordinate transformations.<br>• Add dynamic 1550nm Laser beam line (color-reactive) and trajectory trails.<br>• Add camera controls (`Free Cam`, `Follow Cam`, `Terminal Cam`). |
| **Phase 4** | **Optical Virtual Camera & 2D HUD** | • Create 2nd Three.js viewport synchronized with gimbal azimuth/elevation.<br>• Create overlay Canvas drawing AI BBox, EKF centroid, covariance ellipse, and 5-step horizon.<br>• Add 8.72 mrad tolerance boundary box reticle. |
| **Phase 5** | **Telemetry Panels & Analytics** | • Implement Link & Actuation panel (Az/El slew rates, RSSI, BER, SNR).<br>• Implement Tracking Conditions panel (AI confidence, weather preset).<br>• Integrate real-time scrolling Error Chart with 8.72 mrad redline limit.<br>• Implement auto-scrolling Event Feed. |
| **Phase 6** | **Scenario Controls & Benchmark Report** | • Add Scenario trigger buttons (`Occlusion test`, `Wind disturbance`, `Reset`).<br>• Build System Parameters Configuration Drawer (`POST /api/config`).<br>• Build ISRO Benchmark Report Modal with automated metrics table and CSV/PDF export. |

---

## 📂 6. Existing Frontend Code Reference

The complete working Vanilla JS + Three.js implementation is located in:
* 📄 **HTML Template**: [`frontend/index.html`](file:///c:/SIH26/frontend/index.html)
* 🎨 **Design System & CSS**: [`frontend/styles.css`](file:///c:/SIH26/frontend/styles.css)
* ⚙️ **All Logic & 3D Renderers**: [`frontend/app.js`](file:///c:/SIH26/frontend/app.js)
