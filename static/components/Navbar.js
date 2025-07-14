// Navbar.vue
export default {
  template: `
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark px-3">
    <router-link class="navbar-brand fw-bold" :to="homeRoute">
      Parking Lot App
    </router-link>

    <!-- hamburger for small screens -->
    <button
      class="navbar-toggler"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#navCollapse"
    >
      <span class="navbar-toggler-icon"></span>
    </button>

    <div id="navCollapse" class="collapse navbar-collapse">
      <ul class="navbar-nav me-auto" v-if="loggedIn">
        <!-- admin‑only links -->
        <template v-if="isAdmin">
          <li class="nav-item">
            <router-link class="nav-link" to="/admin_dash">Home</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/user_details">User Details</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/summary">Summary</router-link>
          </li>
        </template>

        <!-- normal user link -->
        <template v-else>
          <li class="nav-item">
            <router-link class="nav-link" to="/home">Home</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/user_summary">Summary</router-link>
          </li>
        </template>
      </ul>

      <!-- right‑side actions -->
      <div class="d-flex align-items-center ms-auto">
        <span v-if="loggedIn" class="text-white me-3">
          Welcome,&nbsp;{{ user?.name || '...' }}
        </span>

        <template v-if="loggedIn">
          <button class="btn btn-outline-light btn-sm" @click="logout">
            Logout
          </button>
        </template>

        <template v-else>
          <router-link class="btn btn-primary me-2" to="/login">Login</router-link>
          <router-link class="btn btn-warning" to="/register">Register</router-link>
        </template>
      </div>
    </div>
  </nav>
  `,

  data() {
    return {
      loggedIn: false,
      user: null          // { id, name, roles: [...] }
    };
  },

  computed: {
    isAdmin()   { return this.user?.roles?.includes('admin'); },
    homeRoute() { return this.isAdmin ? '/admin' : '/home'; }
  },

  methods: {
    /** read token → set loggedIn flag → fetch user if needed */
    async syncAuthState() {
      this.loggedIn = !!localStorage.getItem('auth_token');

      if (this.loggedIn && !this.user) {
        try {
          const res   = await fetch('/api/me', {
            headers: { 'Authentication-Token': localStorage.getItem('auth_token') }
          });
          if (res.ok) this.user = await res.json();
        } catch (e) {
          console.error(e);
        }
      }

      if (!this.loggedIn) this.user = null;
    },

    logout() {
      localStorage.removeItem('auth_token');
      this.syncAuthState();
      this.$router.push('/login');
    }
  },

  created() {
    this.syncAuthState();

    // keep navbar up‑to‑date on every route change
    this.$router.afterEach(() => this.syncAuthState());
  }
};
