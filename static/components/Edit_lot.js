export default {
  template: `
    <div class="container mt-4">
      <h2 class="mb-4">Edit Parking Lot</h2>

      <div v-if="loading" class="text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else class="card p-4 mx-auto" style="max-width: 500px;">
        <div class="mb-3">
          <label class="form-label">Location Name</label>
          <input v-model="lot.prime_location_name" type="text" class="form-control" />
        </div>

        <div class="mb-3">
          <label class="form-label">Address</label>
          <input v-model="lot.address" type="text" class="form-control" />
        </div>

        <div class="mb-3">
          <label class="form-label">Pincode</label>
          <input v-model="lot.pincode" type="text" class="form-control" />
        </div>

        <div class="mb-3">
          <label class="form-label">Price Per Hour</label>
          <input v-model.number="lot.price_per_hour" type="number" class="form-control" />
        </div>

        <div class="mb-3">
          <label class="form-label">Max Number of Spots</label>
          <input v-model.number="lot.maximum_number_of_spots" type="number" class="form-control" />
        </div>

        <div class="d-flex justify-content-between">
          <button @click="updateLot" class="btn btn-primary">Save</button>
          <button @click="$router.push('/admin_dash')" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  `,

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
