export default {
  template: `
  <div class="container mt-4">
    <h2 class="mb-4">Parking Lots</h2>

    <!-- flash -->
    <div v-if="flash" :class="flashClass" class="alert alert-dismissible fade show" role="alert">
      {{ flash }}
      <button class="btn-close" @click="flash = null"></button>
    </div>

    <!-- PARKING LOT CARDS -->
    <div v-if="lots.length" class="row">
      <div class="col-md-4 mb-3" v-for="(lot, idx) in lots" :key="lot.id">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">Parking #{{ idx + 1 }}</h5>
            <h6>{{ lot.prime_location_name }}</h6>
            <p>Occupied: {{ lot.occupied_count }} / {{ lot.total_spots }}</p>

            <!-- spots -->
            <div class="row row-cols-auto g-2 mt-2">
              <div class="row row-cols-auto g-2">
                <button
                  v-for="spot in lot.spots"
                  :key="spot.id"
                  v-if="spot.status === 'A'"
                  class="btn btn-sm btn-success fw-bold px-2 py-1 m-1"
                  @click="handleSpotClick(spot)"
                  title="Available"
                >
                  A
                </button>

                <span
                  v-else
                  :key="spot.id"
                  class="btn btn-sm btn-danger fw-bold px-2 py-1 m-1"
                  style="cursor:pointer"
                  @click="handleSpotClick(spot)"
                  title="Occupied"
                >
                  O
                </span>
              </div>
            </div>

            <!-- lot actions -->
            <div class="mt-3">
              <button class="btn btn-secondary btn-sm" @click="editLot(lot.id)">Edit</button>
              <button class="btn btn-danger btn-sm" @click="deleteLot(lot)">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- no lots -->
    <h4 v-else class="text-center">No parking lots available.</h4>

    <!-- add lot -->
    <div class="text-center mt-4">
      <button class="btn btn-info" @click="$router.push('/add_lot')">Add Parking Lot</button>
    </div>

    <!-- MODAL: Available spot -->
    <div class="modal fade" ref="spotModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Spot Details</h5>
            <button type="button" class="btn-close" @click="closeSpotModal"></button>
          </div>
          <div class="modal-body" v-if="selectedSpot">
            <p><strong>Spot ID:</strong> {{ selectedSpot.id }}</p>
            <p><strong>Status:</strong> Available</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-danger" @click="deleteSpot(selectedSpot.id)">Delete</button>
            <button class="btn btn-secondary" @click="closeSpotModal">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Occupied spot details -->
    <div class="modal fade" ref="occupiedModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Occupied Spot Details</h5>
            <button type="button" class="btn-close" @click="closeOccupiedModal"></button>
          </div>
          <div class="modal-body" v-if="occupiedInfo">
            <p><strong>Reservation ID:</strong> {{ occupiedInfo.id }}</p>
            <p><strong>User ID:</strong> {{ occupiedInfo.user_id }}</p>
            <p><strong>Vehicle #:</strong> {{ occupiedInfo.vehicle_number }}</p>
            <p><strong>Park In:</strong> {{ formatDT(occupiedInfo.parking_time) }}</p>
            <p><strong>Estimated Cost:</strong> ₹{{ occupiedInfo.estimated_cost }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,

  data() {
    return {
      lots: [],
      flash: null,
      flashClass: 'alert-success',
      spotModal: null,
      occupiedModal: null,
      selectedSpot: null,
      occupiedInfo: null
    };
  },

  mounted() {
    this.loadLots();
  },

  methods: {
    /* ---------- helpers ---------- */
    req(method = 'GET') {
      return {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('auth_token')
        }
      };
    },
    formatDT(dt) { return new Date(dt).toLocaleString(); },
    flashNow(msg, isError = false) {
      this.flashClass = isError ? 'alert-danger' : 'alert-success';
      this.flash = msg;
      setTimeout(() => (this.flash = null), 3000);
    },

    /* ---------- API calls ---------- */
    async loadLots() {
      const res = await fetch('/api/lots', this.req());
      if (!res.ok) return;
      const data = await res.json();
      this.lots = data.map(l => ({
        ...l,
        occupied_count: l.spots.filter(s => s.status === 'O').length,
        total_spots: l.spots.length
      }));
    },

    async deleteLot(lot) {
      if (lot.occupied_count > 0) {
        this.flashNow('Cannot delete — one or more spots are occupied', true);
        return;
      }
      if (!confirm('Delete this lot?')) return;
      const res = await fetch(`/api/lots/${lot.id}`, this.req('DELETE'));
      const json = await res.json();
      if (!res.ok) {
        this.flashNow(json.message || 'Delete failed', true);
      } else {
        this.flashNow('Lot deleted');
        this.loadLots();
      }
    },

    async deleteSpot(id) {
      if (!confirm('Delete this spot?')) return;
      const res = await fetch(`/api/spots/${id}`, this.req('DELETE'));
      if (res.ok) {
        this.flashNow('Spot deleted');
        this.closeSpotModal();
        this.loadLots();
      }
    },

    /* ---------- spot click ---------- */
    handleSpotClick(spot) {
      if (spot.status === 'A') {
        this.openSpotModal(spot);
      } else {
        this.fetchOccupiedInfo(spot.id);
      }
    },

    /* available spot modal */
    openSpotModal(spot) {
      this.selectedSpot = spot;
      if (!this.spotModal)
        this.spotModal = new bootstrap.Modal(this.$refs.spotModal);
      this.spotModal.show();
    },
    closeSpotModal() {
      if (this.spotModal) this.spotModal.hide();
      this.selectedSpot = null;
    },

    /* occupied spot modal */
    async fetchOccupiedInfo(spotId) {
      const res = await fetch(`/api/spot_info/${spotId}`, this.req());
      if (!res.ok) return this.flashNow('Failed to load info', true);
      this.occupiedInfo = await res.json();
      if (!this.occupiedModal)
        this.occupiedModal = new bootstrap.Modal(this.$refs.occupiedModal);
      this.occupiedModal.show();
    },
    closeOccupiedModal() {
      if (this.occupiedModal) this.occupiedModal.hide();
      this.occupiedInfo = null;
    },

    /* ---------- nav ---------- */
    editLot(id) { this.$router.push(`/edit_lot/${id}`); }
  }
};
