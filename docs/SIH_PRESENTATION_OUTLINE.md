# SMART INDIA HACKATHON 2026 - PPT PRESENTATION OUTLINE
## Problem Statement ID: 26169 (ISRO)
**Title:** Development of an AI-Based Virtual Camera Tracking System for Coarse Alignment of Mobile Free Space Optical Communication (FSOC) Terminals  
**Organization:** Indian Space Research Organisation (ISRO) | Department of Space  

---

### Slide 1: Title & Executive Summary
* **Title:** AI-Based Virtual Camera Tracking System for Coarse Alignment of Mobile FSOC Terminals
* **PS ID:** 26169 | **Theme:** Smart Automation | **Category:** Software
* **Team Name / College:** [Your Team Name]
* **One-Liner:** An ISRO-grade Digital Twin and AI Perception Engine delivering real-time sub-0.5° coarse optical alignment, predictive occlusion recovery, and automated performance benchmarking.

---

### Slide 2: The Core Problem in Mobile FSOC
* **Why FSOC?** Laser communication provides Gbps-Tbps bandwidth, license-free spectrum, and quantum-secure transmission for Satellite Downlinks, UAVs, and Maritime platforms.
* **The Critical Bottleneck:** Narrow beam divergence ($\approx 1\text{ to }2\text{ mrad}$). Even slight drone sway, atmospheric jitter, or clouds cause immediate line-of-sight breakage.
* **The Gap:** Conventional manual/GPS tracking fails under GPS-denied environments, high vibration, and dynamic cloud occlusions.

---

### Slide 3: Technical Approach & Technology Stack
* **Technology Stack Breakdown:**
  * **Frontend & Digital Twin:** Three.js (WebGL), HTML5 Canvas Telescope HUD, Chart.js, Vanilla CSS Glassmorphism, IBM Plex typography, Full-Duplex WebSockets.
  * **Backend & Simulation Engine:** Python 3.11+, FastAPI (ASGI), Uvicorn Server, NumPy & SciPy (Vectorized Linear Algebra), Asyncio Non-blocking Event Loop.
  * **AI Perception & Vision:** Custom YOLOv8-FSOC Beacon Detector, ONNX Runtime, TensorRT edge inference acceleration, Pinhole Camera Intrinsic Model ($K$).
  * **Estimation & Control:** 6-DOF Extended Kalman Filter (EKF) with continuous-discrete Riccati propagation, Dual-Axis PID Controller with Anti-Windup & Slew Clamping ($\le 45^\circ/\text{s}$), Archimedean Spiral Search.
  * **FSOC Optical Physics:** 1550nm C-Band EDFA Model, Beer-Lambert Extinction, Gaussian Beam Profile ($L_{\text{pointing}} = -8.686 (\theta_p/\theta_{\text{div}})^2$), SNR, and Complementary Error Function BER ($P_e = \frac{1}{2}\text{erfc}(\sqrt{\text{SNR}}/2\sqrt{2})$).
  * **Hardware & Interfacing:** Micro-ROS, Serial CAN-Bus / gRPC, STM32 / ESP32 Microcontrollers, 2-Axis Pan-Tilt Brushless Gimbals, InGaAs/SWIR Optical Sensors.
* **6-Phase Closed-Loop Implementation Flow:**
  1. `3D Kinematics & Channel` ➔ 2. `Virtual Camera Projection` ➔ 3. `YOLOv8 Beacon Detection` ➔ 4. `6-DOF EKF Trajectory Extrapolation` ➔ 5. `Dual-Axis PID Gimbal Slew` ➔ 6. `1550nm FSOC Optical Validation`.
* **Hardware vs. Simulation Digital Twin Mapping:**
  * *Perception:* Pinhole Synthetic Sensor ➔ $1550\text{nm}$ InGaAs High-Speed SWIR Camera.
  * *AI Inference:* YOLOv8 ONNX ➔ Jetson Orin / Embedded FPGA AI Accelerator.
  * *Control:* Discrete PID Loop ➔ Direct CAN-bus PWM to Pan-Tilt Direct-Drive Motors.
  * *Optical Link:* Gaussian Link Budget ➔ 100mW EDFA Laser Diode + APD Optical Photodetector.
  * *Telemetry:* 60 FPS WebSocket Bus ➔ ISTRAC Ground Station CCSDS Protocol.


---

### Slide 4: AI Perception & Pinhole Camera Model
* **Optical Beacon Detection:** Real-time centroid and bounding box extraction at $< 5\text{ ms}$ inference time.
* **Spherical Basis Projection:** Maps 3D world target coordinates $[X_W, Y_W, Z_W]$ to 2D image plane coordinates $(u, v)$ with sensor Gaussian noise.
* **Robust in All Conditions:** Tested across Clear Sky, Moderate Haze, Dense Fog, and Heavy Rain.

---

### Slide 5: EKF Predictive Tracking & Occlusion Handling
* **Continuous State Vector:** $\mathbf{x} = [u, v, \dot{u}, \dot{v}, \ddot{u}, \ddot{v}]^T$
* **Occlusion Extrapolation:** When clouds/buildings block the line-of-sight, the EKF maintains forward trajectory prediction for up to $2.0\text{ seconds}$.
* **Re-acquisition Speed:** Rapid target lock restoration in $< 0.8\text{ s}$ upon line-of-sight exit.
* **Autonomous Spiral Search:** Triggers Archimedean spiral search pattern upon complete target loss.

---

### Slide 6: Closed-Loop Gimbal Pointing & Control
* **Pixel-to-Angle Transform:** Converts pixel offsets $(\Delta u, \Delta v)$ to spherical Azimuth $(\theta)$ and Elevation $(\phi)$ commands.
* **PID Servo Control:** Compensates for platform jitter and wind turbulence within $1.2\text{ seconds}$.
* **Coarse Alignment Accuracy:** Achieves pointing errors $\le 0.50^\circ$ ($8.72\text{ mrad}$), perfectly enabling fine-steering handoff (FSM).

---

### Slide 7: Realistic FSOC Optical Physics & Link Budget
* **1550 nm Telecom Infrared Standard:** Eye-safe, low atmospheric absorption.
* **Gaussian Beam Profile:** Pointing loss $L_{\text{pointing}} = -8.686 (\theta_p / \theta_{\text{div}})^2 \text{ dB}$.
* **Real-Time Quality Metrics:**
  * **RSSI:** $-15\text{ to } -25\text{ dBm}$ under locked alignment.
  * **SNR:** $> 25\text{ dB}$.
  * **Bit Error Rate (BER):** $< 10^{-9}$ (supporting 10 Gbps carrier transmission).

---

### Slide 8: Automated ISRO Benchmarking & Performance Logs
* **1-Click ISRO Performance Report Generator:**
  * **Simulation Duration & Frame Count:** Continuous real-time 60 FPS.
  * **Initial Coarse Acquisition Time:** $\le 1.8\text{ s}$.
  * **Re-acquisition Time (Post-Occlusion):** $\le 0.8\text{ s}$.
  * **Lock Retention Rate:** $> 95.0\%$.
  * **RMS Tracking Error:** $\le 0.25^\circ$.
  * **Processing Latency:** $\approx 4.2\text{ ms}$ (well within the $20\text{ ms}$ real-time budget).
* **Export Formats:** Direct 1-Click CSV dataset download and printable PDF report.

---

### Slide 9: Live Demonstration & UI Showcase
* **Three.js 3D Digital Twin:** Real-time Base Station gimbal, Target UAV, Dynamic Laser Beam, and Obstacle Clouds.
* **Tactical AI Camera HUD:** Reticle crosshairs, bounding box overlays, and EKF trajectory splines.
* **Real-Time Telemetry Deck:** Rotary dials, RSSI gauges, and live Pointing Error strip-chart.

---

### Slide 10: Feasibility, Hardware Roadmap & ISRO Impact
* **Software Maturity:** 100% modular, high-FPS, cross-platform Python FastAPI + Three.js WebGL stack.
* **Hardware Interfacing:** Direct serial/CAN bus output to physical 2-axis Pan-Tilt stepper/servo gimbals (ESP32/STM32).
* **National & Strategic Impact:**
  * Satellite-to-Ground Downlinks (LEO/GEO).
  * Inter-UAV and High Altitude Pseudo-Satellite (HAPS) optical communication.
  * Tactical GPS-Denied Border & Maritime Communications for Defense.
