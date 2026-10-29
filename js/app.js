// Master Application Coordinator - RoadVision AI 2026

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Subsystems
  if (window.driverMonitoringSystem) window.driverMonitoringSystem.init();
  if (window.collisionAvoidanceSystem) window.collisionAvoidanceSystem.init();
  if (window.trafficManagementSystem) window.trafficManagementSystem.init();
  if (window.hazardAlertNetwork) window.hazardAlertNetwork.init();
  if (window.crashResponseSystem) window.crashResponseSystem.init();
  if (window.architectureVisualizer) window.architectureVisualizer.init();
  if (window.researchHub) window.researchHub.init();

  // 2. Tab Navigation System
  const navTabs = document.querySelectorAll('.nav-tab-btn');
  const tabPanels = document.querySelectorAll('.tab-content-panel');

  function switchTab(targetTabId) {
    if (window.soundEngine) window.soundEngine.playClick();

    navTabs.forEach(btn => {
      if (btn.dataset.tab === targetTabId) {
        btn.classList.add('bg-slate-800', 'text-coral', 'border-b-2', 'border-[#FF5A5F]', 'text-white');
        btn.classList.remove('text-slate-400', 'border-transparent');
      } else {
        btn.classList.remove('bg-slate-800', 'text-coral', 'border-b-2', 'border-[#FF5A5F]', 'text-white');
        btn.classList.add('text-slate-400', 'border-transparent');
      }
    });

    tabPanels.forEach(panel => {
      if (panel.id === targetTabId) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });

    // Refresh Lucide icons
    if (window.lucide) window.lucide.createIcons();

    // Trigger canvas resizing or redraw if needed
    window.dispatchEvent(new Event('resize'));
  }

  navTabs.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // 3. Audio Mute Toggle Button
  const btnMute = document.getElementById('btn-toggle-sound');
  if (btnMute && window.soundEngine) {
    btnMute.addEventListener('click', () => {
      const isMuted = window.soundEngine.toggleMute();
      btnMute.innerHTML = isMuted ? 
        `<i data-lucide="volume-x" class="w-4 h-4 text-red-400"></i> <span class="hidden sm:inline text-xs text-red-400">Audio Muted</span>` :
        `<i data-lucide="volume-2" class="w-4 h-4 text-emerald-400"></i> <span class="hidden sm:inline text-xs text-emerald-400">Audio Alert Active</span>`;
      if (window.lucide) window.lucide.createIcons();
    });
  }

  // 4. Quick Action Emergency SOS in Header
  const btnHeaderSos = document.getElementById('btn-header-sos');
  if (btnHeaderSos) {
    btnHeaderSos.addEventListener('click', () => {
      switchTab('panel-telemetry');
      if (window.crashResponseSystem) {
        window.crashResponseSystem.triggerCrashSimulation();
      }
    });
  }

  // 5. Global Connected Nodes Counter (Fluctuates slightly to simulate live fleet telemetry)
  const elFleetNodes = document.getElementById('global-fleet-nodes');
  if (elFleetNodes) {
    setInterval(() => {
      const base = 14892;
      const variation = Math.floor(Math.sin(Date.now() / 3000) * 18);
      elFleetNodes.innerText = (base + variation).toLocaleString();
    }, 2000);
  }

  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
