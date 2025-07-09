export default {
  template: `
    <div class="row border align-items-center">
        <div class="col-10 fs-2">
            Parking Lot App 
        </div>
        <div class="col-2 text-end">
            <div v-if="!loggedIn">
                <router-link class="btn btn-primary me-2" to="/login">Login</router-link>
                <router-link class="btn btn-warning" to="/register">Register</router-link>
            </div>
            <div v-else>
                <button class="btn btn-danger" @click="logout">Logout</button>
            </div>
        </div>
    </div>
  `,
  data() {
    return {
      loggedIn: false
    };
  },
  methods: {
    checkLogin() {
      this.loggedIn = !!localStorage.getItem('auth_token');
    },
    logout() {
      localStorage.removeItem('auth_token');
      this.checkLogin();
      this.$router.push('/login');
    }
  },
  created() {
    this.checkLogin();
    this.$router.afterEach(() => {
      this.checkLogin();
    });
  }
};
