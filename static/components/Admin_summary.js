export default {
  template: `
    <div class="container-fluid px-4 py-4" style="background-color: #06262eff; min-height: 100vh;">
      <h2 class="text-center mb-4 text-white fw-semibold text-uppercase" style="letter-spacing: 1px;">
        Admin Summary
      </h2>
      <div class="row g-4 justify-content-center">
        <div class="col-sm-6 col-md-4 col-lg-3">
          <div class="card custom-card text-center h-100 shadow-sm">
            <h5 class="fw-semibold">Total Users</h5>
            <p class="display-6 mb-0">{{ summary.user_count }}</p>
          </div>
        </div>
        <div class="col-sm-6 col-md-4 col-lg-3">
          <div class="card custom-card text-center h-100 shadow-sm">
            <h5 class="fw-semibold">Total Parking Lots</h5>
            <p class="display-6 mb-0">{{ summary.lot_count }}</p>
          </div>
        </div>
        <div class="col-sm-6 col-md-4 col-lg-3">
          <div class="card custom-card text-center h-100 shadow-sm">
            <h5 class="fw-semibold">Total Revenue</h5>
            <p class="display-6 mb-0">₹{{ summary.total_revenue.toFixed(2) }}</p>
          </div>
        </div>
      </div>
      <div class="row g-4 mt-4">
        <div class="col-12 col-lg-6">
          <div class="card shadow-sm p-4 h-100">
            <h5 class="mb-3 text-center fw-semibold">Available vs Occupied Spots per Lot</h5>
            <div style="position: relative; width: 100%; height: 300px;">
              <canvas ref="spotChartCanvas"></canvas>
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-6">
          <div class="card shadow-sm p-4 h-100">
            <h5 class="mb-3 text-center fw-semibold">Revenue per Parking Lot</h5>
            <div style="position: relative; width: 100%; height: 300px;">
              <canvas ref="revenueChartCanvas"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>`
    ,
  data() {
    return {
      summary: {
        user_count: 0,
        lot_count: 0,
        total_revenue: 0,
        lots: []
      },
      spotChart: null,
      revenueChart: null
    };
  },

  async mounted() {
    try {
      const res = await fetch('/api/admin_summary', {
        headers: {
          'Authentication-Token': localStorage.getItem('auth_token')
        }
      });
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      this.summary = data;
      this.$nextTick(() => {
        this.renderSpotChart();
        this.renderRevenueChart();
      });
    } catch (err) {
      console.error(err);
      this.$router.push('/login');
    }
  },

  methods: {
    renderSpotChart() {
      if (this.spotChart) this.spotChart.destroy();
      const ctx = this.$refs.spotChartCanvas.getContext('2d');
      this.spotChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.summary.lots.map(lot => lot.name),
          datasets: [
            {
              label: 'Available',
              data: this.summary.lots.map(lot => lot.available),
              backgroundColor: 'rgba(110, 80, 219, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            },
            {
              label: 'Occupied',
              data: this.summary.lots.map(lot => lot.occupied),
              backgroundColor: 'rgba(255, 99, 132, 0.6)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1
            }
          ]
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              stacked: true,
              title: {
                display: true,
                text: 'Parking Lots'
              }
            },
            y: {
              stacked: true,
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Spots'
              },
              ticks: {
                precision: 0
              }
            }
          },
          plugins: {
            legend: { position: 'top' },
            tooltip: { mode: 'index', intersect: false }
          }
        }
      });
    },

    renderRevenueChart() {
      if (this.revenueChart) this.revenueChart.destroy();
      const ctx = this.$refs.revenueChartCanvas.getContext('2d');
      this.revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.summary.lots.map(lot => lot.name),
          datasets: [
            {
              label: 'Revenue (₹)',
              data: this.summary.lots.map(lot => lot.revenue),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }
          ]
        },
        
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Revenue (₹)'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Parking Lots'
              }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: { mode: 'index', intersect: false }
          }
        }
      });
    }
  },
  beforeDestroy() {
    if (this.spotChart) this.spotChart.destroy();
    if (this.revenueChart) this.revenueChart.destroy();
  }
};
