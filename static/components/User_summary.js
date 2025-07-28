export default {
  template: `
    <div class="container-fluid px-4 py-4" style="background-color: #06262eff; min-height: 100vh;">
      <h2 class="text-center mb-4 text-white fw-semibold text-uppercase" style="letter-spacing: 1px;">
        User Summary
      </h2>
      <div class="row justify-content-center mb-4">
        <div class="col-12 col-md-6 col-lg-4">
          <div class="card custom-card text-center p-4 h-100">
            <h5 class="text-dark">Total Spots Used</h5>
            <p class="display-6 mb-0 text-dark">{{ totalSpotsUsed }}</p>
          </div>
        </div>
      </div>
      <div class="row justify-content-center">
        <div class="col-12 col-lg-6">
          <div class="card shadow-sm p-4 h-100">
            <h3 class="text-center mb-4">User Parking Lot Frequency</h3>
            <div style="position: relative; width: 100%; height: 300px;">
              <canvas id="userChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>`
  ,
  data() {
    return {
      chart: null,
      totalSpotsUsed: 0
    };
  },

  async mounted() {
    await this.loadChart();
  },

  methods: {
    req() {
      return {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('auth_token'),
        },
      };
    },

    async loadChart() {
      const res = await fetch('/api/user_summary', this.req());
      if (!res.ok) return;
      const summary = await res.json();
      this.totalSpotsUsed = summary.total_used_spots || 0;
      if (this.chart) this.chart.destroy();
      const ctx = document.getElementById('userChart').getContext('2d');
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: summary.labels,
          datasets: [{
            label: 'Number of Times Parked',
            data: summary.data,
            backgroundColor: 'rgba(179, 0, 89, 0.7)',
            borderColor: 'rgba(179, 0, 89, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Your Most Visited Parking Lots'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
                callback: function(value) {
                  return Number.isInteger(value) ? value : '';
                }
              },
              title: {
                display: true,
                text: 'Visit Count'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Parking Lots'
              }
            }
          }
        }
      });
    }
  }
};
