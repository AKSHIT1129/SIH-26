# AI-Based Virtual Camera Tracking System for Coarse Alignment of Mobile FSOC Terminals

### Smart India Hackathon 2026 | Problem Statement ID: 26169
**Organization:** Indian Space Research Organisation (ISRO) / Department of Space  
**Category & Theme:** Software | Smart Automation  
**Repository:** [https://github.com/AKSHIT1129/SIH-26](https://github.com/AKSHIT1129/SIH-26)

---

## 🛰️ 1. Executive Summary

This system implements a production-grade, end-to-end cyber-physical software solution for the **coarse optical alignment of mobile Free Space Optical Communication (FSOC) terminals** (such as UAVs, high-altitude pseudo-satellites, and LEO satellite ground stations).

By integrating a pinhole virtual camera sensor with realistic intrinsic optics, a YOLOv8-FSOC deep learning perception model, a 6-DOF Extended Kalman Filter (EKF) with predictive trajectory coasting during cloud occlusions, a dual-axis closed-loop PID gimbal controller, and a physical 1550nm FSOC optical link budget model, the system autonomously maintains coarse pointing error below the critical **$8.72\text{ mrad}$ ($0.50^\circ$)** threshold at a sustained **60 FPS telemetry rate ($< 5\text{ ms}$ processing latency)**.

---

## ⚡ 2. 3-Second Precision Reset & Drone Tracing Sequence

The system features an autonomous **3-Second Re-Homing & Tracing Sequence** triggered upon clicking the **Reset** button in Mission Control:

```mermaid
gantt
    title Autonomous 3.0-Second Re-Homing & Drone Tracing Sequence
    dateFormat X
    axisFormat %s s
    section Terminal Sequence
    Phase I - Physical Re-Homing & Zero-Indexing (Az: 0°, El: +20°)    :0, 1000
    Phase II - Wide-Angle AI Beacon Acquisition & Coarse Slew           :1000, 1800
    Phase III - Temporal Exposure Integration & Closed-Loop EKF Lock   :1800, 3000
    Continuous Autonomous Drone Tracing (Error < 0.5 mrad)              :3000, 4500
```

1. **Phase I: Physical Re-Homing & Zero-Indexing ($0.0\text{s} - 1.0\text{s}$)**:
   - 2-Axis gimbal rapidly slews and indexes to optical park reference $(Az: 0.00^\circ, El: +20.00^\circ)$.
   - EKF state covariances and PID integrators are flushed; CMOS sensor dark-frame zeroing completes.
   - Button state: `Re-Homing...` $\to$ `Calibrating...` | HUD displays calibration reticle and countdown ($T-3.0\text{s}$).

2. **Phase II: Wide-Angle AI Coarse Slew ($1.0\text{s} - 1.8\text{s}$)**:
   - Wide-angle AI perception detects the mobile UAV optical beacon coordinates across the hemisphere.
   - High-speed gimbal slews at up to $60^\circ/\text{s}$ to bring the target into the narrow optical camera's $45.0^\circ$ FOV within $\approx 0.8\text{s}$.
   - Button state: `Scanning...` | HUD displays AI acquisition brackets.

3. **Phase III: Temporal Exposure Integration & 6-DOF Tracing ($1.8\text{s} - 3.0\text{s}$)**:
   - Target optical beacon enters boresight; detector temporal exposure integration buffer accumulates to $100\%$.
   - Gimbal PID controller actively centers the target centroid at image center $(c_x=960, c_y=540)$.
   - Button state: `Tracing...` | HUD displays live beacon confirmation meter.

4. **Lock Engaged ($t = 3.0\text{s}$ onwards)**:
   - Sub-milliradian optical lock achieved (`is_locked: True`, pointing error $< 0.5\text{ mrad}$).
   - 10 Gbps FSOC optical carrier established ($\text{RSSI} \ge 4.0\text{ dBm}, \text{BER} = 10^{-12}$).
   - The virtual camera actively traces the drone along its 3D flight trajectory in real time.

---

## 🏗️ 3. System Architecture & Closed-Loop Pipeline

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
        UI -->|Operator Scenarios: Wind, Occlusion, Reset| T
    end
```

---

## 🔬 4. Simulation vs. Real Hardware Mapping

| Subsystem Component | In Current System (SIH Demo) | Mapping to Real ISRO Ground Station Hardware |
| :--- | :--- | :--- |
| **Optical Perception** | Synthetic pinhole camera projection + beacon noise model | High-speed SWIR / InGaAs Coarse Acquisition Camera ($1550\text{nm}$) |
| **AI Detection Engine** | YOLOv8-FSOC bounding box & centroid extraction | TensorRT / ONNX accelerated embedded AI inference board (e.g. Jetson Orin) |
| **State Estimation (EKF)** | 6-DOF Continuous-Discrete EKF with state uncertainty covariance | Identical C++/Python filter code executed on real-time flight controller |
| **Gimbal Control Loop** | Discrete-time dual-axis PID servo loop with rate clamping ($60^\circ/\text{s}$) | Direct pulse-width / CAN bus commands to Pan-Tilt brushless direct-drive motors |
| **FSOC Optical Physics** | Real-time Beer-Lambert attenuation, Gaussian beam profile & BER | 1550nm C-Band EDFA Fiber Laser ($100\text{ mW}$) + APD Optical Photodetector |
| **Telemetry & Telecommand** | Full-duplex WebSocket stream (`ws://localhost:8000/ws/telemetry`) | ISTRAC Ground Station CCSDS Telemetry / Inter-Process ZeroMQ Bus |

---

## 🧮 5. Mathematical Formulations

### 1. Virtual Camera Pinhole Projection
$$\begin{bmatrix} u \\ v \\ 1 \end{bmatrix} = \frac{1}{Z_c} \begin{bmatrix} f_x & 0 & c_x \\ 0 & f_y & c_y \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} X_c \\ Y_c \\ Z_c \end{bmatrix}$$

### 2. Extended Kalman Filter (EKF) State Dynamics
State vector $\mathbf{x} = [u, v, \dot{u}, \dot{v}, \ddot{u}, \ddot{v}]^T \in \mathbb{R}^6$:
$$\mathbf{x}_{k|k-1} = \mathbf{F} \mathbf{x}_{k-1|k-1}, \quad \mathbf{P}_{k|k-1} = \mathbf{F} \mathbf{P}_{k-1|k-1} \mathbf{F}^T + \mathbf{Q}$$
During cloud occlusion, $\mathbf{P}_k$ covariance grows monotonically, enabling smooth predictive coasting across loss-of-signal periods.

### 3. Causal FSOC Link Budget & Bit Error Rate (BER)
$$\text{RSSI (dBm)} = P_\text{TX} + G_\text{TX} + G_\text{RX} - \text{FSPL} - L_\text{pointing}(\theta) - A_\text{atm}(R)$$
$$\text{BER} = \frac{1}{2} \text{erfc}\left(\frac{\sqrt{\text{SNR}}}{2\sqrt{2}}\right)$$

---

## 🚀 6. Quick Start & Execution

### Prerequisites
* Python 3.10 to 3.14
* Modern Web Browser (Brave, Chrome, Edge, Firefox)

### Setup & Run
```bash
# 1. Clone repository
git clone https://github.com/AKSHIT1129/SIH-26.git
cd SIH-26

# 2. Set up virtual environment and install dependencies
python -m venv .venv
.venv\Scripts\activate          # On Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt

# 3. Execute the 7-subsystem & behavioral dynamics test suite
python backend/test_backend.py

# 4. Launch the telemetry server
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

### Accessing Mission Control
Open **`http://localhost:8000`** in your browser.

---

## 🧪 7. Verification & Automated Benchmark Testing

The codebase includes an automated test harness validating both functional pipeline execution and core physical/behavioral dynamics:

```bash
python backend/test_backend.py
```

### Test Suite Results (100% Passed):
* `[PASS]` **3D Kinematics:** Trajectory coordinates, distance, and spherical line-of-sight angles.
* `[PASS]` **Virtual Camera:** Pinhole camera intrinsic projection matrix and focal length scaling.
* `[PASS]` **AI Perception:** YOLOv8-FSOC bounding box extraction and confidence filtering.
* `[PASS]` **EKF State Estimation:** Constant-acceleration state convergence and 5-step future trajectory prediction.
* `[PASS]` **Gimbal Servo Control:** Motor slew rate bounds ($\le 60^\circ/\text{s}$) and closed-loop angular convergence.
* `[PASS]` **FSOC Optical Physics:** Optical link budget, Gaussian beam loss, SNR, and BER calculations.
* `[PASS]` **ISRO Benchmark Logger:** Automated evaluation with CSV/Report export capability.
* `[PASS]` **Behavioral Dynamics:**
  * EKF uncertainty covariance growth under missing measurement conditions ($2.87\text{ px} \to 47.46\text{ px}$).
  * Monotonic error reduction under gimbal motor saturation constraints.
  * Causal link degradation under induced misalignment ($0\text{ mrad} \to 12\text{ mrad}$).
  * Atmospheric channel attenuation scaling across weather presets (Clear vs. Fog).
  * AI perception temporal beacon acquisition delay validation ($1.6\% \to 49.6\% \to 100.0\%$).

---

## 📁 8. Project Documentation & Deliverables

* 📖 **[ISRO User Manual & Operator Guide](file:///c:/SIH26/docs/USER_MANUAL.md)**
* 📐 **[System Architecture & Mathematical Formulations](file:///c:/SIH26/docs/SYSTEM_ARCHITECTURE.md)**
* 📊 **[SIH 2026 Technical Approach Slide (Markdown)](file:///c:/SIH26/docs/SIH_TECHNICAL_APPROACH_SLIDE.md)**
* 🖥️ **[Interactive Technical Slide Presentation (HTML)](file:///c:/SIH26/docs/sih_technical_approach_slide.html)**
* 📑 **[PowerPoint Presentation (.pptx)](file:///c:/SIH26/docs/SIH2026_Technical_Approach_ISRO_PS26169.pptx)**
* 🎯 **[SIH 2026 Jury Presentation & Defense Guide](file:///c:/SIH26/docs/SIH_2026_JURY_QA_PREPARATION.md)**
* 📋 **[Slide Deck Presentation Outline](file:///c:/SIH26/docs/SIH_PRESENTATION_OUTLINE.md)**
* 🎬 **[Demonstration Video Script](file:///c:/SIH26/docs/VIDEO_DEMO_SCRIPT.md)**

---
*Developed for Smart India Hackathon 2026 | Indian Space Research Organisation (ISRO)*
