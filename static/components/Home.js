export default {
  template: `
    <div class="row m-0">
      <div class="col p-0">
        <img src="/static/images/parking.png" alt="home" class="img-fluid w-100" 
          style="min-height: 300px; height: calc(100vh - 120px); object-fit: cover; filter: blur(3px);" >
          <div class="position-absolute top-50 start-50 translate-middle text-center text-white px-3"
            style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            font-size: 1.8rem; font-weight: 600; text-shadow: 1px 1px 6px rgba(0,0,0,0.7); max-width: 400px; z-index: 1;">
                Welcome to <br> <span style="font-size: 2.4rem; font-weight: 700;">Parking Lot App</span> <br>
                Your smart & reliable parking solution.<br>
                Find your spot, park with ease, and enjoy hassle-free parking every time.
          </div>
      </div>
    </div>
  `
}
