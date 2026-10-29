// Interactive Architecture Visualizer
// Directly implements Slide 7 (Architecture: Four layers, one continuous loop)

class ArchitectureVisualizer {
  constructor() {
    this.currentStep = 0;
    this.isAnimating = false;
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    const btnSimulatePipeline = document.getElementById('btn-simulate-pipeline');
    if (btnSimulatePipeline) {
      btnSimulatePipeline.addEventListener('click', () => this.runPipelineSimulation());
    }

    // Allow clicking any individual layer to inspect
    document.querySelectorAll('.arch-layer-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const layerNum = card.dataset.layer;
        this.highlightLayer(parseInt(layerNum));
        if (window.soundEngine) window.soundEngine.playClick();
      });
    });
  }

  runPipelineSimulation() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    if (window.soundEngine) window.soundEngine.playClick();

    const latencyEl = document.getElementById('pipeline-latency-counter');
    const statusTextEl = document.getElementById('pipeline-status-text');

    let latency = 0;
    const interval = setInterval(() => {
      latency += 3;
      if (latencyEl) latencyEl.innerText = `${latency} ms`;
      if (latency >= 94) clearInterval(interval);
    }, 40);

    // Sequence through 4 layers
    this.highlightLayer(1);
    if (statusTextEl) statusTextEl.innerText = 'Step 1/4: Ingesting high-frequency telemetry from CCTV, LiDAR & In-cabin DMS...';

    setTimeout(() => {
      this.highlightLayer(2);
      if (statusTextEl) statusTextEl.innerText = 'Step 2/4: Edge Neural Networks performing multi-modal sensor fusion & risk scoring...';
      if (window.soundEngine) window.soundEngine.playClick();
    }, 1000);

    setTimeout(() => {
      this.highlightLayer(3);
      if (statusTextEl) statusTextEl.innerText = 'Step 3/4: Decision Matrix evaluated: AEB pre-charge confirmed, EMS alert prepared...';
      if (window.soundEngine) window.soundEngine.playClick();
    }, 2000);

    setTimeout(() => {
      this.highlightLayer(4);
      if (statusTextEl) statusTextEl.innerText = 'Step 4/4: Actuators fired: Driver HUD alert broadcast, Adaptive Green wave signaled!';
      if (window.soundEngine) window.soundEngine.playSuccess();
    }, 3000);

    setTimeout(() => {
      // Feedback loop animation
      this.highlightLayer(0); // all or loop back
      if (statusTextEl) statusTextEl.innerText = '✓ Continuous Feedback Loop: Event telemetry fed back into model weights for citywide learning.';
      this.isAnimating = false;
    }, 4200);
  }

  highlightLayer(layerIndex) {
    document.querySelectorAll('.arch-layer-card').forEach(card => {
      const num = parseInt(card.dataset.layer);
      if (layerIndex === 0 || num === layerIndex) {
        card.classList.add('ring-2', 'ring-emerald-400', 'bg-slate-800');
        card.classList.remove('opacity-60');
      } else {
        card.classList.remove('ring-2', 'ring-emerald-400', 'bg-slate-800');
        card.classList.add('opacity-60');
      }
    });
  }
}

window.architectureVisualizer = new ArchitectureVisualizer();
