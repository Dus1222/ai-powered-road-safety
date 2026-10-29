// Smart Collision Avoidance & 360° Perception System
// Directly implements Slide 5 (Features) & ADAS Stack from PPT

class CollisionAvoidanceSystem {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    
    // Ego Vehicle State
    this.egoSpeedKmh = 80; // user adjustable 0 - 140 km/h
    this.egoY = 400; // canvas Y coordinate
    this.egoLane = 1; // 0: left, 1: middle, 2: right
    
    // Lead Vehicle State
    this.leadDistanceMeters = 42; // distance in meters
    this.leadSpeedKmh = 70; // km/h
    this.leadBraking = false;
    
    // Surrounding obstacles
    this.pedestrian = { active: false, x: 0, y: 0, speedX: 1.2 };
    this.blindSpotVehicle = { active: true, lane: 0, relativeY: 15, speedKmh: 85 };
    
    // Collision Metrics (Slide 5: <=100ms decision time, 360 perception, 0 blind spots)
    this.ttcSeconds = 4.2; // Time to collision
    this.decisionLatencyMs = 64; // <= 100ms
    this.aebTriggered = false;
    this.brakePrecharged = false;
    this.statusLevel = 'SAFE'; // 'SAFE', 'CAUTION', 'WARNING', 'AEB_ACTIVE'
    
    this.radarAngle = 0;
    this.animationId = null;
  }

  init() {
    this.canvas = document.getElementById('collision-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.bindControls();
    this.startLoop();
  }

  bindControls() {
    const speedSlider = document.getElementById('slider-ego-speed');
    const distSlider = document.getElementById('slider-lead-dist');
    const btnBrakeAhead = document.getElementById('btn-scenario-brake');
    const btnPedestrian = document.getElementById('btn-scenario-pedestrian');
    const btnCutin = document.getElementById('btn-scenario-cutin');
    const btnCruise = document.getElementById('btn-scenario-cruise');

    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        this.egoSpeedKmh = parseFloat(e.target.value);
        const valEl = document.getElementById('val-ego-speed');
        if (valEl) valEl.innerText = `${Math.round(this.egoSpeedKmh)} km/h`;
      });
    }

    if (distSlider) {
      distSlider.addEventListener('input', (e) => {
        this.leadDistanceMeters = parseFloat(e.target.value);
        const valEl = document.getElementById('val-lead-dist');
        if (valEl) valEl.innerText = `${Math.round(this.leadDistanceMeters)} m`;
      });
    }

    if (btnBrakeAhead) btnBrakeAhead.addEventListener('click', () => this.triggerScenario('lead_brake'));
    if (btnPedestrian) btnPedestrian.addEventListener('click', () => this.triggerScenario('pedestrian'));
    if (btnCutin) btnCutin.addEventListener('click', () => this.triggerScenario('blindspot'));
    if (btnCruise) btnCruise.addEventListener('click', () => this.triggerScenario('cruise'));
  }

  triggerScenario(type) {
    if (window.soundEngine) window.soundEngine.playClick();

    if (type === 'lead_brake') {
      this.leadSpeedKmh = 10;
      this.leadBraking = true;
      this.pedestrian.active = false;
    } else if (type === 'pedestrian') {
      this.pedestrian.active = true;
      this.pedestrian.x = 80;
      this.pedestrian.y = 180;
      this.leadDistanceMeters = 65;
    } else if (type === 'blindspot') {
      this.blindSpotVehicle.active = true;
      this.blindSpotVehicle.relativeY = 0; // exactly in blindspot
      this.leadDistanceMeters = 40;
    } else if (type === 'cruise') {
      this.egoSpeedKmh = 80;
      this.leadSpeedKmh = 80;
      this.leadDistanceMeters = 55;
      this.leadBraking = false;
      this.pedestrian.active = false;
      this.aebTriggered = false;
    }

    // Sync sliders
    const sEl = document.getElementById('slider-ego-speed');
    const dEl = document.getElementById('slider-lead-dist');
    if (sEl) sEl.value = this.egoSpeedKmh;
    if (dEl) dEl.value = this.leadDistanceMeters;
  }

  startLoop() {
    const loop = () => {
      this.updatePhysics();
      this.drawCanvas();
      this.updateDashboard();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  updatePhysics() {
    // Relative speed in m/s
    const relativeSpeedKmh = this.egoSpeedKmh - this.leadSpeedKmh;
    const relSpeedMs = relativeSpeedKmh * (1000 / 3600);

    // Dynamic distance tracking
    if (relSpeedMs > 0) {
      this.leadDistanceMeters -= relSpeedMs * (1 / 60);
      if (this.leadDistanceMeters < 3) this.leadDistanceMeters = 3;
    } else if (relSpeedMs < 0 && this.leadDistanceMeters < 80) {
      this.leadDistanceMeters += Math.abs(relSpeedMs) * (1 / 60);
    }

    // Calculate TTC (Time To Collision)
    if (relSpeedMs > 0.5) {
      this.ttcSeconds = Math.max(0.1, this.leadDistanceMeters / relSpeedMs);
    } else {
      this.ttcSeconds = 9.9; // Safe / not closing in
    }

    // Autonomous Emergency Braking (AEB) Logic
    if (this.leadDistanceMeters < 12 || this.ttcSeconds < 0.9) {
      // Critical emergency brake
      this.statusLevel = 'AEB_ACTIVE';
      if (!this.aebTriggered) {
        this.aebTriggered = true;
        this.decisionLatencyMs = Math.floor(65 + Math.random() * 20); // <= 100ms
        if (window.soundEngine) window.soundEngine.playBrakeAlert();
      }
      // Decelerate ego aggressively
      this.egoSpeedKmh = Math.max(0, this.egoSpeedKmh - 1.8);
    } else if (this.ttcSeconds < 1.6 || (this.pedestrian.active && this.pedestrian.y > 220 && this.pedestrian.y < 380)) {
      this.statusLevel = 'WARNING';
      this.brakePrecharged = true;
      if (Math.random() < 0.05 && window.soundEngine) {
        window.soundEngine.playWarningAlert();
      }
      this.egoSpeedKmh = Math.max(0, this.egoSpeedKmh - 0.5);
    } else if (this.ttcSeconds < 2.6) {
      this.statusLevel = 'CAUTION';
      this.brakePrecharged = true;
    } else {
      this.statusLevel = 'SAFE';
      this.aebTriggered = false;
      this.brakePrecharged = false;
    }

    // Pedestrian motion
    if (this.pedestrian.active) {
      this.pedestrian.x += this.pedestrian.speedX;
      if (this.pedestrian.x > 320) this.pedestrian.x = 80;
    }

    // Radar scan rotation
    this.radarAngle = (this.radarAngle + 0.04) % (Math.PI * 2);
  }

  drawCanvas() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.clearRect(0, 0, w, h);

    // 1. Draw Multi-lane Highway
    this.drawHighway(w, h);

    // 2. Draw 360° Perception Fields (LiDAR & Camera cones)
    this.drawSensors(w, h);

    // 3. Draw Surrounding Vehicles & Pedestrians
    this.drawSurroundings(w, h);

    // 4. Draw Ego Vehicle (AI Vehicle)
    this.drawEgoVehicle(w, h);

    // 5. Draw Target Trackers & Distance Lines
    this.drawTelemetryOverlays(w, h);
  }

  drawHighway(w, h) {
    // Road asphalt
    this.ctx.fillStyle = '#0B1120';
    this.ctx.fillRect(0, 0, w, h);

    const roadX = 50;
    const roadW = w - 100;
    const laneW = roadW / 3;

    // Road surface
    this.ctx.fillStyle = '#111827';
    this.ctx.fillRect(roadX, 0, roadW, h);

    // Outer road borders
    this.ctx.strokeStyle = '#334155';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(roadX, 0);
    this.ctx.lineTo(roadX, h);
    this.ctx.moveTo(roadX + roadW, 0);
    this.ctx.lineTo(roadX + roadW, h);
    this.ctx.stroke();

    // Lane divider dashed lines (animated flow)
    const laneOffset = (Date.now() / (180 / Math.max(10, this.egoSpeedKmh))) % 40;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([14, 20]);
    this.ctx.lineDashOffset = -laneOffset;

    for (let i = 1; i <= 2; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(roadX + i * laneW, 0);
      this.ctx.lineTo(roadX + i * laneW, h);
      this.ctx.stroke();
    }
    this.ctx.setLineDash([]);
  }

  drawSensors(w, h) {
    const egoX = w / 2;
    const egoY = h * 0.72;

    // Forward Long-Range Radar (Green / Yellow / Red depending on TTC)
    const radarColor = this.statusLevel === 'AEB_ACTIVE' ? 'rgba(255, 90, 95, ' :
                       this.statusLevel === 'WARNING' ? 'rgba(245, 184, 0, ' : 'rgba(0, 208, 156, ';

    // Front Camera / Radar Cone
    this.ctx.fillStyle = radarColor + '0.12)';
    this.ctx.beginPath();
    this.ctx.moveTo(egoX, egoY - 20);
    this.ctx.lineTo(egoX - 85, 30);
    this.ctx.lineTo(egoX + 85, 30);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.strokeStyle = radarColor + '0.4)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // 360° LiDAR Ring sweep (Slide 5: 360 perception)
    this.ctx.strokeStyle = 'rgba(0, 163, 255, 0.25)';
    this.ctx.lineWidth = 1;
    for (let r = 40; r <= 140; r += 35) {
      this.ctx.beginPath();
      this.ctx.arc(egoX, egoY, r, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // LiDAR sweeping beam line
    this.ctx.strokeStyle = 'rgba(0, 163, 255, 0.7)';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(egoX, egoY);
    this.ctx.lineTo(egoX + Math.cos(this.radarAngle) * 140, egoY + Math.sin(this.radarAngle) * 140);
    this.ctx.stroke();

    // Blind Spot Detection Zones (Left & Right rear quarter panels)
    // Slide 5: 0 blind spots
    const bsdLeftActive = this.blindSpotVehicle.active && Math.abs(this.blindSpotVehicle.relativeY) < 30;
    this.ctx.fillStyle = bsdLeftActive ? 'rgba(255, 90, 95, 0.35)' : 'rgba(0, 208, 156, 0.1)';
    this.ctx.beginPath();
    this.ctx.moveTo(egoX - 25, egoY + 10);
    this.ctx.lineTo(egoX - 100, egoY + 30);
    this.ctx.lineTo(egoX - 80, egoY + 90);
    this.ctx.lineTo(egoX - 25, egoY + 40);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(0, 208, 156, 0.1)';
    this.ctx.beginPath();
    this.ctx.moveTo(egoX + 25, egoY + 10);
    this.ctx.lineTo(egoX + 100, egoY + 30);
    this.ctx.lineTo(egoX + 80, egoY + 90);
    this.ctx.lineTo(egoX + 25, egoY + 40);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawEgoVehicle(w, h) {
    const egoX = w / 2;
    const egoY = h * 0.72;

    // Vehicle Shadow
    this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.ctx.beginPath();
    this.ctx.roundRect(egoX - 22, egoY - 38, 44, 80, 8);
    this.ctx.fill();

    // Body (Cyan / Blue / Red on AEB)
    const bodyColor = this.statusLevel === 'AEB_ACTIVE' ? '#FF5A5F' : '#00A3FF';
    this.ctx.fillStyle = bodyColor;
    this.ctx.beginPath();
    this.ctx.roundRect(egoX - 20, egoY - 36, 40, 74, 8);
    this.ctx.fill();

    // Windshields
    this.ctx.fillStyle = '#0F172A';
    this.ctx.fillRect(egoX - 16, egoY - 22, 32, 16); // front
    this.ctx.fillRect(egoX - 15, egoY + 16, 30, 10); // rear

    // Headlights
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(egoX - 18, egoY - 37, 8, 4);
    this.ctx.fillRect(egoX + 10, egoY - 37, 8, 4);

    // Brake lights (Bright red if braking)
    this.ctx.fillStyle = this.aebTriggered || this.statusLevel === 'WARNING' ? '#FF0022' : '#881111';
    this.ctx.fillRect(egoX - 18, egoY + 36, 8, 3);
    this.ctx.fillRect(egoX + 10, egoY + 36, 8, 3);

    // Ego tag
    this.ctx.fillStyle = '#F8FAFC';
    this.ctx.font = 'bold 10px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('EGO VEHICLE (AI)', egoX, egoY + 54);
    this.ctx.textAlign = 'start';
  }

  drawSurroundings(w, h) {
    const roadX = 50;
    const roadW = w - 100;
    const laneW = roadW / 3;

    // 1. Lead Vehicle (in middle lane)
    const egoY = h * 0.72;
    // Map leadDistanceMeters (5 to 80m) to pixels (approx 60 to 320 px ahead)
    const pixelDistance = (this.leadDistanceMeters / 80) * (egoY - 60);
    const leadY = Math.max(45, egoY - pixelDistance);
    const leadX = roadX + laneW * 1.5;

    // Lead Vehicle Body
    this.ctx.fillStyle = '#E2E8F0';
    this.ctx.beginPath();
    this.ctx.roundRect(leadX - 20, leadY - 36, 40, 72, 6);
    this.ctx.fill();

    // Windshield
    this.ctx.fillStyle = '#1E293B';
    this.ctx.fillRect(leadX - 15, leadY - 14, 30, 16);

    // Lead brake lights
    if (this.leadBraking || this.leadDistanceMeters < 15) {
      this.ctx.fillStyle = '#FF0033';
      this.ctx.shadowColor = '#FF0033';
      this.ctx.shadowBlur = 10;
      this.ctx.fillRect(leadX - 18, leadY + 34, 10, 4);
      this.ctx.fillRect(leadX + 8, leadY + 34, 10, 4);
      this.ctx.shadowBlur = 0;
    }

    // 2. Blind Spot Vehicle (in left lane)
    if (this.blindSpotVehicle.active) {
      const bsdX = roadX + laneW * 0.5;
      const bsdY = egoY + this.blindSpotVehicle.relativeY;

      this.ctx.fillStyle = '#F59E0B'; // Amber car
      this.ctx.beginPath();
      this.ctx.roundRect(bsdX - 18, bsdY - 32, 36, 64, 6);
      this.ctx.fill();

      // Blind spot detection alert tag
      this.ctx.fillStyle = '#FF5A5F';
      this.ctx.font = 'bold 9px monospace';
      this.ctx.fillText('BLIND SPOT', bsdX - 25, bsdY - 40);
    }

    // 3. Jaywalking Pedestrian
    if (this.pedestrian.active) {
      this.ctx.fillStyle = '#FF5A5F';
      this.ctx.beginPath();
      this.ctx.arc(this.pedestrian.x, this.pedestrian.y, 7, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.stroke();

      this.ctx.font = 'bold 9px monospace';
      this.ctx.fillText('PEDESTRIAN', this.pedestrian.x - 24, this.pedestrian.y - 12);
    }
  }

  drawTelemetryOverlays(w, h) {
    const egoX = w / 2;
    const egoY = h * 0.72;
    const roadX = 50;
    const roadW = w - 100;
    const laneW = roadW / 3;
    const pixelDistance = (this.leadDistanceMeters / 80) * (egoY - 60);
    const leadY = Math.max(45, egoY - pixelDistance);
    const leadX = roadX + laneW * 1.5;

    // Measurement bracket line between ego and lead
    this.ctx.strokeStyle = this.statusLevel === 'AEB_ACTIVE' ? '#FF5A5F' : '#00D09C';
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([3, 3]);
    this.ctx.beginPath();
    this.ctx.moveTo(egoX, egoY - 40);
    this.ctx.lineTo(leadX, leadY + 40);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Telemetry label mid-distance
    const midX = (egoX + leadX) / 2 + 15;
    const midY = (egoY - 40 + leadY + 40) / 2;

    this.ctx.fillStyle = '#0F172A';
    this.ctx.fillRect(midX - 4, midY - 14, 90, 26);
    this.ctx.strokeStyle = '#334155';
    this.ctx.strokeRect(midX - 4, midY - 14, 90, 26);

    this.ctx.fillStyle = '#F8FAFC';
    this.ctx.font = 'bold 10px monospace';
    this.ctx.fillText(`DIST: ${this.leadDistanceMeters.toFixed(1)}m`, midX, midY - 1);
    this.ctx.fillStyle = this.ttcSeconds < 1.5 ? '#FF5A5F' : '#00D09C';
    this.ctx.fillText(`TTC: ${this.ttcSeconds > 8 ? '> 8.0s' : this.ttcSeconds.toFixed(2) + 's'}`, midX, midY + 10);
  }

  updateDashboard() {
    const elTtc = document.getElementById('val-metric-ttc');
    const elLatency = document.getElementById('val-metric-latency');
    const elBrakePrecharge = document.getElementById('val-brake-precharge');
    const elAebStatus = document.getElementById('val-aeb-status');
    const elRelSpeed = document.getElementById('val-rel-speed');

    const relSpeed = (this.egoSpeedKmh - this.leadSpeedKmh).toFixed(0);

    if (elTtc) elTtc.innerText = this.ttcSeconds > 8 ? 'SAFE (>8s)' : `${this.ttcSeconds.toFixed(2)} s`;
    if (elLatency) elLatency.innerText = `${this.decisionLatencyMs} ms`;
    if (elRelSpeed) elRelSpeed.innerText = `${relSpeed > 0 ? '+' : ''}${relSpeed} km/h`;

    if (elBrakePrecharge) {
      if (this.brakePrecharged) {
        elBrakePrecharge.className = 'text-amber-400 font-mono font-bold animate-pulse';
        elBrakePrecharge.innerText = 'PRE-CHARGED';
      } else {
        elBrakePrecharge.className = 'text-slate-400 font-mono';
        elBrakePrecharge.innerText = 'STANDBY';
      }
    }

    if (elAebStatus) {
      if (this.statusLevel === 'AEB_ACTIVE') {
        elAebStatus.className = 'px-3 py-1 bg-red-600/30 text-red-400 border border-red-500 rounded font-bold text-xs animate-pulse';
        elAebStatus.innerText = '🚨 AEB AUTONOMOUS BRAKING';
      } else if (this.statusLevel === 'WARNING') {
        elAebStatus.className = 'px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500 rounded font-bold text-xs';
        elAebStatus.innerText = '⚠️ FCW COLLISION WARNING';
      } else {
        elAebStatus.className = 'px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500 rounded font-bold text-xs';
        elAebStatus.innerText = '✓ CLEAR TRAJECTORY';
      }
    }
  }
}

window.collisionAvoidanceSystem = new CollisionAvoidanceSystem();
