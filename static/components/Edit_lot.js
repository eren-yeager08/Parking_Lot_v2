export default {
  template: `
  <div class="container-fluid px-4 py-4" style="background-color: #06262eff; min-height: 100vh;">
    <div class="container position-relative" style="z-index: 1; max-width: 520px;">
      <h2 class="text-center mb-4 text-white fw-semibold " style="letter-spacing: 1px;">
          Edit Parking Lot  
      </h2>
      <div v-if="loading" class="text-center">
        <div class="spinner-border text-light" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-else class="card shadow-lg rounded" style="background-color: rgba(197, 217, 219, 0.93);">
        <div class="card-body p-4">
          <div class="mb-3">
            <label class="form-label fw-semibold">Location Name</label>
            <input v-model="lot.prime_location_name" type="text" class="form-control" placeholder="e.g., MG Road" />
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold">Address</label>
            <input v-model="lot.address" type="text" class="form-control" placeholder="Street, Area, City" />
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold">Pincode</label>
            <input v-model="lot.pincode" type="text" class="form-control" placeholder="e.g., 560001" />
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold">Price Per Hour</label>
            <input v-model.number="lot.price_per_hour" type="number" min="0" class="form-control" placeholder="₹ per hour" />
          </div>
          <div class="mb-4">
            <label class="form-label fw-semibold">Max Number of Spots</label>
            <input v-model.number="lot.maximum_number_of_spots" type="number" min="1" class="form-control" placeholder="e.g., 25" />
          </div>
          <div class="d-flex justify-content-between">
            <button @click="updateLot" class="btn btn-primary fw-semibold">Save</button>
            <button @click="$router.push('/admin_dash')" class="btn btn-secondary fw-semibold">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>`
  ,
    data() {
        return {
        lot: {
            prime_location_name: '',
            address: '',
            pincode: '',
            price_per_hour: null,
            maximum_number_of_spots: null
        },
        loading: true
        };
    },
    mounted() {
        this.fetchLot();
    },

    methods: {
    fetchLot() {
        const id = this.$route.params.id;
        console.log('Token:', localStorage.getItem('auth_token'));
        fetch(`/api/lots/${id}`, {
            method: 'GET',
            headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': localStorage.getItem('auth_token')
            }
        })
        .then(res => res.json())
        .then(data => {
            this.lot = {
            id: data.id,
            prime_location_name: data.prime_location_name,
            address: data.address,
            pincode: data.pincode,
            price_per_hour: data.price_per_hour,
            maximum_number_of_spots: data.maximum_number_of_spots
        };
        this.loading = false;
        })
        .catch(() => {
        alert("Failed to load parking lot");
        this.loading = false;
        });
    },

    updateLot() {
        const id = this.$route.params.id;
        fetch(`/api/lots/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': localStorage.getItem('auth_token')
        },
        body: JSON.stringify(this.lot)
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message || "Updated successfully!");
            this.$router.push('/admin_dash');
        })
        .catch(() => {
            alert("Update failed.");
        });
        }
    }
}
