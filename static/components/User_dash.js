export default {
  template: `
    <div class="container mt-4">

      <div v-if="flash" class="alert alert-success alert-dismissible fade show" role="alert">
        {{ flash }}
        <button type="button" class="btn-close" @click="flash = null"></button>
      </div>

      <!-- LOT LIST (top half) -->
        <h4 class="text-center bg-info text-white py-2 rounded-3">
            Available Parking Lots
        </h4>

        <div class="table-responsive" style="max-height: 45vh; overflow-x: auto;">
            <table class="table table-striped align-middle">
                <thead class="table-dark">
                    <tr>
                        <th>Lot ID</th>
                        <th>Address</th>
                        <th>Availability</th>
                        <th style="min-width: 120px;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="lot in lots" :key="lot.id">
                        <td>{{ lot.id }}</td>
                        <td>{{ lot.address }}</td>
                        <td>{{ lot.available }}/{{ lot.total }}</td>
                        <td>
                        <button
                            class="btn btn-sm btn-primary"
                            :disabled="lot.available === 0"
                            @click="openBookingForm(lot)"
                        >
                            Book
                        </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

      <!-- RESERVATION HISTORY (bottom half) -->
      <h4 class="text-center bg-purple text-white py-2 rounded-3">My Parking History</h4>
        <div class="table-responsive" style="max-height: 40vh; overflow-x: auto;">
        <table class="table table-striped align-middle">
            <thead class="table-dark">
            <tr>
                <th>#</th>
                <th>Address</th>
                <th>Vehicle #</th>
                <th>Park In</th>
                <th>Park Out</th>
                <th style="min-width: 120px;">Action</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="r in sortedReservations" :key="r.id">
                <td>{{ r.id }}</td>
                <td>{{ r.lot_address }}</td>
                <td>{{ r.vehicle_number }}</td>
                <td>{{ formatDT(r.parking_time) }}</td>
                <td>{{ r.leaving_time ? formatDT(r.leaving_time) : '—' }}</td>
                <td>
                <button
                    v-if="!r.leaving_time"
                    class="btn btn-sm btn-danger"
                    @click="openReleaseForm(r)"
                >
                    Release
                </button>
                <span
                    v-else
                    class="btn btn-sm btn-warning fw-bold border"
                    style="pointer-events:none; cursor:default;"
                >
                    Parked Out
                </span>
                </td>
            </tr>
            </tbody>
        </table>
        </div>

        <!-- Booking Modal -->
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
                        <label class="form-label">Lot ID</label>
                        <input type="text" :value="bookingData.lot_id" class="form-control" readonly>
                    </div>
                    <div class="mb-2">
                        <label class="form-label">Spot ID</label>
                        <input type="text" :value="bookingData.spot_id" class="form-control" readonly>
                    </div>
                    <div class="mb-2">
                        <label class="form-label">User ID</label>
                        <input type="text" :value="bookingData.user_id" class="form-control" readonly>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Vehicle Number</label>
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


      <!-- Release Modal -->
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
              <p><strong>Total Cost:</strong> ₹{{ releaseData.total_cost ?? 'Calculating...' }}</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-danger" @click="confirmRelease">Release</button>
              <button class="btn btn-secondary" @click="closeReleaseForm">Cancel</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,

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
        // Active (no leaving_time) first, then parked‑out
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
      return new Date(dt).toLocaleString();
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
        first_available_spot: lot.spots.find(s => s.status === 'A')?.id || null  // 👈
    }));
    },

    async loadReservations() {
      const res = await fetch('/api/my_reservations', this.req());
      if (!res.ok) return;
      const data = await res.json();

      // Expecting each reservation includes lot_address, spot_id, etc.
      this.reservations = data;
    },

    /* Booking modal */
    async openBookingForm(lot) {
        this.bookingLot     = lot;
        this.bookingVehicle = '';

        /* 👇 Build the reactive object that the template expects */
        this.bookingData = {
            lot_id:  lot.id,
            spot_id: lot.first_available_spot,   // may be null (backend will pick)
            user_id: null,                       // we’ll fetch next
            vehicle_number: ''
        };

        /* Fetch current user once to fill user_id (or cache it) */
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
        spot_id:  this.bookingData.spot_id,        // optional; backend can choose
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


    /* Release modal */
    openReleaseForm(reservation) {
      this.releaseData = { ...reservation };
      if (!this.releaseModalInstance) {
        this.releaseModalInstance = new bootstrap.Modal(this.$refs.releaseModal);
      }
      this.releaseModalInstance.show();
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
    }
  }
};
