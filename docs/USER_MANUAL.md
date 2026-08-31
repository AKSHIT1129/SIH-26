# USER MANUAL & SYSTEM OPERATION GUIDE
## AI-Based Virtual Camera Tracking System for Coarse Alignment of Mobile FSOC Terminals
**Smart India Hackathon 2026 | Problem Statement ID: 26169**  
**Organization:** Indian Space Research Organisation (ISRO)  
**Department:** Department of Space / Indian Space Research Organisation  

---

## 1. Executive Summary & Application Overview

Free Space Optical Communication (FSOC) delivers license-free, high-bandwidth (Gbps/Tbps), and quantum-secure line-of-sight links for satellite downlinks, inter-satellite links (ISL), and mobile aerial platforms (UAVs / High Altitude Platforms). However, narrow laser beam divergence ($\sim 1\text{ to } 2\text{ mrad}$) makes the link vulnerable to platform movement, wind gusts, and line-of-sight occlusions.

This software system implements an **AI-Based Virtual Camera Tracking & 3D Digital Twin Engine** for real-time coarse alignment ($\le 0.50^\circ$ / $8.72\text{ mrad}$) of 2-axis Pan-Tilt gimbal FSOC terminals.

---

## 2. System Requirements & Installation Guide

### Hardware Requirements
* **Processor:** Intel Core i5 / AMD Ryzen 5 or higher
* **RAM:** 8 GB minimum (16 GB recommended)
* **Graphics:** WebGL 2.0 compatible GPU (Integrated or Dedicated)
* **Network:** Localhost socket connectivity (Port 8000)

### Software Prerequisites
* Python 3.10+ / Python 3.14 (or `uv` package manager)
* Modern Web Browser: Google Chrome, Microsoft Edge, or Mozilla Firefox with WebGL enabled.

### 1-Click Installation Steps

1. Open PowerShell or Terminal in the project root directory:
   ```bash
   cd c:\SIH26
   ```

2. Create virtual environment and install all dependencies:
   ```bash
   # Using uv (fastest):
   uv venv
   uv pip install -r backend/requirements.txt

   # OR using standard python:
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r backend/requirements.txt
   ```

3. Launch the Backend Engine & Web Server:
   ```bash
   .venv\Scripts\python.exe backend/run.py
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

---

## 3. Graphical User Interface (GUI) Walkthrough

The Mission Control Dashboard is divided into three functional zones:

```
+-----------------------------------------------------------------------------------+
|  [ISRO 26169] FSOC AI Virtual Camera Tracking System     [FPS: 60] [Parameters] [Report]|
+---------------------------------------------------+-------------------------------+
|                                                   |  VIRTUAL CAMERA AI HUD        |
|  3D DIGITAL TWIN SIMULATION VIEWPORT              |  - Target Bounding Box        |
|  - Ground Station 2-Axis Gimbal Model             |  - Optical Boresight Crosshair|
|  - Mobile UAV Target with Propeller Kinematics    |  - EKF Trajectory Prediction  |
|  - Dynamic Glowing 1550nm Laser Beam              |  - Angular Error Vector       |
|  - Environmental Occlusion Clouds                 +-------------------------------+
|                                                   |  TELEMETRY & GAUGES DECK      |
|  [Action Bar: Cloud Occlusion | Wind | Reset]     |  - Azimuth & Elevation Dials  |
|                                                   |  - RSSI (dBm) & BER Quality   |
|                                                   |  - Real-Time Error Plot (mrad)|
+---------------------------------------------------+-------------------------------+
```

### 1. Top Navigation Bar
* **Status Badge:** Displays real-time operational state:
  * `[INITIALIZING]`: System boot.
  * `[COARSE ACQUISITION IN PROGRESS]`: Gimbal steering towards target.
  * `[COARSE ALIGNED - OPTICAL LOCK]`: Error $\le 0.5^\circ$ with link established.
  * `[OCCLUDED (EKF PREDICTING)]`: Target obscured; AI trajectory extrapolation active.
* **Telemetry Counters:** Real-time FPS (60.0) and processing latency ($< 5\text{ ms}$).
* **Parameters Button:** Opens the ISRO Parameter Configuration Drawer.
* **ISRO Report Button:** Launches the 1-Click Performance Benchmark Modal.

### 2. 3D Digital Twin Viewport (Left Panel)
* Interactive WebGL 3D scene with orbit controls (Click & Drag to rotate, Scroll to zoom).
* Visualizes the Ground Terminal base, 2-axis Pan-Tilt gimbal orientation, Mobile Target Drone, and Laser Beam.
* **Dynamic Beam Color Indicator:**
  * 🔴 **Red (Misaligned/Broken):** Pointing error $> 5.0^\circ$.
  * 🟡 **Yellow (Coarse Acquisition):** Angle error between $0.5^\circ$ and $5.0^\circ$.
  * 🟢 **Neon Green (Coarse Lock):** Precision $\le 0.50^\circ$ ($8.72\text{ mrad}$).

### 3. Virtual Camera AI HUD (Top-Right Panel)
* Renders the optical image plane of the gimbal-mounted tracking camera.
* Shows AI Bounding Box (`UAV_BEACON 98.4%`), Optical Boresight Crosshairs, EKF Extrapolated Trajectory Spline, and Error Vectors $(\Delta \text{Azimuth}, \Delta \text{Elevation})$.

### 4. ISRO Telemetry Deck (Bottom-Right Panel)
* **Azimuth (Pan) & Elevation (Tilt) Rotary Dials** with slew rate velocities.
* **Received Optical Power (RSSI in dBm):** Link budget power meter.
* **Bit Error Rate (BER) & Signal-to-Noise Ratio (SNR in dB).**
* **Real-time Pointing Error Chart (mrad vs Time)** with Coarse Lock threshold reference line.

---

## 4. Parameter Configuration Guide

Click the **"Parameters"** button on the top bar to adjust operational parameters:

| Parameter Category | Parameter Name | Range / Options | Description |
| :--- | :--- | :--- | :--- |
| **1. Target Trajectory** | Flight Mode | `Orbit`, `Figure-8`, `Linear Flyby`, `High-G Evasive`, `Hover` | Selects the 3D kinematic motion profile of the mobile target. |
| | Target Velocity | $2\text{ to } 60\text{ m/s}$ | Controls the linear velocity of the mobile terminal. |
| **2. Atmospheric Channel** | Weather Preset | `Clear Sky` ($0.25\text{ dB/km}$)<br>`Moderate Haze` ($1.8\text{ dB/km}$)<br>`Dense Fog` ($18.5\text{ dB/km}$)<br>`Heavy Rain` ($8.0\text{ dB/km}$) | Configures Beer-Lambert atmospheric attenuation coefficient ($\gamma$). |
| **3. Laser Transceiver** | Wavelength | $1550\text{ nm}$ (Standard C-Band) | Telecom-grade, eye-safe infrared laser wavelength. |
| | Laser Power ($P_{\text{tx}}$) | $5\text{ to } 1000\text{ mW}$ | Transmit optical power. |
| | Beam Divergence | $0.5\text{ to } 15.0\text{ mrad}$ | Full-width beam divergence angle ($\theta_{\text{div}}$). |
| **4. Camera & Gimbal** | Camera FOV | $10^\circ \text{ to } 90^\circ$ | Wide-angle tracking camera horizontal Field-of-View. |
| | Gimbal Slew Limit | $10^\circ \text{ to } 180^\circ/\text{s}$ | Maximum angular speed limit of the Pan-Tilt motor drive. |
| | PID Kp Gain | $0.1\text{ to } 3.0$ | Proportional gain for closed-loop motor servo tracking. |

---

## 5. Automated Performance Log & Report Generation

As required by ISRO Problem Statement 26169, the application logs every frame and generates complete statistical evaluation metrics:

1. Click the **"ISRO Report"** button in the navigation header.
2. The modal displays:
   * **Simulation Duration & Total Frames**
   * **Average FPS** ($\ge 30\text{ FPS}$ compliance)
   * **Initial Coarse Acquisition Time (s)**
   * **Re-acquisition Time (s)** after occlusion recovery
   * **Lock Retention Rate (%)**
   * **Average, Maximum, and RMS Tracking Error** (in both Degrees and Milliradians)
   * **Processing Latency & Jitter (ms)**
   * **Mean Optical Link RSSI (dBm), SNR (dB), and Bit Error Rate (BER)**
3. **1-Click Export Options:**
   * Click **"Download CSV Dataset"** to export raw frame-by-frame telemetry for external Python/MATLAB analysis.
   * Click **"Print / Save PDF"** to generate a clean, printable PDF report for the evaluation committee.

---

## 6. Verification Test Scenarios (Demo Steps)

| Scenario | Steps to Execute | Expected Behavior |
| :--- | :--- | :--- |
| **1. Standard Orbit Tracking** | Select `Orbit` trajectory at $15\text{ m/s}$. | Gimbal smoothly rotates in Azimuth ($0-360^\circ$); laser beam turns green; pointing error drops $< 2.0\text{ mrad}$. |
| **2. Cloud Occlusion Extrapolation** | Click **"Trigger Cloud Occlusion (3s)"** button. | Target beacon disappears; HUD turns red (`OCCLUDED - EKF ACTIVE`); Kalman Filter extrapolates flight path; upon cloud exit, lock is re-established in $< 0.8\text{ s}$. |
| **3. Wind Turbulence Disturbance** | Click **"Inject Wind Jitter"** button. | Target undergoes high-frequency random vibrations; PID controller compensates jitter within $1.5\text{ s}$. |
| **4. Weather Attenuation Test** | Open Parameters $\to$ Set weather to `Dense Fog`. | Atmospheric loss increases to $-18.5\text{ dB/km}$; RSSI drops; BER degrades to reflect realistic channel physics. |
