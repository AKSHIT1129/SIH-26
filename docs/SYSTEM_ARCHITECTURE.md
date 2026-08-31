# SYSTEM ARCHITECTURE & MATHEMATICAL FORMULATIONS
## AI-Based Virtual Camera Tracking System for Coarse Alignment of Mobile FSOC Terminals
**ISRO Problem Statement ID: 26169 | Smart India Hackathon 2026**

---

## 1. System Block Diagram & Information Flow

```mermaid
graph TB
    subgraph SENSING_AND_KINEMATICS [1. 3D Kinematics & Optical Sensing]
        WORLD[3D Target Dynamics: X_w, Y_w, Z_w]
        GIMBAL[Pan-Tilt Gimbal Orientation: Azimuth theta, Elevation phi]
        VCAM[Virtual Camera Pinhole Projection fx, fy, cx, cy]
        WORLD --> VCAM
        GIMBAL --> VCAM
    end

    subgraph AI_AND_ESTIMATION [2. Perception & State Estimation]
        AI[AI Object & Beacon Detector: YOLOv8 / Centroid Extraction]
        EKF[Extended Kalman Filter 6-DOF State Estimator & Predictor]
        VCAM -->|Image Plane u, v| AI
        AI -->|Measurement z_k = [u, v]| EKF
    end

    subgraph ACTUATION_AND_CONTROL [3. Closed-Loop Gimbal Control]
        TRANSFORM[Pixel-to-Spherical Angle Transformation]
        PID[Dual-Axis PID Controller with Slew Limiter]
        EKF -->|Estimated State x_hat| TRANSFORM
        TRANSFORM -->|Error Delta theta, Delta phi| PID
        PID -->|Rate Commands theta_dot, phi_dot| GIMBAL
    end

    subgraph OPTICAL_PHYSICS [4. FSOC Link Budget Engine]
        OPTICS[Gaussian Beam Propagation & Beer-Lambert Physics]
        GIMBAL -->|Pointing Error theta_p| OPTICS
        WORLD -->|Link Range R| OPTICS
        OPTICS -->|RSSI dBm, SNR dB, BER| TELEMETRY[ISRO Real-Time Telemetry & Performance Logger]
    end
```

---

## 2. Coordinate Frame Transformations & Camera Geometry

### 2.1 Coordinate Reference Frames
* **World Frame ($\mathcal{F}_W$):** Right-handed Cartesian frame where $X_W$ points East, $Y_W$ points North, and $Z_W$ points Up (Zenith).
* **Gimbal Frame ($\mathcal{F}_G$):** Rotated by Azimuth $\theta$ (about $Z_W$) and Elevation $\phi$ (about the gimbal pitch axis).
* **Camera Sensor Frame ($\mathcal{F}_C$):** Optical axis along $+Y_G$, horizontal sensor axis along $+X_G$, and vertical sensor axis along $+Z_G$.

### 2.2 Gimbal Basis Vector Decomposition
For a gimbal pointing at Azimuth $\theta$ and Elevation $\phi$, the orthonormal unit vectors in the World frame are:

$$\mathbf{v}_{\text{forward}} = \begin{bmatrix} \sin\theta \cos\phi \\ \cos\theta \cos\phi \\ \sin\phi \end{bmatrix}, \quad
\mathbf{v}_{\text{right}} = \begin{bmatrix} \cos\theta \\ -\sin\theta \\ 0 \end{bmatrix}, \quad
\mathbf{v}_{\text{up}} = \begin{bmatrix} -\sin\theta \sin\phi \\ -\cos\theta \sin\phi \\ \cos\phi \end{bmatrix}$$

For a target at position $\mathbf{P}_W = [X_W, Y_W, Z_W]^T$, the camera coordinates are computed by direct inner products:
$$X_{\text{cam}} = \mathbf{P}_W \cdot \mathbf{v}_{\text{right}}, \quad
Z_{\text{cam}} = \mathbf{P}_W \cdot \mathbf{v}_{\text{forward}}, \quad
Y_{\text{cam}} = \mathbf{P}_W \cdot \mathbf{v}_{\text{up}}$$

### 2.3 Pinhole Projection Matrix
The 3D coordinates are mapped to 2D pixel coordinates $(u, v)$ on the sensor plane:

$$u = f_x \frac{X_{\text{cam}}}{Z_{\text{cam}}} + c_x + \eta_u, \quad v = c_y - f_y \frac{Y_{\text{cam}}}{Z_{\text{cam}}} + \eta_v$$

Where:
* $f_x = f_y = \frac{W / 2}{\tan(\text{FOV}_h / 2)}$ is the focal length in pixel units.
* $(c_x, c_y) = (W/2, H/2)$ is the principal point (optical boresight).
* $\eta_u, \eta_v \sim \mathcal{N}(0, \sigma_{\text{sensor}}^2)$ represents Gaussian sensor noise.

---

## 3. Extended Kalman Filter (EKF) State Estimation & Occlusion Predictor

To track high-velocity maneuvers and maintain line-of-sight during temporary cloud/terrain blockages, a continuous white-noise acceleration kinematic model is used.

### 3.1 State Vector & Transition Dynamics
$$\mathbf{x} = \begin{bmatrix} u & v & \dot{u} & \dot{v} & \ddot{u} & \ddot{v} \end{bmatrix}^T$$

State transition over time interval $\Delta t$:
$$\mathbf{x}_{k|k-1} = \mathbf{F}(\Delta t) \mathbf{x}_{k-1|k-1}$$

$$\mathbf{F}(\Delta t) = \begin{bmatrix}
1 & 0 & \Delta t & 0 & \frac{1}{2}\Delta t^2 & 0 \\
0 & 1 & 0 & \Delta t & 0 & \frac{1}{2}\Delta t^2 \\
0 & 0 & 1 & 0 & \Delta t & 0 \\
0 & 0 & 0 & 1 & 0 & \Delta t \\
0 & 0 & 0 & 0 & 1 & 0 \\
0 & 0 & 0 & 0 & 0 & 1
\end{bmatrix}$$

### 3.2 Process & Measurement Covariance
The continuous piecewise acceleration process noise covariance $\mathbf{Q}$:
$$\mathbf{Q} = \begin{bmatrix} \mathbf{Q}_{1D} & \mathbf{0} \\ \mathbf{0} & \mathbf{Q}_{1D} \end{bmatrix}, \quad
\mathbf{Q}_{1D} = q \begin{bmatrix}
\frac{\Delta t^5}{20} & \frac{\Delta t^4}{8} & \frac{\Delta t^3}{6} \\
\frac{\Delta t^4}{8} & \frac{\Delta t^3}{3} & \frac{\Delta t^2}{2} \\
\frac{\Delta t^3}{6} & \frac{\Delta t^2}{2} & \Delta t
\end{bmatrix}$$

When AI detection $\mathbf{z}_k = [u_{\text{meas}}, v_{\text{meas}}]^T$ is available:
$$\mathbf{S}_k = \mathbf{H}\mathbf{P}_{k|k-1}\mathbf{H}^T + \mathbf{R}$$
$$\mathbf{K}_k = \mathbf{P}_{k|k-1}\mathbf{H}^T \mathbf{S}_k^{-1}$$
$$\mathbf{x}_{k|k} = \mathbf{x}_{k|k-1} + \mathbf{K}_k (\mathbf{z}_k - \mathbf{H}\mathbf{x}_{k|k-1})$$
$$\mathbf{P}_{k|k} = (\mathbf{I} - \mathbf{K}_k \mathbf{H})\mathbf{P}_{k|k-1}$$

**Occlusion Mode:** When $\mathbf{z}_k = \emptyset$, the filter coasts in pure prediction mode ($\mathbf{x}_{k|k} = \mathbf{x}_{k|k-1}, \mathbf{P}_{k|k} = \mathbf{P}_{k|k-1}$), maintaining accurate trajectory extrapolation for up to $2.0\text{ seconds}$.

---

## 4. Closed-Loop Dual-Axis Gimbal PID Control

### 4.1 Pixel-to-Angle Mapping
$$\Delta \theta_{\text{az}} = \arctan\left( \frac{\hat{u} - c_x}{f_x} \right), \quad
\Delta \phi_{\text{el}} = \arctan\left( \frac{c_y - \hat{v}}{f_y} \right)$$

### 4.2 PID Control Law with Anti-Windup
$$\dot{\theta}_{\text{cmd}} = \text{clamp}\left( K_p e_{\text{az}}(t) + K_i \int e_{\text{az}}(\tau) d\tau + K_d \frac{de_{\text{az}}}{dt}, -\omega_{\max}, +\omega_{\max} \right)$$
$$\dot{\phi}_{\text{cmd}} = \text{clamp}\left( K_p e_{\text{el}}(t) + K_i \int e_{\text{el}}(\tau) d\tau + K_d \frac{de_{\text{el}}}{dt}, -\omega_{\max}, +\omega_{\max} \right)$$

---

## 5. FSOC Optical Link Budget & Physics Formulation

### 5.1 Gaussian Beam Profile & Pointing Loss
The spatial intensity distribution of the laser follows a fundamental TEM$_{00}$ Gaussian profile:

$$I(\theta) = I_0 \exp\left( -2 \left(\frac{\theta}{\theta_{\text{div}}}\right)^2 \right)$$

Pointing misalignment loss ($L_{\text{pointing}}$ in dB) for angular pointing error $\theta_p$:
$$L_{\text{pointing}} (\text{dB}) = 10 \log_{10} \left[ \exp\left( -2 \left(\frac{\theta_p}{\theta_{\text{div}}}\right)^2 \right) \right] = -8.686 \left(\frac{\theta_p}{\theta_{\text{div}}}\right)^2$$

### 5.2 Atmospheric Attenuation (Beer-Lambert Law)
$$\tau_{\text{atm}} = \exp\left( -\gamma(\lambda) \cdot R \right) \implies L_{\text{atm}} (\text{dB}) = -\gamma_{\text{dB/km}} \cdot \left(\frac{R}{1000}\right)$$

### 5.3 Received Power (RSSI), SNR, and Bit Error Rate (BER)
Total Received Power:
$$P_{\text{rx}} (\text{dBm}) = P_{\text{tx}} (\text{dBm}) + G_{\text{geom}} (\text{dB}) + L_{\text{pointing}} (\text{dB}) + L_{\text{atm}} (\text{dB})$$

Signal-to-Noise Ratio:
$$\text{SNR} (\text{dB}) = P_{\text{rx}} (\text{dBm}) - P_{\text{noise}} (\text{dBm})$$

Theoretical Bit Error Rate for OOK/BPSK:
$$\text{BER} = \frac{1}{2} \text{erfc}\left( \frac{\sqrt{10^{\text{SNR}/10}}}{2\sqrt{2}} \right)$$
