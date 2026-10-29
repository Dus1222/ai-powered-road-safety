// Executive Research Hub, Literature Survey & Future Roadmap Module
// Directly implements Slides 1, 2, 3, 9, 10, 11, 12, 13, 14, 15

class ResearchHub {
  constructor() {
    this.studies = [
      {
        author: 'Sahayadhas et al.',
        year: 2012,
        focus: 'Driver drowsiness',
        technique: 'EEG + facial features',
        contribution: 'Multimodal fusion improves fatigue detection vs. single sensor.',
        gapCategory: 'Environmental Robustness',
        gapDetail: 'Intrusive sensor setup; unfeasible for consumer fleet adoption.'
      },
      {
        author: 'Chong et al.',
        year: 2013,
        focus: 'Accident prediction',
        technique: 'Neural networks',
        contribution: 'Severity classification from historical crash records.',
        gapCategory: 'Data Scarcity',
        gapDetail: 'Weak generalization on rare black-swan edge events and micro-accidents.'
      },
      {
        author: 'Mukhopadhyay et al.',
        year: 2018,
        focus: 'Pedestrian detection',
        technique: 'CNN (YOLO / SSD)',
        contribution: 'Real-time multi-scale detection in ADAS camera feeds.',
        gapCategory: 'Environmental Robustness',
        gapDetail: 'High false negatives under heavy occlusion, dusk glare, and severe rain.'
      },
      {
        author: 'Wang et al.',
        year: 2019,
        focus: 'Traffic flow',
        technique: 'LSTM time-series',
        contribution: 'Short-horizon congestion forecasting outperforms standard ARIMA baselines.',
        gapCategory: 'Scalability',
        gapDetail: 'Lacks real-time V2X coordination to trigger dynamic green waves.'
      },
      {
        author: 'Grigorescu et al.',
        year: 2020,
        focus: 'Autonomous driving',
        technique: 'Deep learning survey',
        contribution: 'Comprehensive breakdown of end-to-end perception, planning, and control stacks.',
        gapCategory: 'Safety Validation',
        gapDetail: 'Deterministic safety verification remains the open regulatory frontier.'
      },
      {
        author: 'Zhang et al.',
        year: 2021,
        focus: 'V2X communication',
        technique: 'IoT + edge AI',
        contribution: 'Cooperative perception significantly lowers intersection conflict points.',
        gapCategory: 'Connectivity Dependence',
        gapDetail: 'Requires high base-station saturation and <5ms ultra-reliable low latency (URLLC).'
      },
      {
        author: 'Khan et al.',
        year: 2022,
        focus: 'Hazard detection',
        technique: 'Transformer + sensor fusion',
        contribution: 'Robust road defect and weather classification across varied geographies.',
        gapCategory: 'Data Scarcity',
        gapDetail: 'High compute requirements for onboard embedded microcontrollers.'
      }
    ];

    this.benchmarkChart = null;
  }

  init() {
    this.renderLiteratureTable(this.studies);
    this.bindSearchAndFilter();
    this.renderOutcomeChart();
  }

  renderLiteratureTable(items) {
    const tbody = document.getElementById('literature-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    items.forEach(s => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-800 hover:bg-slate-800/40 transition text-xs';
      tr.innerHTML = `
        <td class="py-3 px-4 font-semibold text-slate-200 whitespace-nowrap">${s.author} <span class="text-slate-400 font-normal">(${s.year})</span></td>
        <td class="py-3 px-4 text-emerald-400 font-mono">${s.focus}</td>
        <td class="py-3 px-4 text-cyan-300 font-mono">${s.technique}</td>
        <td class="py-3 px-4 text-slate-300">${s.contribution}</td>
        <td class="py-3 px-4">
          <span class="px-2 py-0.5 rounded text-[11px] font-mono bg-red-500/10 text-red-400 border border-red-500/30">${s.gapCategory}</span>
          <p class="text-[10px] text-slate-400 mt-1">${s.gapDetail}</p>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  bindSearchAndFilter() {
    const inputSearch = document.getElementById('search-literature');
    const selectFilter = document.getElementById('filter-gap-category');

    const filterHandler = () => {
      const q = inputSearch ? inputSearch.value.toLowerCase() : '';
      const cat = selectFilter ? selectFilter.value : 'ALL';

      const filtered = this.studies.filter(s => {
        const matchesQuery = s.author.toLowerCase().includes(q) ||
                             s.focus.toLowerCase().includes(q) ||
                             s.technique.toLowerCase().includes(q) ||
                             s.contribution.toLowerCase().includes(q);
        const matchesCat = cat === 'ALL' || s.gapCategory === cat;
        return matchesQuery && matchesCat;
      });

      this.renderLiteratureTable(filtered);
    };

    if (inputSearch) inputSearch.addEventListener('input', filterHandler);
    if (selectFilter) selectFilter.addEventListener('change', filterHandler);
  }

  renderOutcomeChart() {
    const canvas = document.getElementById('chart-outcome-comparison');
    if (!canvas || typeof Chart === 'undefined') return;

    const ctx = canvas.getContext('2d');
    
    // Slide 14 Our Outcome metrics
    this.benchmarkChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [
          'Drowsiness Accuracy (%)',
          'Near-Miss Reduction (%)',
          'EMS Notification Speed (%)',
          'Accident Decrease (%)',
          'Fuel Use Savings (%)'
        ],
        datasets: [
          {
            label: 'Industry Standard / Baseline',
            data: [72.0, 15.0, 10.0, 12.0, 5.0],
            backgroundColor: 'rgba(100, 116, 139, 0.4)',
            borderColor: '#64748B',
            borderWidth: 1.5
          },
          {
            label: 'Road Safety AI Prototype (Our System)',
            data: [94.6, 41.0, 58.0, 38.0, 22.0],
            backgroundColor: [
              'rgba(255, 90, 95, 0.7)',
              'rgba(0, 208, 156, 0.7)',
              'rgba(0, 163, 255, 0.7)',
              'rgba(245, 184, 0, 0.7)',
              'rgba(16, 185, 129, 0.7)'
            ],
            borderColor: [
              '#FF5A5F',
              '#00D09C',
              '#00A3FF',
              '#F5B800',
              '#10B981'
            ],
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#94A3B8',
              font: { family: 'Plus Jakarta Sans', size: 12 }
            }
          },
          tooltip: {
            backgroundColor: '#0F172A',
            borderColor: '#334155',
            borderWidth: 1,
            titleColor: '#F8FAFC',
            bodyColor: '#CBD5E1'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: '#64748B',
              font: { family: 'JetBrains Mono' },
              callback: (v) => `${v}%`
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            }
          },
          x: {
            ticks: {
              color: '#94A3B8',
              font: { family: 'Plus Jakarta Sans', size: 11 }
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }
}

window.researchHub = new ResearchHub();
