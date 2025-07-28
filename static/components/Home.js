export default {
  template: `
    <div class="row m-0">
      <div class="col-12 p-0 position-relative">
        <img src="/static/Images/parking.png" alt="home" class="img-fluid w-100"
          style="min-height: 300px; height: calc(100vh - 120px); object-fit: cover; filter: blur(3px);">
        
        <div class="position-absolute top-50 start-50 translate-middle text-center text-white px-3"
          style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 600px; z-index: 1; text-shadow: 1px 1px 6px rgba(0,0,0,0.7);">
          
          <div class="fs-3 fw-semibold text-break">
            Welcome to
          </div>
          <div class="fs-1 fw-bold text-break mt-1">
            Parking Lot App
          </div>
          <div class="fs-5 fw-normal text-break mt-3">
            Your smart & reliable parking solution.<br>
            Find your spot, park with ease, and enjoy hassle-free parking every time.
          </div>
        </div>
      </div>
    </div>
  `
}
