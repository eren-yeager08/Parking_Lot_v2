export default {
  template: `
    <div class="d-flex flex-column vh-100 position-relative" style="background-color: #06262eff;">
      <div class="container position-relative mt-4" style="z-index: 1;">
        <h2 class="text-center mb-4 text-white fw-semibold " style="letter-spacing: 1px;">
          All Registered Users
        </h2>
        <div class="bg-opacity-90 shadow-lg p-3 rounded">
          <div class="table-responsive">
            <table class="table table-striped text-center rounded overflow-hidden" v-if="users.length">
              <thead class="text-white" style="background-color: #007e7e;">
                <tr>
                  <th style="background-color: #007e7e; color: white;">User ID</th>
                  <th style="background-color: #007e7e; color: white;">Email</th>
                  <th style="background-color: #007e7e; color: white;">Username</th>
                  <th style="background-color: #007e7e; color: white;">Pincode</th>
                  <th style="background-color: #007e7e; color: white;">Total Reservations</th>
                  <th style="background-color: #007e7e; color: white;">Total Paid</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in users" :key="u.id">
                  <td>{{ u.id }}</td>
                  <td>{{ u.email }}</td>
                  <td>{{ u.username }}</td>
                  <td>{{ u.pincode }}</td>
                  <td>{{ u.total_reservations }}</td>
                  <td>₹{{ u.total_paid }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="text-muted text-center py-3">
              No users found.
            </div>
          </div>
        </div>
      </div>
    </div>`
    ,

  data() {
    return {
      users: []
    };
  },

  async mounted() {
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authentication-Token': localStorage.getItem('auth_token') }
      });
      if (!res.ok) throw new Error('Unauthorized or fetch error');
      this.users = await res.json();
    } catch (err) {
      console.error(err);
      this.$router.push('/login');
    }
  }
};
