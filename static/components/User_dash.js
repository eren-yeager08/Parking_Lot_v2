export default {
  template: `
    <div class="container-fluid px-4 py-4" style="background-color: #06262eff; min-height: 100vh;">
      <div v-if="flash" class="alert alert-success alert-dismissible fade show" role="alert">
        {{ flash }}
        <button type="button" class="btn-close" @click="flash = null"></button>
      </div>

      <div class="text-end">
        <button class="btn btn-sm fw-bold d-inline-flex align-items-center gap-1 mb-2"
                @click="exportMyCSV"
                style="background-color: #e9f3f3ff; color: #000;">
          <i class="bi bi-download"></i>
          Export My Reservations
        </button>
      </div>
      <h3 class="text-center text-white fw-semibold" style="letter-spacing: 1px;">
        Available Parking Lots 
      </h3>
      <div class="table-responsive mt-3" style="max-height: 45vh; overflow-x: auto;">
        <div class="overflow-hidden rounded-3 shadow-sm"> 
          <table class="table table-striped align-middle mb-3">
            <thead>
              <tr>
                <th style="background-color: #007e7e; color: white;">Lot ID</th>
                <th style="background-color: #007e7e; color: white;">Address</th>
                <th style="background-color: #007e7e; color: white;">Availability</th>
                <th style="background-color: #007e7e; color: white; min-width: 120px;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="lot in lots" :key="lot.id">
                <td>{{ lot.id }}</td>
                <td>{{ lot.address }}</td>
                <td>{{ lot.available }}/{{ lot.total }}</td>
                <td>
                  <button class="btn btn-sm text-white fw-bold" style="background-color: #007e7e;" :disabled="lot.available === 0" @click="openBookingForm(lot)">
                    Book Now
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <h3 class="text-center mb-3 text-white fw-semibold" style="letter-spacing: 1px;">
        My parking History 
      </h3>
      <div class="table-responsive mt-3" style="max-height: 40vh; overflow-x: auto;">
        <div class="overflow-hidden rounded-3 shadow-sm">
          <table class="table table-striped align-middle mb-0">
            <thead>
              <tr>
                <th style="background-color: #007e7e; color: white;">Reservation ID</th>
                <th style="background-color: #007e7e; color: white;">Address</th>
                <th style="background-color: #007e7e; color: white;">Vehicle Number</th>
                <th style="background-color: #007e7e; color: white;">Parking Time</th>
                <th style="background-color: #007e7e; color: white;">Leaving Time</th>
                <th style="background-color: #007e7e; color: white; min-width: 120px;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in sortedReservations" :key="r.id">
                <td>{{ r.id }}</td>
                <td>{{ r.address }}</td>
                <td>{{ r.vehicle_number }}</td>
                <td>{{ formatDT(r.parking_time) }}</td>
                <td>{{ r.leaving_time ? formatDT(r.leaving_time) : '—' }}</td>
                <td>
                  <button v-if="!r.leaving_time" class="btn btn-sm text-white fw-bold" style="background-color: #c00b39ff;" @click="openReleaseForm(r)">
                    Occupied
                  </button>
                  <span v-else class="btn btn-sm fw-bold text-white" style="background-color: #6e250f8e; pointer-events: none; cursor: default;">
                    Released
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="modal fade" ref="bookingModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Book Parking Spot</h5>
              <button type="button" class="btn-close" @click="closeBookingForm"></button>
            </div>
            <div class="modal-body" v-if="bookingData">
              <form @submit.prevent="submitBooking">
                <div class="mb-2">
                  <label class="form-label">Lot ID</label>
                  <input type="text" :value="bookingData.lot_id" class="form-control" readonly>
                </div>
                <div class="mb-2">
                  <label class="form-label">Spot ID</label>
                  <input type="text" :value="bookingData.spot_id" class="form-control" readonly>
                </div>
                <div class="mb-2">
                  <label class="form-label">User ID</label>
                  <input type="text" :value="bookingData.user_id" class="form-control" readonly>
                </div>
                <div class="mb-3">
                  <label class="form-label">Cost per Hour(₹)</label>
                  <input type="text" :value="bookingData.price_per_hour" class="form-control" readonly>
                </div>
                <div class="mb-3">
                  <label class="form-label">Vehicle Number</label>
                  <input v-model="bookingData.vehicle_number"
                    type="text"
                    class="form-control"
                    placeholder="Enter vehicle number"
                    required>
                </div>
                <button class="btn btn-primary" type="submit">Confirm Booking</button>
                <button class="btn btn-secondary ms-2" type="button" @click="closeBookingForm">
                  Cancel
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div class="modal fade" ref="releaseModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Release Parking Spot</h5>
              <button type="button" class="btn-close" @click="closeReleaseForm"></button>
            </div>
            <div class="modal-body" v-if="releaseData">
              <p><strong>Spot ID:</strong> {{ releaseData.spot_id }}</p>
              <p><strong>Vehicle Number:</strong> {{ releaseData.vehicle_number }}</p>
              <p><strong>Park In:</strong> {{ formatDT(releaseData.parking_time) }}</p>
              <p><strong>Park Out:</strong> {{ formatDT(releaseData.leaving_time || new Date()) }}</p>
              <p><strong>Total Duration:</strong> {{ releaseData.duration_text }} </p>
              <p><strong>Total Cost:</strong> ₹{{ releaseData.total_cost || 'Calculating...' }}</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-danger" @click="confirmRelease">Release</button>
              <button class="btn btn-secondary" @click="closeReleaseForm">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>`
    ,

  data() {
    return {
      lots: [],
      reservations: [],
      flash: null,
      bookingLot: null,
      bookingVehicle: '',
      bookingData: null, 
      bookingModalInstance: null,
      releaseData: null,
      releaseModalInstance: null,
    };
  },
  computed: {
    sortedReservations() {
        return this.reservations.slice().sort((a, b) => {
        if (!a.leaving_time && b.leaving_time) return -1;
        if (a.leaving_time && !b.leaving_time) return 1;
        return 0;
        });
    }
    },
  mounted() {
    this.loadLots();
    this.loadReservations();
  },
  methods: {
    req(method = 'GET') {
      return {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('auth_token')
        }
      };
    },

    formatDT(dt) {
    return new Date(dt).toLocaleString('en-IN', {
      day:    '2-digit',   
      month:  'short',     
      year:   'numeric',   
      hour:   'numeric',  
      minute: '2-digit',   
      second: '2-digit',   
      hour12: true        
    });
  },

    async loadLots() {
    const res = await fetch('/api/lots', this.req());
    if (!res.ok) return;
    const data = await res.json();
    this.lots = data.map(lot => ({
        id: lot.id,
        address: lot.address,
        total: lot.spots.length,
        available: lot.spots.filter(s => s.status === 'A').length,
        first_available_spot: lot.spots.find(s => s.status === 'A')?.id || null , 
        price_per_hour: lot.price_per_hour 
    }));
    },

    async loadReservations() {
      const res = await fetch('/api/my_reservations', this.req());
      if (!res.ok) return;
      const data = await res.json();
      this.reservations = data;
    },

    async openBookingForm(lot) {
        console.log("Lot info:", lot);
        this.bookingLot     = lot;
        this.bookingVehicle = '';
        this.bookingData = {
            lot_id:  lot.id,
            spot_id: lot.first_available_spot,   
            user_id: null,                       
            vehicle_number: '',
            price_per_hour: lot.price_per_hour 
        };

        if (!this.user) {
            const me = await fetch('/api/me', this.req()).then(r => r.ok ? r.json() : null);
            if (me) this.user = me;
        }
        this.bookingData.user_id = this.user?.id || '—';
        if (!this.bookingModalInstance)
            this.bookingModalInstance = new bootstrap.Modal(this.$refs.bookingModal);
        this.bookingModalInstance.show();
        },

    closeBookingForm() {
      document.activeElement.blur();
      if (this.bookingModalInstance) this.bookingModalInstance.hide();
      this.bookingLot = null;
      this.bookingVehicle = '';
    },

    async submitBooking() {
    if (!this.bookingData.vehicle_number)
        return alert('Please enter vehicle number');
    const payload = {
        lot_id:   this.bookingData.lot_id,
        spot_id:  this.bookingData.spot_id,        
        vehicle_number: this.bookingData.vehicle_number
    };

    const res = await fetch('/api/reservations', {
        ...this.req('POST'),
        body: JSON.stringify(payload)
    });
    if (res.ok) {
        this.flashNow('Spot booked successfully');
        this.closeBookingForm();
        await this.refresh();
    } else {
        alert('Booking failed');
    }
    },

    async openReleaseForm(reservation) {
      const start = new Date(reservation.parking_time);
      const end = reservation.leaving_time
        ? new Date(reservation.leaving_time)
        : new Date();
      const diffMs = end - start;
      const mins = Math.floor(diffMs / 60000);
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      const duration_text =
        hours === 0 && minutes === 0
          ? 'Less than a minute'
          : `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`;
      this.releaseData = {
        ...reservation,
        total_cost: 'Calculating…',
        duration_text, 
      };
      if (!this.releaseModalInstance) {
        this.releaseModalInstance = new bootstrap.Modal(this.$refs.releaseModal);
      }
      this.releaseModalInstance.show();
      try {
        const res = await fetch(`/api/reservations/${reservation.id}/cost_now`, this.req());
        if (res.ok) {
          const { total_cost } = await res.json();
          this.releaseData.total_cost = total_cost;
        } else {
          this.releaseData.total_cost = '—';
        }
      } catch (_) {
        this.releaseData.total_cost = '—';
      }
    },

    closeReleaseForm() {
      document.activeElement.blur();
      if (this.releaseModalInstance) this.releaseModalInstance.hide();
      this.releaseData = null;
    },

    async confirmRelease() {
      if (!this.releaseData) return;
      const res = await fetch(`/api/reservations/${this.releaseData.id}`, this.req('DELETE'));
      if (res.ok) {
        this.flashNow('Spot released');
        this.closeReleaseForm();
        await this.refresh();
      } else {
        alert('Release failed');
      }
    },

    flashNow(msg) {
      this.flash = msg;
      setTimeout(() => (this.flash = null), 3000);
    },

    async refresh() {
      await Promise.all([this.loadLots(), this.loadReservations()]);
    },
    async exportMyCSV() {
        try {
            const res = await fetch('/api/user/export', this.req('GET'));
            if (!res.ok) {
                const errorData = await res.json();
                return alert(errorData.message || 'Export failed');
            }

            const data = await res.json();
            if (data.id) {
                setTimeout(() => {
                    window.location.href = `/api/csv_result/${data.id}`;
                    alert('✅ CSV downloaded successfully!');
                }, 1000);
            } else {
                alert('Export failed: No task ID received');
            }
        } catch (error) {
            console.error("Export failed:", error);
            alert('Export failed. Please try again later.');
        }
    }
  }
};
