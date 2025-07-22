export default {
    template: `
    <div class="container-fluid px-4 py-4" style="background-color: #06262eff; min-height: 100vh;">
      <div class="container position-relative" style="z-index: 1; max-width: 520px;">
        <h2 class="text-center mb-4 text-white fw-semibold " style="letter-spacing: 1px;">
          Add Parking Lot  
        </h2>
        <div class="card shadow-lg rounded" style="background-color: rgba(197, 219, 201, 0.93);">
          <div class="card-body p-4">
            <div class="mb-3">
              <label class="form-label fw-semibold">Location Name</label>
              <input v-model="lot.prime_location_name" type="text" class="form-control" placeholder="e.g., MG Road" />
            </div>
            <div class="mb-3">
              <label class="form-label fw-semibold">Address</label>
              <textarea v-model="lot.address" class="form-control" placeholder="e.g., Near Metro Station, Bangalore"></textarea>
            </div>
            <div class="mb-3">
              <label class="form-label fw-semibold">Pincode</label>
              <input v-model="lot.pincode" type="text" class="form-control" placeholder="e.g., 560001" />
            </div>
            <div class="mb-3">
              <label class="form-label fw-semibold">Price per Hour</label>
              <input v-model.number="lot.price_per_hour" type="number" class="form-control" min="0" placeholder="₹ per hour" />
            </div>
            <div class="mb-4">
              <label class="form-label fw-semibold">Maximum Number of Spots</label>
              <input v-model.number="lot.maximum_number_of_spots" type="number" class="form-control" min="1" placeholder="e.g., 20" />
            </div>
            <div class="d-flex justify-content-between">
              <button @click="submitLot" class="btn btn-primary fw-semibold">Submit</button>
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
      }
    };
  },
  methods: {
    submitLot() {
      const lot = this.lot;
      if (
        !lot.prime_location_name || !lot.address || !lot.pincode ||
        lot.price_per_hour == null || lot.maximum_number_of_spots == null
      ) {
        alert("Please fill in all fields.");
        return;
      }
      fetch('/api/lots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('auth_token')
        },
        body: JSON.stringify(lot)
      })
      .then(res => res.json())
      .then(data => {
        if (data.lot_id) {
          alert('Lot added successfully!');
          this.$router.push('/admin_dash');
        } else {
          alert('Failed to add lot.');
        }
      })
      .catch(() => alert('Error occurred.'));
    }
  }
}
