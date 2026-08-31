# SMART INDIA HACKATHON 2026 | TECHNICAL APPROACH SLIDE CONTENT
## Problem Statement ID: 26169 (ISRO / Department of Space)
**Project Title:** AI-Based Virtual Camera Tracking System for Coarse Alignment of Mobile FSOC Terminals  
**Category & Theme:** Software | Smart Automation

---

## 📋 SLIDE OPTION 1: TECH STACK & SYSTEM ARCHITECTURE LAYOUT
*(Formatted for the 2-Column SIH Template with Technology Stack on the Left and Architecture Flow on the Right)*

```
+----------------------------------------------------------------------------------------------------+
|  [TEAM LOGO]                          TECHNICAL APPROACH                      [ISRO & SIH 2026]    |
+---------------------------------------------------+------------------------------------------------+
|  ❖ TECHNOLOGY STACK                               |  ❖ SYSTEM ARCHITECTURE & DATA FLOW             |
|                                                   |                                                |
|  • Frontend & Digital Twin:                       |     +-----------------------------------+      |
|    HTML5 Canvas, Three.js WebGL, Chart.js,        |     | 1. Dynamic 3D Kinematics & Target |      |
|    Vanilla CSS (Glassmorphism), IBM Plex Mono.    |     +-----------------+-----------------+      |
|                                                   |                       | [X_w, Y_w, Z_w]        |
|  • Backend & Real-Time Engine:                    |                       v                        |
|    Python 3.11+, FastAPI (ASGI), Uvicorn,         |     +-----------------------------------+      |
|    NumPy, SciPy, Asyncio, Full-Duplex WebSockets. |     | 2. Virtual Pinhole Camera Sensor  |      |
|                                                   |     +-----------------+-----------------+      |
|  • AI Perception & Vision:                        |                       | Sensor Frame [u, v]    |
|    YOLOv8-FSOC (Ultralytics), ONNX Runtime,       |                       v                        |
|    OpenCV, TensorRT-Ready Edge Inference.         |     +-----------------------------------+      |
|                                                   |     | 3. AI Detector (YOLOv8-FSOC)      |      |
|  • Estimation & Control Algorithms:               |     +-----------------+-----------------+      |
|    6-DOF Extended Kalman Filter (EKF),            |                       | Centroid & Confidence  |
|    Dual-Axis PID Controller with Anti-Windup,     |                       v                        |
|    Slew Rate Limiter (<= 45 deg/s).               |     +-----------------------------------+      |
|                                                   |     | 4. 6-DOF Extended Kalman Filter   | <----+ (Occlusion)
|  • Optical Physics & Link Modeling:               |     +-----------------+-----------------+      |
|    1550nm Laser Physics, Beer-Lambert Extinction, |                       | Predicted State        |
|    Gaussian Beam Profile, SNR & BER Calculation.  |                       v                        |
|                                                   |     +-----------------------------------+      |
|  • Hardware & Embedded Interfaces:                |     | 5. Closed-Loop Dual-Axis Gimbal   |      |
|    STM32 / ESP32, CAN-Bus, Micro-ROS,             |     +-----------------+-----------------+      |
|    Pan-Tilt Servo/Brushless Actuators, gRPC.      |                       | Az/El Slew Commands    |
|                                                   |                       v                        |
|  • Automated Benchmarking & QA:                   |     +-----------------------------------+      |
|    Pytest Engine, ISRO 1-Click CSV/PDF Logger.    |     | 6. FSOC Optical Link (1550nm)     |      |
|                                                   |     +-----------------+-----------------+      |
|  ❖ FSOC Tracking Engine Summary:                  |                       | Pointing Error <= 8.72 mrad
|    Custom YOLOv8 for sub-pixel beacon             |                       v                        |
|    localization, 6-DOF EKF trajectory prediction  |     +-----------------------------------+      |
|    during 2.0s cloud occlusions, 60 FPS real-time |     | 7. 60 FPS Mission Control Twin    |      |
|    telemetry stream with < 5ms pipeline latency.  |     +-----------------------------------+      |
+---------------------------------------------------+------------------------------------------------+
```

### Copy-Paste Text for Slide Option 1:
* **Frontend & Digital Twin:** HTML5 Canvas, Three.js WebGL, OrbitControls, Chart.js, Vanilla CSS Glassmorphism, IBM Plex typography, Full-Duplex WebSockets.
* **Backend & Real-Time Engine:** Python 3.11+, FastAPI (ASGI), Uvicorn Server, NumPy, SciPy (Vectorized Linear Algebra), Asyncio Event Loop.
* **AI & Perception:** Custom YOLOv8-FSOC Beacon Detector, ONNX Runtime, TensorRT-accelerated edge inference, Pinhole Camera Intrinsic Matrix model.
* **Estimation & Control:** 6-DOF Extended Kalman Filter (EKF) with continuous-discrete Riccati propagation, Dual-Axis PID Controller with Anti-Windup & Slew Rate Clamping ($45^\circ/\text{s}$), Archimedean Spiral Search.
* **FSOC Optical Physics:** 1550nm C-Band EDFA Model, Beer-Lambert Extinction Law, Gaussian Intensity Beam Profile, Signal-to-Noise Ratio (SNR), and Complementary Error Function Bit Error Rate ($\text{BER} = \frac{1}{2}\text{erfc}(\frac{\sqrt{\text{SNR}}}{2\sqrt{2}})$).
* **Hardware & Embedded Interfaces:** Micro-ROS, Serial CAN-Bus / gRPC, STM32 / ESP32 Microcontrollers, 2-Axis Pan-Tilt Brushless Direct-Drive Gimbals, InGaAs/SWIR Optical Sensors.
* **Deployment & Benchmarking:** Docker Containerization, Pytest Suite, Automated 1-Click ISRO Benchmark Report Generator (JSON/CSV/PDF).

---

## 📋 SLIDE OPTION 2: METHODOLOGY & PROCESS OF IMPLEMENTATION LAYOUT
*(Formatted for the 3-Section SIH Template with Circular Process on Left, System Illustration in Center, and Technologies Used on Right)*

### Section 1: Methodology & 6-Phase Circular Implementation Flow
1. **Phase 1: Dynamic 3D Kinematics & Channel Simulation**
   * Computes 3D flight trajectories (UAV Figure-8, LEO Satellite Ground Pass, Evasive Maneuver).
   * Injects atmospheric turbulence, weather attenuation (clear, haze, dense fog), and platform vibrations.
2. **Phase 2: Virtual Pinhole Camera Projection**
   * Transforms 3D target coordinates $[X_W, Y_W, Z_W]^T$ into 2D camera pixel coordinates $(u, v)$ using intrinsic matrix $K$.
   * Incorporates focal length scaling, field-of-view limits, and Gaussian optical sensor noise.
3. **Phase 3: AI Beacon & Object Detection (YOLOv8-FSOC)**
   * Performs sub-pixel centroid and bounding box extraction at $< 5\text{ ms}$ processing latency.
   * Filters false optical reflections and detects beacon visibility through changing atmospheric conditions.
4. **Phase 4: 6-DOF Extended Kalman Filter (EKF) State Estimation**
   * Tracks 6-element kinematic state vector $\mathbf{x} = [u, v, \dot{u}, \dot{v}, \ddot{u}, \ddot{v}]^T$.
   * Bridges up to $2.0\text{ seconds}$ of cloud/obstacle occlusions using forward state extrapolation and covariance growth monitoring.
5. **Phase 5: Closed-Loop Dual-Axis Gimbal PID Control**
   * Converts pixel centroid errors into spherical Azimuth $(\Delta\theta)$ and Elevation $(\Delta\phi)$ adjustments.
   * Clamps slew rate to $\le 45^\circ/\text{s}$ with anti-windup integration to prevent overshoot and mechanical stress.
6. **Phase 6: 1550nm FSOC Optical Physics & Link Quality Validation**
   * Evaluates Gaussian beam pointing loss $L_{\text{pointing}} = -8.686 (\theta_p / \theta_{\text{div}})^2 \text{ dB}$.
   * Validates coarse alignment threshold ($\le 8.72\text{ mrad} / 0.50^\circ$) to enable 10 Gbps carrier lock ($\text{BER} \le 10^{-9}$).

---

### Section 2: Cyber-Physical System Mapping (Simulation to Real Hardware)

| Subsystem Component | SIH Digital Twin Implementation | Real ISRO Ground Station Hardware |
| :--- | :--- | :--- |
| **Optical Perception** | Virtual pinhole projection + beacon noise model | High-speed SWIR / InGaAs Coarse Camera ($1550\text{nm}$) |
| **AI Detection Engine** | YOLOv8-FSOC ONNX/TensorRT bounding box model | Jetson Orin / Embedded FPGA AI Accelerator Board |
| **State Estimation (EKF)** | 6-DOF Continuous-Discrete EKF Filter in Python | Real-time C++ EKF firmware on flight controller |
| **Gimbal Servo Loop** | Dual-axis PID with slew rate limiter ($45^\circ/\text{s}$) | Direct CAN-bus PWM to Pan-Tilt Direct-Drive Motors |
| **FSOC Laser Physics** | Beer-Lambert & Gaussian beam link budget | 1550nm C-Band EDFA Laser ($100\text{ mW}$) + APD Receiver |
| **Mission Telemetry** | Full-duplex WebSocket stream (60 FPS, $< 5\text{ ms}$) | ISTRAC Ground Station CCSDS / ZeroMQ Data Bus |

---

### Section 3: Technologies Used (Categorized Cards)

#### 🔹 FrontEnd
* **Three.js (WebGL):** Real-time 3D spatial digital twin displaying ground station, UAV, dynamic laser LOS beam, and cloud meshes.
* **HTML5 Canvas & HUD:** 1st-person telescope boresight reticle, YOLOv8 detection boxes, and 5-step EKF trajectory prediction trails.
* **Chart.js & Glassmorphism UI:** Live pointing error strip charts, RSSI dials, SNR gauges, and responsive mission control deck.

#### 🔹 BackEnd & Core Engine
* **FastAPI & Uvicorn (ASGI):** High-throughput microservice architecture serving 60 FPS real-time JSON telemetry over WebSockets.
* **NumPy & SciPy:** Optimized vectorized kinematic transformations, spherical trigonometry, and Kalman filter matrix operations.
* **Asyncio Event Loop:** Non-blocking multi-client telemetry broadcast with sub-5 millisecond total execution latency.

#### 🔹 AI, ML & Control
* **YOLOv8-FSOC:** High-accuracy optical beacon detection model with confidence scoring and background noise suppression.
* **6-DOF Extended Kalman Filter:** Continuous trajectory estimation with autonomous Archimedean spiral search recovery upon loss of lock.
* **Dual-Axis PID Servo Controller:** Dynamic slew rate clamping, anti-windup integrators, and jitter suppression.

#### 🔹 Embedded & Communication
* **WebSockets & REST API:** Full-duplex low-latency communication protocol for bi-directional telemetry and remote parameter tuning.
* **Micro-ROS & CAN-Bus Support:** Hardware abstraction layer for interfacing with physical pan-tilt gimbal servo microcontrollers.

---

## 🎯 KEY NUMERICAL HIGHLIGHTS & BENCHMARK TARGETS FOR JURY PRESENTATION

* **Coarse Pointing Accuracy:** $\le 8.72\text{ mrad}$ ($0.50^\circ$) across all dynamic scenarios (meets ISRO handover threshold).
* **Telemetry Streaming Rate:** Sustained **60 FPS** (16.6 ms cycle time).
* **Pipeline Processing Latency:** **$< 5.0\text{ ms}$** per frame (AI Inference: 2.1 ms, EKF + PID + Optics: 2.1 ms).
* **Occlusion Bridging Window:** Autonomous lock maintenance for up to **$2.0\text{ seconds}$** without optical sensor updates.
* **Lock Retention Rate:** **$> 95.0\%$** under dynamic wind turbulence and platform jitter.
* **Carrier Link Quality:** BER $\le 10^{-9}$ and SNR $> 25\text{ dB}$ for 10 Gbps high-speed optical transmission.
