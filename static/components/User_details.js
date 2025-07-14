export default {
  template: `
    <div class="container mt-4">
      <h2 class="mb-3">Registered Users</h2>

      <table class="table table-striped" v-if="users.length">
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Username</th>
            <th>Pincode</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.id }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.username }}</td>
            <td>{{ u.pincode }}</td>
          </tr>
        </tbody>
      </table>

      <div v-else class="text-muted">
        No users found.
      </div>
    </div>
  `,

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
      this.$router.push('/login');  // redirect if unauthorized or error
    }
  }
};
