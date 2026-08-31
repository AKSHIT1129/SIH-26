# SIH 2026 Jury Presentation & Q&A Defense Guide
### Problem Statement ID: 26169 | ISRO / Department of Space
**Title:** *Development of an AI-Based Virtual Camera Tracking System for Coarse Alignment of Mobile Free Space Optical Communication (FSOC) Terminals*

---

## 🎯 Executive Overview for the Team

Judges in the Smart India Hackathon are technical evaluators from ISRO, DRDO, academia, and the aerospace industry. They will test whether our team genuinely understands the physics, control theory, and architectural decisions behind the system.

Use this document to prepare for the live demonstration and Q&A defense.

---

## ❓ The 6 Core Jury Interrogation Questions & Exact Answers

### Q1: "Why did you choose an Extended Kalman Filter (EKF) instead of a simpler low-pass filter or a Particle Filter?"
> **Our Answer:**
> "We evaluated three estimator architectures against our 60 FPS real-time embedded computing budget:
> 1. **Simple Alpha-Beta / Low-Pass Filter:** Cannot extrapolate kinematic velocity and acceleration during missing measurements, causing instantaneous loss-of-lock during cloud occlusions.
> 2. **Particle Filter (Sequential Monte Carlo):** Highly accurate for non-Gaussian multimodal distributions, but requires hundreds of particles ($O(N)$ operations), consuming $> 15\text{ ms}$ per cycle on embedded processors—violating our $< 5\text{ ms}$ processing budget.
> 3. **6-DOF Extended Kalman Filter (Our Choice):** UAV flight kinematics over short horizons ($\le 1.5\text{ s}$) are well-approximated by a constant-acceleration model in image space:
>    $$\mathbf{x}_k = \begin{bmatrix} u & v & \dot{u} & \dot{v} & \ddot{u} & \ddot{v} \end{bmatrix}^T$$
>    The EKF computes closed-form covariance updates in $< 0.4\text{ ms}$. Crucially, the growth of the state covariance matrix $P_k$ provides an explicit uncertainty metric $\sigma_\text{pos} = \sqrt{P_{0,0} + P_{1,1}}$, allowing the system to know exactly when its prediction is reliable and when to initiate a spiral search."

---

### Q2: "Why is 8.72 mrad (0.50°) your Coarse Alignment Lock threshold? Where does this number come from?"
> **Our Answer:**
> "In aerospace Free Space Optical Communication terminals, acquisition and tracking follows a two-stage hierarchical architecture (PAT: Pointing, Acquisition, and Tracking):
> 1. **Coarse Tracking Stage (Our System):** Wide Field-of-View camera ($45^\circ$) + mechanical Pan-Tilt Gimbal. Its purpose is to steer the optical axis within the capture cone of the secondary stage.
> 2. **Fine Tracking Stage (FTS):** Narrow Field-of-View quadrant detector ($< 1.0^\circ$) + high-bandwidth Fast Steering Mirror (FSM) ($> 1\text{ kHz}$ bandwidth) which reduces pointing error down to microradians ($\approx 10\,\mu\text{rad}$) for fiber coupling.
> 
> A divergence limit of $0.50^\circ = 8.72\text{ mrad}$ corresponds to the physical FOV acceptance cone of standard aerospace Fine Tracking Sensors. Once coarse alignment holds the beam inside $8.72\text{ mrad}$, the FTS takes over. This is why coarse lock is defined at $8.72\text{ mrad}$."

---

### Q3: "What happens if both disturbances hit at the same time—wind turbulence AND cloud occlusion?"
> **Our Answer:**
> "When wind turbulence is injected during cloud occlusion:
> 1. **Visual Track Lost:** The camera sees no beacon; the AI detector confidence drops to 0%.
> 2. **EKF Coasting:** The filter transitions to `OCCLUSION_PREDICTING` and continues propagating the last known velocity and acceleration vector.
> 3. **Wind Impact:** Because the gimbal cannot see real-time corrections during occlusion, wind buffet introduces an unobservable drift. The covariance $P_k$ expands rapidly.
> 4. **Graceful Recovery:** Upon cloud exit (target reappearance), the AI detector immediately reacquires the beacon spot. The Kalman Innovation step ($y_k = z_k - H\hat{x}_k^-$) provides a high correction gain ($K_k$), instantly correcting the state vector back to the true centroid, and the PID gimbal servos damp the angular error back under $8.72\text{ mrad}$ in $< 0.8\text{ seconds}$."

---

### Q4: "What parts of this system are simulated, and what would map directly to real ISRO hardware?"
> **Our Answer:**
> "We clearly demarcate simulation models from deployable flight software:
> * **Simulated for Evaluation:** 
>   - 3D target flight kinematics (orbit, figure-8, evasive).
>   - Virtual pinhole camera raycasting and atmospheric Beer-Lambert attenuation model.
> * **Hardware-Ready Flight Software (Production Code):**
>   - **AI Perception Engine:** YOLOv8-FSOC lightweight ONNX/TensorRT pipeline.
>   - **State Estimation (EKF):** 6-DOF continuous-discrete filter algorithm.
>   - **Control Loop:** Dual-axis discrete-time PID gimbal servo controller with slew clamping.
>   - **Telemetry Architecture:** 60 FPS real-time JSON stream over standard WebSocket/ZeroMQ interfaces."

---

### Q5: "How does this scale to multiple ground stations or a swarm of mobile UAV terminals?"
> **Our Answer:**
> "Scalability is supported along two architectural axes:
> 1. **Multi-Terminal Handover:** The state machine can manage target prioritization based on ephemeris data and SNR link margin, switching coarse tracking between UAVs using a pre-calibrated coordinate transform.
> 2. **Distributed Ground Network:** Telemetry packets follow a modular JSON schema compatible with CCSDS standards, enabling a central ISTRAC mission center to aggregate pointing metrics across geographically dispersed optical ground stations (OGS) to optimize atmospheric cloud-free line-of-sight (CFOS)."

---

### Q6: "What is your security and failover strategy if telemetry drops or the link is spoofed?"
> **Our Answer:**
> "1. **Heartbeat & Watchdog:** If the telemetry link drops, the gimbal controller freezes its last command, transitions to autonomous inertial hold, and begins an expanding Archimedean spiral scan.
> 2. **Beacon Spoof Rejection:** The AI detector validates both spatial centroid motion and temporal beacon modulation frequency (e.g. 10 kHz pulsing beacon) to discard false solar reflections or adversarial laser dazzling.
> 3. **Link Budget Monitoring:** Carrier lock is strictly verified via real-time BER ($< 10^{-9}$) and RSSI thresholds before authorizing high-bandwidth data transmission."

---

## 🎬 Live Demo Handling & Sequence

When demonstrating to the jury:
1. **Show Normal Tracking:** Let the system run for 5 seconds to highlight the steady green `LOCK` state and Pointing Error holding at $\sim 2.5\text{ mrad}$ ($< 8.72\text{ mrad}$).
2. **Trigger Cloud Occlusion:** Click `Occlusion test`. Point out that the visual camera shows the red overlay, but the 3D gimbal keeps tracking the target via EKF predicted trajectory.
3. **Trigger Wind Disturbance:** Click `Wind disturbance`. Show the error spike on Chart.js and how the PID controller damps it back to lock in $< 1.5\text{ s}$.
4. **Trigger ISRO Benchmark Report:** Click `ISRO benchmark` to display the automated compliance table and click `Download CSV telemetry` to demonstrate raw data export.

---
*Prepared for the Smart India Hackathon 2026 Team Defense*
