# RoadVision AI (2026) · AI-Powered Accident Prevention Platform

> **Based directly on the 14-slide Research Brief:**  
> *"AI-Powered Accident Prevention for Road Safety: Predictive analytics, real-time monitoring, and intelligent automation working together to save lives on the road."*

---

## 🌟 Overview & Slide Mapping

This web application transforms the conceptual research presentation into an interactive, real-time simulation and intelligence platform:

| Slide # | Slide Title | Implemented Application Feature & Location |
|---|---|---|
| **01** | Introduction & Problem | Global Telemetry Counters (1.19M deaths, 94% human error, 30% ADAS reduction) in the Header & Executive Brief. |
| **02** | Objectives | The 6 interactive objective cards with live mission telemetry in **Executive Brief & Research**. |
| **03** | Technology Stack | The 4 core pillars (Computer Vision, Machine Learning, IoT, Deep Learning) in **Technology Stack**. |
| **04** | Driver Monitoring System (DMS) | **Driver Monitoring (DMS) Tab**: Real-time Eye Aspect Ratio (EAR) tracking, blinking, yawn detector, phone usage detector, off-road gaze tracking, audio alarms, cabin lighting override, and live webcam toggle. |
| **05** | Collision Avoidance & Traffic | **Collision Avoidance Tab**: 360° LiDAR/Radar simulator, ≤100ms decision latency, TTC calculations, Automatic Emergency Braking (AEB).<br>**Smart Signals & Traffic Tab**: Adaptive 4-way intersection ML scheduler (-27% wait time, +18% throughput, -32% incidents) + EMS Green Wave Priority override. |
| **06** | Weather & Road Hazards | **Hazard & Weather V2X Tab**: Fog visibility, Heavy rain hydroplaning index, Pothole defects, Slippery surface, and real-time V2X fleet broadcast engine. |
| **07** | Architecture | **4-Layer Architecture Tab**: Animated Signal Pipeline (Input → Processing → Decision → Output) with continuous feedback loop. |
| **08** | Applications | ADAS, Autonomous Vehicles, and Smart Cities integrated across all live interactive modules. |
| **09** | Benefits | Measured impact metrics (-38% accidents, +52% faster EMS arrival, -22% fuel use) highlighted with comparative charts. |
| **10** | Challenges | 4 honest engineering constraints (Cost, Privacy, Connectivity, Accuracy) with operational solutions. |
| **11** | Future Scope | Interactive 2027–2035 timeline from predictive prevention to full autonomous fleets. |
| **12-13**| Literature Survey | Interactive filterable and searchable database of peer-reviewed studies (Sahayadhas 2012, Chong 2013, Mukhopadhyay 2018, Wang 2019, Grigorescu 2020, Zhang 2021, Khan 2022) with gap analysis. |
| **14** | Our Deliverables & Outcomes | Benchmark comparison chart (Chart.js) verifying 94.6% drowsiness accuracy, ≤120ms latency, -41% near-misses, +58% EMS speed. |
| **15** | Conclusion | *"Predict → Perceive → Act → Prevent"* framework & executive takeaway. |

---

## 🚀 How to Run the Application

You can run this application immediately using any of the following methods:

### Option 1: Direct Browser Launch
Simply double-click `index.html` in your file explorer or open it directly in Google Chrome, Microsoft Edge, or Firefox:
```
file:///C:/Users/dushy/.gemini/antigravity/scratch/ai-road-safety-app/index.html
```

### Option 2: Local HTTP Server (Python)
In PowerShell or Terminal:
```powershell
cd C:\Users\dushy\.gemini\antigravity\scratch\ai-road-safety-app
python -m http.server 8888
```
Then visit `http://localhost:8888` in your web browser.

### Option 3: Local HTTP Server (Node.js)
```powershell
cd C:\Users\dushy\.gemini\antigravity\scratch\ai-road-safety-app
npx serve .
```

---

## 🛠️ Architecture & Built-in Modules

- **Web Audio API Engine (`js/audio.js`)**: Synthetic procedural audio generator for automotive alarms, AEB brake lock sounds, EMS sirens, and affirmative beeps without external MP3 files.
- **DMS Engine (`js/dms.js`)**: Real-time Driver Monitoring System with:
  - **Live Webcam AI Capture**: Uses MediaPipe 468-Point FaceMesh with ultra-fast optical fallback to track eye closure (EAR), blinks, yawns (MAR), and head yaw/pitch directly from the driver's real video feed.
  - **Snapshot Capture ("Snap Photo")**: Captures high-res still frames with burnt-in safety telemetry stamps (EAR score, fatigue index, timestamp, GPS).
  - **5-Second Video Clip Recorder ("Record Clip")**: Records incident clips of distraction or drowsiness events with automatic download.
  - **Incident Gallery Shelf**: View, replay, and download logged safety incidents.
- **Perception Radar (`js/collision.js`)**: 360° LiDAR perception canvas with dynamic kinematics, obstacle tracking, and AEB intervention.
- **Traffic Controller (`js/traffic.js`)**: Adaptive ML scheduler for 4-way intersections with Emergency Vehicle Green Corridor preemption.
- **V2X Geofence Service (`js/hazards.js`)**: Dynamic weather and road defect GIS mapper with one-click broadcast to approaching connected vehicles.
- **Crash Response (`js/telemetry.js`)**: High-G impact simulator with automated eCall generation, triage data, and EMS dispatch telemetry.

