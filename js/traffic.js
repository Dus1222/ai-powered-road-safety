// Intelligent Traffic Management & Smart-Signal Controller
// Directly implements Slide 5 (Traffic Management), Slide 8 (Smart Cities), & Deliverable 3

class TrafficManagementSystem {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    
    // Intersection State: 'NS_GREEN' or 'EW_GREEN'
    this.signalPhase = 'NS_GREEN';
    this.phaseTimer = 14; // seconds remaining in phase
    this.isAiAdaptive = true; // AI mode vs fixed timer mode
    this.emsActive = false; // Emergency Vehicle Priority Override
    
    // Traffic Queues
    this.queues = {
      north: 6,
      south: 8,
      east: 3,
      west: 4
    };
    
    // Vehicles in canvas simulation
    this.vehicles = [];
    this.ambulance = null;
    
    // Live Impact Metrics from Slide 5:
    // -27% wait time, +18% throughput, -32% incidents
    this.stats = {
      waitTimeReduction: 27,
      throughputGain: 18,
      incidentReduction: 32,
      totalVehiclesProcessed: 1482
    };

    this.animationId = null;
    this.lastTime = Date.now();
  }

  init() {
    this.canvas = document.getElementById('traffic-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.spawnInitialVehicles();
    this.bindControls();
    this.startLoop();
  }

  spawnInitialVehicles() {
    this.vehicles = [
      { id: 1, dir: 'S', x: 265, y: 460, speed: 1.8, state: 'approaching', color: '#00A3FF' },
      { id: 2, dir: 'S', x: 265, y: 520, speed: 1.8, state: 'approaching', color: '#F59E0B' },
      { id: 3, dir: 'N', x: 235, y: 40, speed: 1.8, state: 'approaching', color: '#E2E8F0' },
      { id: 4, dir: 'E', x: 40, y: 235, speed: 1.8, state: 'approaching', color: '#10B981' },
      { id: 5, dir: 'W', x: 460, y: 265, speed: 1.8, state: 'approaching', color: '#8B5CF6' }
    ];
  }

  bindControls() {
    const btnEms = document.getElementById('btn-dispatch-ems');
    const toggleAi = document.getElementById('toggle-ai-traffic');
    const btnAddNs = document.getElementById('btn-add-ns-traffic');
    const btnAddEw = document.getElementById('btn-add-ew-traffic');

    if (btnEms) {
      btnEms.addEventListener('click', () => this.dispatchEmergencyAmbulance());
    }

    if (toggleAi) {
      toggleAi.addEventListener('change', (e) => {
        this.isAiAdaptive = e.target.checked;
        const modeBadge = document.getElementById('traffic-mode-badge');
        if (modeBadge) {
          modeBadge.innerText = this.isAiAdaptive ? '🤖 ML ADAPTIVE SCHEDULING' : '⏱️ FIXED TIMER MODE';
          modeBadge.className = this.isAiAdaptive ? 
            'px-2.5 py-1 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500' :
            'px-2.5 py-1 text-xs font-semibold rounded bg-slate-700 text-slate-300 border border-slate-600';
        }
      });
    }

    if (btnAddNs) {
      btnAddNs.addEventListener('click', () => {
        this.queues.north += 4;
        this.queues.south += 4;
        this.spawnTrafficBatch('NS');
      });
    }

    if (btnAddEw) {
      btnAddEw.addEventListener('click', () => {
        this.queues.east += 4;
        this.queues.west += 4;
        this.spawnTrafficBatch('EW');
      });
    }
  }

  spawnTrafficBatch(axis) {
    if (axis === 'NS') {
      this.vehicles.push({ id: Date.now(), dir: 'S', x: 265, y: 550, speed: 1.8, state: 'approaching', color: '#00A3FF' });
      this.vehicles.push({ id: Date.now() + 1, dir: 'N', x: 235, y: -20, speed: 1.8, state: 'approaching', color: '#F59E0B' });
    } else {
      this.vehicles.push({ id: Date.now(), dir: 'E', x: -20, y: 235, speed: 1.8, state: 'approaching', color: '#10B981' });
      this.vehicles.push({ id: Date.now() + 1, dir: 'W', x: 520, y: 265, speed: 1.8, state: 'approaching', color: '#8B5CF6' });
    }
  }

  dispatchEmergencyAmbulance() {
    if (this.emsActive) return;
    this.emsActive = true;

    if (window.soundEngine) {
      window.soundEngine.playSirenSound(4.5);
    }

    // Spawn ambulance at bottom of South approach
    this.ambulance = {
      dir: 'S',
      x: 265,
      y: 530,
      speed: 3.8, // high speed
      flashState: true
    };

    // Instant Green Wave preemption:
    // Change signal immediately to NS_GREEN with locked green corridor
    this.signalPhase = 'NS_GREEN';
    this.phaseTimer = 18;

    this.logTrafficAlert('🚨 EMS PRE-EMPTION ACTIVE: Emergency ambulance inbound from South approach. Green Corridor established across Intersection 04-B.');

    const banner = document.getElementById('ems-corridor-banner');
    if (banner) banner.classList.remove('hidden');
  }

  startLoop() {
    const loop = () => {
      this.updateLogic();
      this.drawCanvas();
      this.updateUI();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  updateLogic() {
    const now = Date.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Countdown signal phase
    this.phaseTimer -= dt;

    if (this.phaseTimer <= 0) {
      if (this.emsActive) {
        // Keep NS green until ambulance has cleared
        this.phaseTimer = 6;
      } else {
        // Toggle phase
        this.signalPhase = this.signalPhase === 'NS_GREEN' ? 'EW_GREEN' : 'NS_GREEN';
        
        // AI Adaptive phase timing based on relative queue density
        if (this.isAiAdaptive) {
          const nsTotal = this.queues.north + this.queues.south;
          const ewTotal = this.queues.east + this.queues.west;
          
          if (this.signalPhase === 'NS_GREEN') {
            this.phaseTimer = Math.max(8, Math.min(24, Math.round(12 * (nsTotal / Math.max(1, ewTotal)))));
          } else {
            this.phaseTimer = Math.max(8, Math.min(24, Math.round(12 * (ewTotal / Math.max(1, nsTotal)))));
          }
        } else {
          this.phaseTimer = 12; // fixed timer
        }
      }
    }

    // Update Vehicles
    const stopLineS = 310;
    const stopLineN = 190;
    const stopLineE = 190;
    const stopLineW = 310;

    this.vehicles.forEach((veh, index) => {
      let canMove = true;

      // Check traffic signal rules
      if (veh.dir === 'S') {
        if (this.signalPhase !== 'NS_GREEN' && veh.y > stopLineS && veh.y < stopLineS + 35) {
          canMove = false;
        }
        if (canMove) veh.y -= veh.speed;
        if (veh.y < -40) {
          veh.y = 540;
          this.stats.totalVehiclesProcessed++;
        }
      } else if (veh.dir === 'N') {
        if (this.signalPhase !== 'NS_GREEN' && veh.y < stopLineN && veh.y > stopLineN - 35) {
          canMove = false;
        }
        if (canMove) veh.y += veh.speed;
        if (veh.y > 540) {
          veh.y = -40;
          this.stats.totalVehiclesProcessed++;
        }
      } else if (veh.dir === 'E') {
        if (this.signalPhase !== 'EW_GREEN' && veh.x < stopLineE && veh.x > stopLineE - 35) {
          canMove = false;
        }
        if (canMove) veh.x += veh.speed;
        if (veh.x > 540) {
          veh.x = -40;
          this.stats.totalVehiclesProcessed++;
        }
      } else if (veh.dir === 'W') {
        if (this.signalPhase !== 'EW_GREEN' && veh.x > stopLineW && veh.x < stopLineW + 35) {
          canMove = false;
        }
        if (canMove) veh.x -= veh.speed;
        if (veh.x < -40) {
          veh.x = 540;
          this.stats.totalVehiclesProcessed++;
        }
      }
    });

    // Update Ambulance if active
    if (this.ambulance) {
      this.ambulance.y -= this.ambulance.speed;
      this.ambulance.flashState = (Math.floor(Date.now() / 150) % 2) === 0;

      if (this.ambulance.y < -50) {
        // Ambulance passed through
        this.ambulance = null;
        this.emsActive = false;
        this.logTrafficAlert('✓ EMS Priority mission accomplished: Ambulance cleared intersection. Resumed normal AI adaptive flow.');
        const banner = document.getElementById('ems-corridor-banner');
        if (banner) banner.classList.add('hidden');
      }
    }
  }

  drawCanvas() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.clearRect(0, 0, w, h);

    // 1. Draw Intersection Roads & Sidewalks
    this.drawRoadGrid(w, h);

    // 2. Draw Smart Traffic Light Status Heads
    this.drawTrafficLights(w, h);

    // 3. Draw Vehicles
    this.drawVehicles();

    // 4. Draw Ambulance
    if (this.ambulance) {
      this.drawAmbulance();
    }
  }

  drawRoadGrid(w, h) {
    // City block terrain
    this.ctx.fillStyle = '#090D16';
    this.ctx.fillRect(0, 0, w, h);

    // Road asphalt bands (Center crossing at 250, 250)
    const roadWidth = 100;
    const midX = w / 2;
    const midY = h / 2;

    this.ctx.fillStyle = '#111827';
    // North-South road
    this.ctx.fillRect(midX - roadWidth / 2, 0, roadWidth, h);
    // East-West road
    this.ctx.fillRect(0, midY - roadWidth / 2, w, roadWidth);

    // Corner curbs
    this.ctx.strokeStyle = '#1E293B';
    this.ctx.lineWidth = 4;
    // Top-left
    this.ctx.strokeRect(0, 0, midX - roadWidth / 2, midY - roadWidth / 2);
    // Top-right
    this.ctx.strokeRect(midX + roadWidth / 2, 0, midX - roadWidth / 2, midY - roadWidth / 2);
    // Bottom-left
    this.ctx.strokeRect(0, midY + roadWidth / 2, midX - roadWidth / 2, midY - roadWidth / 2);
    // Bottom-right
    this.ctx.strokeRect(midX + roadWidth / 2, midY + roadWidth / 2, midX - roadWidth / 2, midY - roadWidth / 2);

    // Pedestrian crosswalk stripes
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    // South crosswalk
    for (let x = midX - roadWidth / 2 + 5; x < midX + roadWidth / 2 - 5; x += 14) {
      this.ctx.fillRect(x, midY + roadWidth / 2 + 6, 8, 20);
    }
    // North crosswalk
    for (let x = midX - roadWidth / 2 + 5; x < midX + roadWidth / 2 - 5; x += 14) {
      this.ctx.fillRect(x, midY - roadWidth / 2 - 26, 8, 20);
    }
    // West crosswalk
    for (let y = midY - roadWidth / 2 + 5; y < midY + roadWidth / 2 - 5; y += 14) {
      this.ctx.fillRect(midX - roadWidth / 2 - 26, y, 20, 8);
    }
    // East crosswalk
    for (let y = midY - roadWidth / 2 + 5; y < midY + roadWidth / 2 - 5; y += 14) {
      this.ctx.fillRect(midX + roadWidth / 2 + 6, y, 20, 8);
    }

    // Yellow center lane dividers
    this.ctx.strokeStyle = '#F5B800';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([10, 12]);
    // NS center line
    this.ctx.beginPath();
    this.ctx.moveTo(midX, 0);
    this.ctx.lineTo(midX, midY - roadWidth / 2);
    this.ctx.moveTo(midX, midY + roadWidth / 2);
    this.ctx.lineTo(midX, h);
    // EW center line
    this.ctx.moveTo(0, midY);
    this.ctx.lineTo(midX - roadWidth / 2, midY);
    this.ctx.moveTo(midX + roadWidth / 2, midY);
    this.ctx.lineTo(w, midY);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  drawTrafficLights(w, h) {
    const midX = w / 2;
    const midY = h / 2;
    const roadWidth = 100;

    const isNsGreen = this.signalPhase === 'NS_GREEN';
    const isEwGreen = this.signalPhase === 'EW_GREEN';

    // 4 Traffic Light Posts positioned at corners
    const lights = [
      { x: midX + roadWidth / 2 + 8, y: midY + roadWidth / 2 + 8, isGreen: isNsGreen, label: 'S (NS)' },
      { x: midX - roadWidth / 2 - 28, y: midY - roadWidth / 2 - 28, isGreen: isNsGreen, label: 'N (NS)' },
      { x: midX + roadWidth / 2 + 8, y: midY - roadWidth / 2 - 28, isGreen: isEwGreen, label: 'E (EW)' },
      { x: midX - roadWidth / 2 - 28, y: midY + roadWidth / 2 + 8, isGreen: isEwGreen, label: 'W (EW)' }
    ];

    lights.forEach(light => {
      // Traffic light box
      this.ctx.fillStyle = '#1E293B';
      this.ctx.strokeStyle = '#334155';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.roundRect(light.x, light.y, 20, 36, 4);
      this.ctx.fill();
      this.ctx.stroke();

      // Red or Green light circle
      const redY = light.y + 10;
      const greenY = light.y + 26;

      // Red bulb
      this.ctx.fillStyle = !light.isGreen ? '#FF0033' : '#3A1015';
      this.ctx.beginPath();
      this.ctx.arc(light.x + 10, redY, 6, 0, Math.PI * 2);
      this.ctx.fill();

      // Green bulb
      this.ctx.fillStyle = light.isGreen ? '#00D09C' : '#053324';
      this.ctx.beginPath();
      this.ctx.arc(light.x + 10, greenY, 6, 0, Math.PI * 2);
      this.ctx.fill();

      // Countdown timer badge next to light
      this.ctx.fillStyle = light.isGreen ? '#00D09C' : '#FF5A5F';
      this.ctx.font = 'bold 10px monospace';
      this.ctx.fillText(`${Math.ceil(this.phaseTimer)}s`, light.x + 24, light.y + 22);
    });
  }

  drawVehicles() {
    this.vehicles.forEach(veh => {
      this.ctx.save();
      this.ctx.fillStyle = veh.color;

      if (veh.dir === 'S' || veh.dir === 'N') {
        this.ctx.beginPath();
        this.ctx.roundRect(veh.x - 10, veh.y - 18, 20, 36, 4);
        this.ctx.fill();

        // Windshield
        this.ctx.fillStyle = '#0F172A';
        this.ctx.fillRect(veh.x - 7, veh.y - 8, 14, 8);
      } else {
        this.ctx.beginPath();
        this.ctx.roundRect(veh.x - 18, veh.y - 10, 36, 20, 4);
        this.ctx.fill();

        // Windshield
        this.ctx.fillStyle = '#0F172A';
        this.ctx.fillRect(veh.x - 8, veh.y - 7, 8, 14);
      }

      this.ctx.restore();
    });
  }

  drawAmbulance() {
    if (!this.ambulance) return;
    const a = this.ambulance;

    // Body
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.roundRect(a.x - 12, a.y - 22, 24, 44, 4);
    this.ctx.fill();

    // Red cross
    this.ctx.fillStyle = '#FF0033';
    this.ctx.fillRect(a.x - 7, a.y - 3, 14, 6);
    this.ctx.fillRect(a.x - 3, a.y - 7, 6, 14);

    // Flashing emergency beacon (Alternating Blue/Red)
    const beaconColor = a.flashState ? '#FF0022' : '#00A3FF';
    this.ctx.fillStyle = beaconColor;
    this.ctx.shadowColor = beaconColor;
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    this.ctx.arc(a.x, a.y - 14, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // Priority label
    this.ctx.fillStyle = '#FF5A5F';
    this.ctx.font = 'bold 9px monospace';
    this.ctx.fillText('EMS 911 PRIORITY', a.x + 18, a.y);
  }

  logTrafficAlert(msg) {
    const list = document.getElementById('traffic-event-logs');
    if (!list) return;
    const time = new Date().toLocaleTimeString();
    const item = document.createElement('div');
    item.className = 'text-xs py-1.5 px-2.5 rounded bg-slate-800/80 border-l-2 border-emerald-400 mb-1 flex items-start gap-2';
    item.innerHTML = `<span class="text-slate-400 font-mono text-[10px] whitespace-nowrap">${time}</span> <span>${msg}</span>`;
    list.prepend(item);
    while (list.children.length > 10) {
      list.removeChild(list.lastChild);
    }
  }

  updateUI() {
    const elWait = document.getElementById('val-traffic-wait');
    const elThroughput = document.getElementById('val-traffic-throughput');
    const elIncidents = document.getElementById('val-traffic-incidents');
    const elPhase = document.getElementById('val-traffic-phase');

    if (elWait) elWait.innerText = `-${this.stats.waitTimeReduction}%`;
    if (elThroughput) elThroughput.innerText = `+${this.stats.throughputGain}%`;
    if (elIncidents) elIncidents.innerText = `-${this.stats.incidentReduction}%`;
    if (elPhase) elPhase.innerText = this.signalPhase === 'NS_GREEN' ? 'NORTH-SOUTH GREEN' : 'EAST-WEST GREEN';
  }
}

window.trafficManagementSystem = new TrafficManagementSystem();
