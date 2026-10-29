// Weather and Road Hazard Detection & V2X Broadcast Network
// Directly implements Slide 6 (Environment) & Deliverable 2 from PPT

class HazardAlertNetwork {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    
    // Active Hazard Catalog (Slide 6)
    this.hazards = [
      {
        id: 'fog-01',
        type: 'Fog',
        icon: 'cloud-fog',
        location: 'Highway 101 · Sector 4 North',
        x: 180,
        y: 110,
        radius: 75,
        severity: 'HIGH',
        metricTitle: 'Visibility Distance',
        metricValue: '35 meters',
        speedAdvisory: '40 km/h (Normal: 90)',
        source: 'Roadside CCTV + Optical Transmissometer',
        color: '#F5B800',
        activeVehiclesInZone: 14
      },
      {
        id: 'rain-02',
        type: 'Heavy Rain',
        icon: 'cloud-rain',
        location: 'Bay Bridge Expressway · Km 18',
        x: 420,
        y: 160,
        radius: 95,
        severity: 'CRITICAL',
        metricTitle: 'Hydroplaning Risk Index',
        metricValue: '8.7 / 10 (Friction μ = 0.32)',
        speedAdvisory: '50 km/h (Normal: 100)',
        source: 'Wiper telemetry + ESP slip detection',
        color: '#00A3FF',
        activeVehiclesInZone: 28
      },
      {
        id: 'pothole-03',
        type: 'Pothole Defect',
        icon: 'alert-triangle',
        location: 'Urban Arterial 5 · Lane 2',
        x: 290,
        y: 280,
        radius: 35,
        severity: 'MODERATE',
        metricTitle: 'Defect Dimensions',
        metricValue: '45cm diam / 8cm depth',
        speedAdvisory: 'Lane 2 closed · Merge Lane 1',
        source: 'Crowd-sourced suspension accelerometers (23 hits)',
        color: '#FF5A5F',
        activeVehiclesInZone: 8
      },
      {
        id: 'ice-04',
        type: 'Slippery Surface',
        icon: 'snowflake',
        location: 'Mountain Pass Viaduct · Deck A',
        x: 130,
        y: 360,
        radius: 50,
        severity: 'CRITICAL',
        metricTitle: 'Road Surface Friction',
        metricValue: 'μ = 0.18 (Black Ice Risk)',
        speedAdvisory: '30 km/h · Traction control mandatory',
        source: 'Embedded thermal pavement sensors',
        color: '#00D09C',
        activeVehiclesInZone: 5
      }
    ];

    this.selectedHazard = this.hazards[1]; // Heavy Rain default
    this.broadcastPulse = null; // animation pulse for V2X
    this.animationId = null;
  }

  init() {
    this.canvas = document.getElementById('hazard-map-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.bindEvents();
    this.renderHazardList();
    this.selectHazard(this.hazards[1]);
    this.startLoop();
  }

  bindEvents() {
    const btnBroadcast = document.getElementById('btn-broadcast-v2x');
    const formReport = document.getElementById('form-report-defect');

    if (btnBroadcast) {
      btnBroadcast.addEventListener('click', () => this.broadcastToApproachingVehicles());
    }

    if (formReport) {
      formReport.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleUserReport(e);
      });
    }

    // Canvas click detection for selecting hazards
    if (this.canvas) {
      this.canvas.addEventListener('click', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const clickY = (e.clientY - rect.top) * (this.canvas.height / rect.height);

        for (const h of this.hazards) {
          const dist = Math.hypot(clickX - h.x, clickY - h.y);
          if (dist <= h.radius + 15) {
            this.selectHazard(h);
            if (window.soundEngine) window.soundEngine.playClick();
            break;
          }
        }
      });
    }
  }

  selectHazard(hazard) {
    this.selectedHazard = hazard;
    const titleEl = document.getElementById('hazard-detail-title');
    const typeEl = document.getElementById('hazard-detail-type');
    const locEl = document.getElementById('hazard-detail-loc');
    const metricTitleEl = document.getElementById('hazard-metric-title');
    const metricValEl = document.getElementById('hazard-metric-val');
    const speedEl = document.getElementById('hazard-speed-advisory');
    const sourceEl = document.getElementById('hazard-sensor-source');
    const badgeEl = document.getElementById('hazard-severity-badge');

    if (titleEl) titleEl.innerText = `${hazard.type} Detected`;
    if (typeEl) typeEl.innerText = hazard.type;
    if (locEl) locEl.innerText = hazard.location;
    if (metricTitleEl) metricTitleEl.innerText = hazard.metricTitle;
    if (metricValEl) metricValEl.innerText = hazard.metricValue;
    if (speedEl) speedEl.innerText = hazard.speedAdvisory;
    if (sourceEl) sourceEl.innerText = hazard.source;

    if (badgeEl) {
      badgeEl.innerText = hazard.severity;
      badgeEl.className = hazard.severity === 'CRITICAL' ?
        'px-2.5 py-1 text-xs font-bold rounded bg-red-500/20 text-red-400 border border-red-500' :
        hazard.severity === 'HIGH' ?
        'px-2.5 py-1 text-xs font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500' :
        'px-2.5 py-1 text-xs font-bold rounded bg-blue-500/20 text-blue-400 border border-blue-500';
    }

    // Highlight card in list
    document.querySelectorAll('.hazard-card-item').forEach(card => {
      if (card.dataset.id === hazard.id) {
        card.classList.add('border-emerald-400', 'bg-slate-800');
      } else {
        card.classList.remove('border-emerald-400', 'bg-slate-800');
      }
    });
  }

  renderHazardList() {
    const list = document.getElementById('hazard-cards-container');
    if (!list) return;
    list.innerHTML = '';

    this.hazards.forEach(h => {
      const div = document.createElement('div');
      div.className = 'hazard-card-item p-3 rounded-lg border border-slate-700 bg-slate-900/60 hover:border-slate-500 cursor-pointer transition flex items-center justify-between text-left';
      div.dataset.id = h.id;
      div.innerHTML = `
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${h.color}"></span>
            <span class="font-bold text-sm text-slate-100">${h.type}</span>
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">${h.severity}</span>
          </div>
          <p class="text-xs text-slate-400 mt-1">${h.location}</p>
        </div>
        <div class="text-right">
          <div class="text-xs font-mono font-bold text-emerald-400">${h.activeVehiclesInZone} cars</div>
          <span class="text-[10px] text-slate-400">in zone</span>
        </div>
      `;
      div.addEventListener('click', () => this.selectHazard(h));
      list.appendChild(div);
    });
  }

  broadcastToApproachingVehicles() {
    if (!this.selectedHazard) return;

    if (window.soundEngine) {
      window.soundEngine.playSuccess();
    }

    // Trigger radiating V2X radio wave animation
    this.broadcastPulse = {
      x: this.selectedHazard.x,
      y: this.selectedHazard.y,
      radius: this.selectedHazard.radius,
      maxRadius: 280,
      alpha: 1.0
    };

    const statusEl = document.getElementById('v2x-broadcast-status');
    if (statusEl) {
      statusEl.classList.remove('hidden');
      statusEl.innerHTML = `
        <div class="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>V2X GEOFENCE BROADCAST DISPATCHED: <strong>${this.selectedHazard.activeVehiclesInZone} vehicles</strong> alerted. Automatic speed advisory (${this.selectedHazard.speedAdvisory}) delivered to approaching Driver HUDs.</span>
        </div>
      `;
      setTimeout(() => {
        statusEl.classList.add('hidden');
      }, 5000);
    }
  }

  handleUserReport(e) {
    const type = document.getElementById('report-type').value;
    const location = document.getElementById('report-loc').value || 'Highway Sector 9';
    const severity = document.getElementById('report-severity').value;

    const newHazard = {
      id: 'hazard-' + Date.now(),
      type: type,
      icon: 'alert-triangle',
      location: location,
      x: 150 + Math.random() * 250,
      y: 100 + Math.random() * 250,
      radius: 40,
      severity: severity,
      metricTitle: 'Crowd-Sourced Validation',
      metricValue: '1 report verified by AI Sensor Correlation',
      speedAdvisory: 'Exercise heightened caution',
      source: 'Citizen mobile report + Roadside Camera verification',
      color: '#FF5A5F',
      activeVehiclesInZone: 4
    };

    this.hazards.push(newHazard);
    this.renderHazardList();
    this.selectHazard(newHazard);

    if (window.soundEngine) window.soundEngine.playSuccess();
    alert(`✓ Hazard logged: "${type}" at ${location} has been cataloged and integrated into the V2X safety network.`);
    e.target.reset();
  }

  startLoop() {
    const loop = () => {
      this.drawCanvas();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  drawCanvas() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.clearRect(0, 0, w, h);

    // 1. GIS Dark Road Map Grid
    this.ctx.fillStyle = '#080C16';
    this.ctx.fillRect(0, 0, w, h);

    // Draw major arterial roadways on map
    this.ctx.strokeStyle = '#1E293B';
    this.ctx.lineWidth = 14;

    // Curved highway 1
    this.ctx.beginPath();
    this.ctx.moveTo(30, 80);
    this.ctx.bezierCurveTo(180, 70, 320, 220, 520, 180);
    this.ctx.stroke();

    // Curved highway 2
    this.ctx.beginPath();
    this.ctx.moveTo(80, 420);
    this.ctx.bezierCurveTo(200, 320, 360, 350, 500, 100);
    this.ctx.stroke();

    // Secondary connector
    this.ctx.strokeStyle = '#152033';
    this.ctx.lineWidth = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(250, 20);
    this.ctx.lineTo(250, 440);
    this.ctx.stroke();

    // 2. Draw Hazard Zones
    this.hazards.forEach(hz => {
      const isSelected = this.selectedHazard && this.selectedHazard.id === hz.id;

      // Geofence zone aura
      const grad = this.ctx.createRadialGradient(hz.x, hz.y, 5, hz.x, hz.y, hz.radius);
      grad.addColorStop(0, hz.color + '66');
      grad.addColorStop(0.8, hz.color + '22');
      grad.addColorStop(1, 'transparent');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(hz.x, hz.y, hz.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Border circle
      this.ctx.strokeStyle = isSelected ? '#FFFFFF' : hz.color;
      this.ctx.lineWidth = isSelected ? 2.5 : 1.5;
      this.ctx.setLineDash(isSelected ? [] : [4, 4]);
      this.ctx.beginPath();
      this.ctx.arc(hz.x, hz.y, hz.radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Center marker icon dot
      this.ctx.fillStyle = hz.color;
      this.ctx.beginPath();
      this.ctx.arc(hz.x, hz.y, 8, 0, Math.PI * 2);
      this.ctx.fill();

      // Label text
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 10px monospace';
      this.ctx.fillText(hz.type.toUpperCase(), hz.x - 25, hz.y - 14);
    });

    // 3. Draw Broadcast Wave Pulse (if active)
    if (this.broadcastPulse) {
      const p = this.broadcastPulse;
      this.ctx.strokeStyle = `rgba(0, 208, 156, ${p.alpha})`;
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.stroke();

      p.radius += 3.5;
      p.alpha -= 0.015;

      if (p.radius > p.maxRadius || p.alpha <= 0) {
        this.broadcastPulse = null;
      }
    }
  }
}

window.hazardAlertNetwork = new HazardAlertNetwork();
