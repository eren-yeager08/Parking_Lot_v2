export default {
  template: `
  <div class="container mt-4" style="max-width: 500px;">
    <h3 class="mb-3">Add Parking Lot</h3>

    <div class="mb-3">
      <label class="form-label">Location Name</label>
      <input v-model="lot.prime_location_name" type="text" class="form-control" />
    </div>

    <div class="mb-3">
      <label class="form-label">Address</label>
      <textarea v-model="lot.address" class="form-control"></textarea>
    </div>

    <div class="mb-3">
      <label class="form-label">Pincode</label>
      <input v-model="lot.pincode" type="text" class="form-control" />
    </div>

    <div class="mb-3">
      <label class="form-label">Price per Hour</label>
      <input v-model.number="lot.price_per_hour" type="number" class="form-control" min="0" />
    </div>

    <div class="mb-3">
      <label class="form-label">Maximum Number of Spots</label>
      <input v-model.number="lot.maximum_number_of_spots" type="number" class="form-control" min="1" />
    </div>

    <div class="d-flex justify-content-between">
      <button @click="submitLot" class="btn btn-primary">Submit</button>
      <button @click="$router.push('/admin_dash')" class="btn btn-secondary">Cancel</button>
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
