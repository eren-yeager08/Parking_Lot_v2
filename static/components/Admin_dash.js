export default {
  template: `
  <div class="container mt-4">
    <h2 class="mb-4">Parking Lots</h2>

    <!-- flash alert -->
    <div v-if="flashMessage"
         class="alert alert-success alert-dismissible fade show"
         role="alert">
      {{ flashMessage }}
      <button type="button" class="btn-close" @click="flashMessage = null"></button>
    </div>

    <!-- ====== LOT CARDS ====== -->
    <div v-if="lots && lots.length">
      <div class="row">
        <div class="col-md-4 mb-3" v-for="(lot, index) in lots" :key="lot.id">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Parking #{{ index + 1 }}</h5>
              <h6><span>{{ lot.prime_location_name }}</span></h6>

              <p>
                Occupied: {{ lot.occupied_count }} /
                {{ lot.total_spots }}
              </p>

              <!-- spot buttons -->
              <div v-if="lot.spots && lot.spots.length"
                   class="row row-cols-auto g-2 mt-2">
                <button
                  v-for="spot in lot.spots"
                  :key="spot.id"
                  @click="handleSpotClick(spot)"
                  class="btn btn-sm fw-bold px-2 py-1 m-1"
                  :class="spot.status === 'A' ? 'btn-success' : 'btn-danger'"
                  :title="spot.status === 'A' ? 'Available' : 'Occupied'">
                  {{ spot.status }}
                </button>
              </div>

              <!-- lot actions -->
              <div class="mt-3">
                <button @click="editLot(lot.id)"
                        class="btn btn-secondary btn-sm">Edit</button>
                <button @click="deleteLot(lot.id)"
                        class="btn btn-danger btn-sm">Delete</button>
              </div>

              <div v-if="lot.warning"
                   class="alert alert-warning mt-3"
                   role="alert">
                {{ lot.warning }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- empty state -->
    <div v-else>
      <h4 class="text-center">No parking lots available at the moment.</h4>
    </div>

    <!-- add‑lot button -->
    <div class="text-center mt-4">
      <button @click="goToAddLot" class="btn btn-info">Add Parking Lot</button>
    </div>

    <!-- modal for Available spot -->
    <div class="modal fade" ref="spotModal" tabindex="-1" aria-hidden="true">
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
            <button class="btn btn-danger"
                    @click="deleteSpot(selectedSpot.id)">Delete</button>
            <button class="btn btn-secondary"
                    @click="closeSpotModal">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,

  /* ========== DATA ========== */
  data() {
    return {
      lots: null,
      selectedSpot: null,
      modalInstance: null,
      flashMessage: null,   // NEW
      flashTimer: null      // NEW
    };
  },

  mounted() {
    this.loadLots();
  },

  /* ========== METHODS ========== */
  methods: {
    /* flash helper */
    showFlash(msg) {
      clearTimeout(this.flashTimer);
      this.flashMessage = msg;
      this.flashTimer = setTimeout(() => (this.flashMessage = null), 3000);
    },

    /* API */
    loadLots() {
      fetch('/api/lots', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('auth_token')
        }
      })
        .then(res => res.json())
        .then(data => {
          this.lots = data.map(lot => {
            const totalSpots = (lot.spots || []).length;
            const occupied = (lot.spots || []).filter(s => s.status === 'O').length;
            return { ...lot, occupied_count: occupied, total_spots: totalSpots };
          });
        })
        .catch(console.error);
    },

    deleteLot(lotId) {
      if (confirm('Are you sure you want to delete this lot?')) {
        fetch(`/api/lots/${lotId}`, {
          method: 'DELETE',
          headers: { 'Authentication-Token': localStorage.getItem('auth_token') }
        })
          .then(res => res.json())
          .then(() => {
            this.showFlash('Lot deleted successfully');
            this.loadLots();
            this.$router.go(0) 
          });
      }
    },

    deleteSpot(spotId) {
      if (confirm('Delete this spot?')) {
        fetch(`/api/spots/${spotId}`, {
          method: 'DELETE',
          headers: { 'Authentication-Token': localStorage.getItem('auth_token') }
        })
          .then(res => res.json())
          .then(() => {
            this.closeSpotModal();
            this.showFlash('Spot deleted successfully');
            this.loadLots();
          });
      }
    },

    /* navigation */
    viewSpot(id) { this.$router.push(`/view_spot/${id}`); },
    editLot(id)  { this.$router.push(`/edit_lot/${id}`); },
    goToAddLot() { this.$router.push('/add_lot'); },

    /* spot‑button logic */
    handleSpotClick(spot) {
      spot.status === 'A' ? this.openSpotModal(spot) : this.viewSpot(spot.id);
    },

    openSpotModal(spot) {
      this.selectedSpot = spot;
      if (!this.modalInstance)
        this.modalInstance = new bootstrap.Modal(this.$refs.spotModal);
      this.modalInstance.show();
    },

    closeSpotModal() {
      if (this.modalInstance) {
        if (document.activeElement) document.activeElement.blur();
        this.modalInstance.hide();
      }
      this.selectedSpot = null;
    }
  }
};
