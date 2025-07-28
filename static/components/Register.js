export default {
  template: `
    <div class="d-flex flex-column vh-100">
      <div class="flex-grow-1 position-relative">
        <img 
          src="/static/Images/parking.png" 
          alt="registration" 
          class="w-100 h-100 position-absolute top-0 start-0" 
          style="object-fit: cover; filter: blur(3px); z-index: 0;"
        >
        <div class="position-relative mx-auto shadow-lg rounded p-4"
            style="max-width: 360px; top: 50%; transform: translateY(-50%); z-index: 1; background-color: #d0dfddff;">
          <h2 class="text-center mb-4 fw-bold">Registration Form</h2>

          <div class="mb-3">
            <label for="email" class="form-label fw-semibold">Email address</label>
            <div class="input-group">
              <span class="input-group-text bg-light"><i class="bi bi-envelope-fill text-secondary"></i></span>
              <input type="email" class="form-control" id="email" v-model="formData.email" placeholder="name@example.com" required>
            </div>
          </div>

          <div class="mb-3">
            <label for="username" class="form-label fw-semibold">Username</label>
            <input type="text" class="form-control" id="username" v-model="formData.username" placeholder="Type a username" required>
          </div>

          <div class="mb-4">
            <label for="password" class="form-label fw-semibold">Password</label>
            <div class="input-group">
              <input :type="showPassword ? 'text' : 'password'" class="form-control" id="password" v-model="formData.password" placeholder="Enter your password">
              <span class="input-group-text" style="cursor: pointer;" @click="showPassword = !showPassword">
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </span>
            </div>
          </div>

          <div class="mb-4">
            <label for="pincode" class="form-label fw-semibold">Pincode</label>
            <input type="text" class="form-control" id="pincode" v-model="formData.pincode" placeholder="Enter your pincode" required>
          </div>
          <div class="d-grid">
            <button class="btn btn-primary" @click="addUser">Register</button>
          </div>
        </div>
      </div>
    </div>
  `,
  data: function() {
    return {
      formData: {
        email: "",
        password: "",
        username: "",
        pincode: "",
      },
      showPassword: false
    }
  },
  methods: {
    addUser: function() {
      if (
        !this.formData.email.trim() ||
        !this.formData.username.trim() ||
        !this.formData.password.trim() ||
        !this.formData.pincode.trim()
      ) {
        alert("Please fill in all fields.");
        return;
      }

      fetch('/api/register', {
        method: 'POST',
        headers: {
          "Content-Type": 'application/json'
        },
        body: JSON.stringify(this.formData)
      })
      .then(response => response.json())
      .then(data => {
        alert(data.message);
        this.$router.push('/login');
      })
      .catch(error => {
        alert("Something went wrong. Please try again.");
        console.error(error);
      });
    }
  }
}
