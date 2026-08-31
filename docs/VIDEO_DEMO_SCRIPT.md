# 3-5 MINUTE VIDEO DEMONSTRATION SCRIPT
## AI-Based Virtual Camera Tracking System for Mobile FSOC Terminals (ISRO PS ID: 26169)

---

### Video Overview
* **Target Duration:** 3 minutes 45 seconds
* **Visual Format:** Screen recording of the Mission Control Dashboard + Voiceover
* **Audio Tone:** Confident, professional, engineering-focused

---

### Scene 1: Introduction & Problem Context (0:00 - 0:45)
* **Visual:** Show Title Screen with ISRO Logo and Problem Statement ID 26169.
* **Voiceover:**
  > "Hello everyone. Free Space Optical Communication, or FSOC, is the future of ultra-high-speed satellite downlinks and mobile defense communications. However, with laser beam divergences of just a few milliradians, mobile terminals on UAVs or satellites easily lose line-of-sight due to wind sway, high-velocity maneuvers, and cloud blockages.
  > 
  > To solve this for ISRO, our team has developed an AI-Based Virtual Camera Tracking & 3D Digital Twin System for real-time coarse alignment."

---

### Scene 2: 3D Digital Twin & Real-Time Tracking (0:45 - 1:40)
* **Visual:** Zoom in on the 3D Digital Twin Viewport. The ground station gimbal rotates smoothly, pointing the glowing green laser beam at the moving UAV drone.
* **Voiceover:**
  > "Here in our 3D Digital Twin, you can see the ground base station actively tracking a mobile UAV terminal. Our pinhole virtual camera model continuously computes the line-of-sight vector using spherical basis decomposition.
  > 
  > Notice the dynamic laser beam: as long as the coarse pointing error is below 0.5 degrees, or 8.7 milliradians, the beam glows green, indicating an active optical lock with a Bit Error Rate below 10^-9 at 10 Gbps throughput."

---

### Scene 3: Tactical AI Camera HUD & EKF Estimation (1:40 - 2:30)
* **Visual:** Point to the top-right Camera AI HUD. Show the bounding box around the drone beacon, reticle crosshair, and the live angular error vectors.
* **Voiceover:**
  > "On the top-right panel, we have our Virtual Camera Optical Feed. Our lightweight AI perception engine detects the optical beacon with over 95% confidence in under 5 milliseconds.
  > 
  > An Extended Kalman Filter tracks the 6-DOF state vector—estimating velocity and acceleration to filter out sensor noise and compensate for platform vibrations."

---

### Scene 4: Occlusion Test & Trajectory Extrapolation (2:30 - 3:05)
* **Visual:** Click the **"Trigger Cloud Occlusion (3s)"** button. The HUD turns red (`OCCLUDED - EKF ACTIVE`). The dotted yellow trajectory line predicts where the drone will emerge. Upon exit, the laser snaps instantly back to green.
* **Voiceover:**
  > "Now, let's test what happens when a cloud completely obscures the target. By triggering cloud occlusion, visual detection drops to zero. 
  > 
  > Instead of losing lock, our Extended Kalman Filter seamlessly enters pure prediction mode, extrapolating the trajectory. As the drone exits the cloud, lock is re-established in under 0.8 seconds without requiring a full search scan."

---

### Scene 5: Automated ISRO Performance Benchmarking Report (3:05 - 3:45)
* **Visual:** Click the **"ISRO Report"** button in the navbar. The modal opens showing the performance metrics table. Click **"Download CSV Dataset"**.
* **Voiceover:**
  > "Finally, as explicitly mandated by ISRO's evaluation guidelines, our system features an automated 1-Click Performance Benchmark Generator.
  > 
  > It logs simulation duration, 60 FPS compliance, acquisition time, average and RMS tracking error in both degrees and milliradians, and optical link availability. With a single click, judges can export the raw telemetry as a CSV dataset or print a formal evaluation report.
  > 
  > Thank you for your time."
