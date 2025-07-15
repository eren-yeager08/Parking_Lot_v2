export default {
  template: `
    <div class="container mt-5">
      <h3>User Parking Lot Frequency</h3>
      <canvas id="userChart" height="100"></canvas>
    </div>
  `,

  data() {
    return {
      chart: null,
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
          }]
        },
        options: {
        responsive: true,
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
            stepSize: 1,        // Step size fixed to 1 (no decimals)
            ticks: {
                callback: function(value) {
                if (Number.isInteger(value)) {
                    return value;  // show label only if integer
                }
                return '';       // hide decimal ticks
                }
            }
            }
        }
        }
      });
    }
  }
};
