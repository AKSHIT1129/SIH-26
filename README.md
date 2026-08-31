# AI-Based Virtual Camera Tracking System for Coarse Alignment of Mobile FSOC Terminals

### Smart India Hackathon 2026 | Problem Statement ID: 26169
**Organization:** Indian Space Research Organisation (ISRO) / Department of Space  
**Category & Theme:** Software | Smart Automation

---

## 🛰️ 1. Executive Summary

This system implements an end-to-end, closed-loop software solution for the **coarse optical alignment of mobile Free Space Optical Communication (FSOC) terminals** (such as UAVs, high-altitude platforms, and LEO satellite ground passes). 

By integrating a virtual pinhole camera sensor, real-time AI optical beacon detection, a 6-DOF Extended Kalman Filter (EKF) with continuous trajectory extrapolation during cloud occlusions, a dual-axis closed-loop PID gimbal controller, and a physical 1550nm FSOC optical link budget model, the system autonomously maintains coarse pointing error below the critical **$8.72\text{ mrad}$ ($0.50^\circ$)** threshold at a sustained **60 FPS telemetry rate ($< 5\text{ ms}$ processing latency)**.

---

## 🏗️ 2. System Architecture & Closed-Loop Pipeline

The pipeline operates as a continuous closed-loop cyber-physical control system:

```mermaid
flowchart TD
    subgraph "1. Dynamic Kinematic Simulation"
        T[3D Target Trajectory Engine] -->|World Position [x,y,z]| VC[Virtual Pinhole Camera Model]
        ENV[Atmospheric Channel & Cloud Extinction] -->|Turbulence & Visibility| VC
    end

    subgraph "2. AI Perception & State Estimation"
        VC -->|Sensor Frame (1920x1080)| AI[AI Target Detector YOLOv8-FSOC]
        AI -->|Centroid & Bounding Box| EKF[6-DOF Extended Kalman Filter]
        ENV -.->|Occlusion Signal| EKF
        EKF -->|Predicted Centroid & Trajectory Horizon| PID[2-Axis Gimbal PID Controller]
    end

    subgraph "3. Actuation & Optical Physics"
        PID -->|Azimuth & Elevation Slew Rates| GIMBAL[Pan-Tilt Gimbal Actuator]
        GIMBAL -->|Gimbal Orientation & Pointing Error| LINK[FSOC Optical Link Budget Engine]
        LINK -->|RSSI dBm, SNR dB, BER, 10 Gbps Lock| TEL[Telemetry Streamer 60 FPS]
        GIMBAL -.->|Orientation Feedback| VC
    end

    subgraph "4. Mission Control & Operator Console"
        TEL -->|WebSocket JSON Payload| UI[Three.js 3D Digital Twin & EO/IR HUD]
        UI -->|Operator Scenarios: Wind, Occlusion| T
    end
```

---

## ⚙️ 3. Simulation vs. Real Hardware Mapping

To provide transparency into what was developed for simulation versus what directly deploys to physical hardware:

| Subsystem Component | In Current System (SIH Demo) | Mapping to Real ISRO Ground Station Hardware |
| :--- | :--- | :--- |
| **Optical Perception** | Synthetic pinhole camera projection + beacon noise model | High-speed SWIR / InGaAs Coarse Acquisition Camera ($1550\text{nm}$) |
| **AI Detection Engine** | YOLOv8-FSOC bounding box & centroid extraction | TensorRT / ONNX accelerated embedded AI inference board (e.g. Jetson Orin) |
| **State Estimation (EKF)** | 6-DOF Continuous-Discrete EKF with state uncertainty covariance | Identical C++/Python filter code executed on real-time flight controller |
| **Gimbal Control Loop** | Discrete-time dual-axis PID servo loop with rate clamping ($45^\circ/\text{s}$) | Direct pulse-width / CAN bus commands to Pan-Tilt brushless direct-drive motors |
| **FSOC Optical Physics** | Real-time Beer-Lambert attenuation, Gaussian beam profile & BER | 1550nm C-Band EDFA Fiber Laser ($100\text{ mW}$) + APD Optical Photodetector |
| **Telemetry & Telecommand** | Full-duplex WebSocket stream (`ws://localhost:8000/ws/telemetry`) | ISTRAC Ground Station CCSDS Telemetry / Inter-Process ZeroMQ Bus |

---

## 📐 4. Technical Trade-offs & Engineering Rationale

1. **Why Extended Kalman Filter (EKF) instead of Particle Filter or Simple Moving Average?**
   * **Computational Cost:** An EKF running a 6-state constant-acceleration kinematic model consumes $< 0.4\text{ ms}$ per step on a single CPU core, easily sustaining the mandatory 60 FPS budget. A Particle Filter with thousands of particles would exceed real-time latency limits on embedded terminals without offering meaningful accuracy gains, since target flight dynamics are locally well-approximated as linear over the 1.0–2.0 second prediction horizon.
   * **Graceful Degradation:** During extended cloud occlusions, the covariance matrix $P_k$ grows monotonically, giving the downstream controller an explicit uncertainty metric ($\sigma_\text{pos}$) to decide when to coast versus when to trigger an Archimedean spiral search pattern.

2. **Why 8.72 mrad ($0.50^\circ$) as the Coarse Alignment Threshold?**
   * In a two-stage FSOC acquisition and tracking hierarchy (PAT: Pointing, Acquisition, and Tracking), the **coarse alignment stage** (wide-FOV camera + mechanical gimbal) is responsible for bringing the incoming optical beam into the narrow Field-of-View ($< 1^\circ$) of the **Fine Tracking System (FTS)**. The FTS then uses a Fast Steering Mirror (FSM) and quadrant photodiode to achieve the sub-milliradian ($\approx 10\,\mu\text{rad}$) lock required for fiber coupling. Thus, $8.72\text{ mrad}$ represents the physical acceptance window for coarse-to-fine handover.

3. **Causal Link Budget Consistency:**
   * All optical parameters are physically coupled:
     $$\text{RSSI (dBm)} = P_\text{TX} + G_\text{TX} + G_\text{RX} - \text{FSPL} - L_\text{pointing}(\theta) - A_\text{atm}(R)$$
     $$\text{BER} = \frac{1}{2} \text{erfc}\left(\frac{\sqrt{\text{SNR}}}{2\sqrt{2}}\right)$$
   * Increasing pointing error from $0\text{ mrad}$ to $12\text{ mrad}$ causes the Gaussian intensity profile to roll off rapidly, dropping received power from $+4.2\text{ dBm}$ to $-84.9\text{ dBm}$, which directly forces BER from $10^{-12}$ to $0.465$ (loss of carrier lock).

---

## 🚀 5. Quick Start & Execution

### Prerequisites
* Python 3.10 to 3.14
* Modern Web Browser (Brave, Chrome, Edge, Firefox)

### Setup & Run
```bash
# 1. Clone repository
git clone https://github.com/your-team/SIH26-ISRO-FSOC.git
cd SIH26-ISRO-FSOC

# 2. Set up virtual environment and install dependencies
python -m venv .venv
.venv\Scripts\activate          # On Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt

# 3. Execute the 7-subsystem & behavioral dynamics test suite
python backend/test_backend.py

# 4. Launch the telemetry server
python backend/run.py
```

### Accessing Mission Control
Open **`http://localhost:8000`** in your browser.

---

## 🧪 6. Verification & Automated Benchmark Testing

The codebase includes an automated test harness validating both functional pipeline execution and core physical/behavioral dynamics:

```bash
python backend/test_backend.py
```

### Test Suite Summary:
* `[PASS]` **3D Kinematics:** Trajectory coordinates, distance, and spherical line-of-sight angles.
* `[PASS]` **Virtual Camera:** Pinhole camera intrinsic projection matrix and focal length scaling.
* `[PASS]` **AI Perception:** YOLOv8-FSOC bounding box extraction and confidence filtering.
* `[PASS]` **EKF State Estimation:** Constant-acceleration state convergence and 5-step future trajectory prediction.
* `[PASS]` **Gimbal Servo Control:** Motor slew rate bounds ($\le 45^\circ/\text{s}$) and closed-loop angular convergence.
* `[PASS]` **FSOC Optical Physics:** Optical link budget, Gaussian beam loss, SNR, and BER calculations.
* `[PASS]` **ISRO Benchmark Logger:** 100-frame automated evaluation with CSV/PDF export capability.
* `[PASS]` **Behavioral Dynamics:**
  * EKF uncertainty covariance growth under missing measurement conditions ($1.35\text{ px} \to 2.73\text{ px}$).
  * Monotonic error reduction under gimbal motor saturation constraints.
  * Causal link degradation under induced misalignment.
  * Atmospheric channel attenuation scaling across weather presets.

---

## ⚠️ 7. Known Limitations & Future Work

1. **Coarse-Stage Scope:** This system is engineered specifically for **coarse pointing and acquisition** ($\le 8.72\text{ mrad}$). A production aerospace terminal requires a downstream secondary **Fine Tracking Sensor (FTS)** using a piezo-driven Fast Steering Mirror (FSM) to achieve the microradian-level precision needed for single-mode optical fiber coupling.
2. **Atmospheric Fog Cut-off:** While the EKF successfully bridges transient cloud occlusions ($\le 2.0\text{ s}$), sustained dense optical fog ($> 20\text{ dB/km}$ attenuation over ranges $> 1.5\text{ km}$) reduces SNR below the detector sensitivity threshold, requiring optical-to-RF hybrid failover.
3. **Multi-Target Handover:** The current state machine tracks a single prioritized optical beacon. Support for simultaneous multi-UAV terminal fleet handovers is slated for Version 2.0.

---

## 📄 8. Project Documentation & Deliverables

* 📖 **[ISRO User Manual & Operator Guide](file:///c:/SIH26/docs/USER_MANUAL.md)**
* 📐 **[System Architecture & Mathematical Formulations](file:///c:/SIH26/docs/SYSTEM_ARCHITECTURE.md)**
* 🎯 **[SIH 2026 Jury Presentation & Defense Guide](file:///c:/SIH26/docs/SIH_2026_JURY_QA_PREPARATION.md)**
* 📊 **[Slide Deck Presentation Outline](file:///c:/SIH26/docs/SIH_PRESENTATION_OUTLINE.md)**
* 🎬 **[Demonstration Video Script](file:///c:/SIH26/docs/VIDEO_DEMO_SCRIPT.md)**

---
*Developed for the Smart India Hackathon 2026 | Indian Space Research Organisation (ISRO)*
