// Crash Response Trigger & Telemetry Auto-Dispatch Module
// Directly implements Slide 2, 7, 9 & Deliverable 4 (Slide 14) from PPT

class CrashResponseSystem {
  constructor() {
    this.isActive = false;
    this.telemetryData = null;
    this.latencyMs = 78; // <= 120 ms target
    this.timerInterval = null;
    this.etaSeconds = 340; // ~5.6 mins (vs 11.8 mins standard)
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    const btnTrigger = document.getElementById('btn-simulate-crash');
    const btnReset = document.getElementById('btn-reset-crash');

    if (btnTrigger) {
      btnTrigger.addEventListener('click', () => this.triggerCrashSimulation());
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => this.resetSimulation());
    }
  }

  triggerCrashSimulation() {
    this.isActive = true;
    this.latencyMs = Math.floor(65 + Math.random() * 30); // <= 120ms
    this.etaSeconds = 340; // 5m 40s

    if (window.soundEngine) {
      window.soundEngine.playWarningAlert();
      setTimeout(() => {
        window.soundEngine.playSirenSound(3);
      }, 500);
    }

    // Construct telemetry payload
    this.telemetryData = {
      event_id: 'CRASH-EVT-' + Math.floor(100000 + Math.random() * 900000),
      timestamp: new Date().toISOString(),
      location: {
        latitude: 37.774929,
        longitude: -122.419416,
        highway_segment: 'Interstate 80 · Westbound Mile 14.2'
      },
      impact_kinetics: {
        pre_crash_speed_kmh: 84.2,
        post_crash_speed_kmh: 0.0,
        peak_g_force: 16.4,
        impact_vector: 'FRONT_LEFT_OBLIQUE (28°)',
        vehicle_roll_angle: '34° ROLLOVER IMMINENT'
      },
      occupant_safety: {
        airbags_deployed: ['DRIVER_FRONTAL', 'PASSENGER_FRONTAL', 'SIDE_CURTAIN_LEFT'],
        occupants_detected: 2,
        seatbelt_pretensioners: 'FIRED_ALL_SEATS',
        eCall_sos_voice_line: 'CONNECTED_AUTO_AUDIO'
      },
      vehicle_state: {
        vin: '1HGCR2F83HA094121',
        make_model: 'Aegis Intelligent EV 2026',
        fuel_battery_cutoff: 'HIGH_VOLTAGE_ISOLATED',
        hazard_flashers: 'ACTIVE_STROBE'
      },
      telecom_latency: `${this.latencyMs} ms (Target ≤ 120 ms)`
    };

    this.renderTelemetryUI();
    this.startEtaCountdown();
  }

  renderTelemetryUI() {
    const statusCard = document.getElementById('crash-status-card');
    const jsonOutput = document.getElementById('crash-telemetry-json');
    const badgeLatency = document.getElementById('badge-crash-latency');
    const elGforce = document.getElementById('metric-crash-gforce');
    const elSpeedDrop = document.getElementById('metric-crash-speed');
    const elAirbag = document.getElementById('metric-crash-airbag');
    const elRoll = document.getElementById('metric-crash-roll');
    const elOccupants = document.getElementById('metric-crash-occupants');

    if (statusCard) statusCard.classList.remove('hidden');

    if (badgeLatency) {
      badgeLatency.innerText = `DISPATCHED IN ${this.latencyMs}ms (≤120ms TARGET)`;
    }

    if (elGforce) elGforce.innerText = `${this.telemetryData.impact_kinetics.peak_g_force} G`;
    if (elSpeedDrop) elSpeedDrop.innerText = `${this.telemetryData.impact_kinetics.pre_crash_speed_kmh} → 0 km/h`;
    if (elAirbag) elAirbag.innerText = 'DEPLOYED (3/3)';
    if (elRoll) elRoll.innerText = this.telemetryData.impact_kinetics.vehicle_roll_angle;
    if (elOccupants) elOccupants.innerText = `${this.telemetryData.occupant_safety.occupants_detected} Persons Detected`;

    if (jsonOutput) {
      jsonOutput.innerText = JSON.stringify(this.telemetryData, null, 2);
    }
  }

  startEtaCountdown() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    const elTimer = document.getElementById('crash-ems-eta');
    this.timerInterval = setInterval(() => {
      this.etaSeconds--;
      if (this.etaSeconds <= 0) {
        clearInterval(this.timerInterval);
        if (elTimer) elTimer.innerText = 'EMS ARRIVED AT SCENE';
        return;
      }
      const mins = Math.floor(this.etaSeconds / 60);
      const secs = this.etaSeconds % 60;
      if (elTimer) elTimer.innerText = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    }, 1000);
  }

  resetSimulation() {
    this.isActive = false;
    this.telemetryData = null;
    if (this.timerInterval) clearInterval(this.timerInterval);

    const statusCard = document.getElementById('crash-status-card');
    if (statusCard) statusCard.classList.add('hidden');

    if (window.soundEngine) window.soundEngine.playClick();
  }
}

window.crashResponseSystem = new CrashResponseSystem();
