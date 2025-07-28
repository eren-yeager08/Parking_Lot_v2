export default {
  template: `
  <div class="position-relative min-vh-100 d-flex flex-column" style="background-color: #06262eff;">
    
    <div class="container text-center mt-4 position-relative" style="z-index: 1;">
      <h2 class="text-center mb-4 text-white fw-semibold text-uppercase" style="letter-spacing: 1px;">
        My Parking Lots 
      </h2>
      <div v-if="flash" :class="flashClass" class="alert alert-dismissible fade show" role="alert">
        {{ flash }}
        <button class="btn-close" @click="flash = null"></button>
      </div>
      <div v-if="lots.length" class="row">
        <div class="col-md-4 mb-4" v-for="(lot, idx) in lots" :key="lot.id">
          <div class="card h-100 shadow-lg rounded" style="background-color: #e0efecff;">
            <div class="bg-primary text-white py-2 rounded-top">
              <h5 class="mb-0">Parking #{{ idx + 1 }}</h5>
            </div>
            <div class="card-body">
              <h6 class="mb-2 text-decoration-underline text-dark">
                {{ lot.prime_location_name }}
              </h6>
              <p class="text-muted mb-3">Occupied: {{ lot.occupied_count }} / {{ lot.total_spots }}</p>
              <div class="d-flex flex-wrap justify-content-center gap-2 mt-3">
                <button
                  v-for="spot in lot.spots"
                  :key="spot.id"
                  v-if="spot.status === 'A'"
                  class="btn btn-sm btn-success fw-bold"
                  @click="handleSpotClick(spot)"
                  title="Available"> A 
                </button>
                <span
                  v-else
                  :key="spot.id"
                  class="btn btn-sm btn-danger fw-bold"
                  @click="handleSpotClick(spot)"
                  title="Occupied" style="cursor: pointer;"> O 
                </span>
              </div>
              <div class="mt-4 d-flex justify-content-center gap-2">
                <button class="btn btn-secondary btn-sm" @click="editLot(lot.id)">Edit</button>
                <button class="btn btn-danger btn-sm" @click="deleteLot(lot)">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <h4 v-else class="text-white fw-semibold mt-5">No parking lots available.</h4>
      <div class="d-flex justify-content-center mt-2 row border mb-4" style="background-color: #e0efecff; border-radius: 0.5rem;">
        <button class="btn fw-bold text-dark" @click="$router.push('/add_lot')">
          + Add Parking Lot
        </button>
      </div>
    </div>

      <div class="modal fade custom-modal" ref="spotModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Spot Details</h5>
              <button type="button" class="btn-close" @click="closeSpotModal"></button>
            </div>
            <div class="modal-body" v-if="selectedSpot">
              <p><strong>Spot ID:</strong> {{ selectedSpot.id }}</p>
              <p><strong>Status:</strong> Available</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-danger" @click="deleteSpot(selectedSpot.id)">Delete</button>
              <button class="btn btn-secondary" @click="closeSpotModal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal fade custom-modal" ref="occupiedModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Occupied Spot Details</h5>
              <button type="button" class="btn-close" @click="closeOccupiedModal"></button>
            </div>
            <div class="modal-body" v-if="occupiedInfo">
              <p><strong>Reservation ID:</strong> {{ occupiedInfo.id }}</p>
              <p><strong>User ID:</strong> {{ occupiedInfo.user_id }}</p>
              <p><strong>Vehicle Number :</strong> {{ occupiedInfo.vehicle_number }}</p>
              <p><strong>Parking Time:</strong> {{ formatDT(occupiedInfo.parking_time) }}</p>
              <p><strong>Estimated Cost:</strong> ₹{{ occupiedInfo.estimated_cost }}</p>
            </div>
          </div>
        </div>
      </div>
  </div> `
  ,
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
        this.$router.go(0);
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

    handleSpotClick(spot) {
      if (spot.status === 'A') {
        this.openSpotModal(spot);
      } else {
        this.fetchOccupiedInfo(spot.id);
      }
    },

    openSpotModal(spot) {
      this.selectedSpot = spot;
      if (!this.spotModal)
        this.spotModal = new bootstrap.Modal(this.$refs.spotModal);
      this.spotModal.show();
    },

    closeSpotModal() {
      if (this.spotModal) this.spotModal.hide();
      this.selectedSpot = null;
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
      document.body.classList.remove('modal-open');
    },

    async fetchOccupiedInfo(spotId) {
      const res = await fetch(`/api/spot_info/${spotId}`, this.req());
      if (!res.ok) return this.flashNow('Failed to load info', true);
      this.occupiedInfo = await res.json();
      if (!this.occupiedModal)
        this.occupiedModal = new bootstrap.Modal(this.$refs.occupiedModal);
      this.occupiedModal.show();
    },

    closeOccupiedModal() {
      if (this.occupiedModal) {
        this.occupiedModal.hide();
      }
      this.occupiedInfo = null;
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    },
    
    editLot(id) { this.$router.push(`/edit_lot/${id}`); }
  }
};
