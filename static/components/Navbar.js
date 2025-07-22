// Navbar.vue
export default {
  template: `
<nav class="navbar navbar-expand-lg navbar-dark navbar-gradient shadow-lg px-4">
  <div class="mx-auto order-0 px-4" >
    <a href="/" class="navbar-brand fw-bold fs-5 text-uppercase">
      Parking Lot App
    </a>
  </div>
  <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navCollapse"> <span class="navbar-toggler-icon"></span></button>

  <div id="navCollapse" class="collapse navbar-collapse">
    <ul class="navbar-nav me-auto d-flex align-items-center gap-4" v-if="loggedIn">
      <template v-if="isAdmin">
        <li class="nav-item">
          <router-link class="btn btn-outline-light btn-sm fw-bold" to="/admin_dash">Home</router-link>
        </li>
        <li class="nav-item">
          <router-link class="btn btn-outline-light btn-sm fw-bold" to="/user_details">User Details</router-link>
        </li>
        <li class="nav-item">
          <router-link class="btn btn-outline-light btn-sm fw-bold" to="/admin_summary">Summary</router-link>
        </li>
        <li class="nav-item">
          <button class="btn btn-outline-light btn-sm fw-bold" @click="logout">
             Logout
          </button>
        </li>
      </template>
      <template v-else>
        <li class="nav-item">
          <router-link class="btn btn-outline-light btn-sm fw-bold" to="/user_dash">Home</router-link>
        </li>
        <li class="nav-item">
          <router-link class="btn btn-outline-light btn-sm fw-bold" to="/user_summary">Summary</router-link>
        </li>
        <li class="nav-item">
          <button class="btn btn-outline-light btn-sm fw-bold" @click="logout">
             Logout
          </button>
        </li>
      </template>
    </ul>

    <div class="d-flex align-items-center ms-auto me-3 gap-3">
      <span v-if="loggedIn" class="text-white"
        style="font-family: 'Segoe UI', sans-serif; font-size: 1.25rem; letter-spacing: 3px; margin-right: 30px;"
      >
        Welcome,&nbsp;<strong>{{ user?.name || '...' }}</strong>
      </span>
      <template v-else>
        <router-link class="btn btn-outline-light btn-sm fw-bold" to="/login">Login</router-link>
        <router-link class="btn btn-outline-light btn-sm fw-bold" to="/register">Register</router-link>
      </template>
    </div>
  </div>
</nav>

  `,

  data() {
    return {
      loggedIn: false,
      user: null 
    };
  },
  computed: {
    isAdmin()   { return this.user?.roles?.includes('admin'); },
    homeRoute() { return this.isAdmin ? '/admin' : '/home'; }
  },

  methods: {
    async syncAuthState() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.loggedIn = false;
      this.user = null;
      return;
    }
    try {
      const res = await fetch('/api/me', {
        headers: { 'Authentication-Token': token }
      });

      if (res.ok) {
        this.user = await res.json();
        this.loggedIn = true;
      } else {
        localStorage.removeItem('auth_token');
        this.loggedIn = false;
        this.user = null;
      }
    } catch (e) {
      console.error('Auth check failed:', e);
      this.loggedIn = false;
      this.user = null;
    }
  },

    logout() {
      localStorage.removeItem('auth_token');
      this.syncAuthState();
      this.$router.push('/login');
    }
  },

  created() {
    this.syncAuthState();
    this.$router.afterEach(() => this.syncAuthState());
  }
};
