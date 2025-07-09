import Home from './components/Home.js'
import Login from './components/Login.js'
import Register from './components/Register.js'
import Navbar from './components/Navbar.js'
import Footer from './components/Footer.js'
import Admin_dash from './components/Admin_dash.js'



const routes = [ 
    {path: '/', component: Home},
    {path: '/login', component: Login },
    {path: '/register', component: Register},
    {path: '/admin_dash', component: Admin_dash}

]

const router = new VueRouter({
    routes // rote: route
})

const app = new Vue({
    el: "#app",
    router, // router: router its a defined attribute of javascript
    template: `
    <div class="container">
        <nav-bar></nav-bar>
        <router-view></router-view>
        <foot></foot>
    </div>
    `,
    data: {
        section: "Frontend"
    },
    components:{
        "nav-bar": Navbar,  // here we use "" for - bcz key cant have - 
        foot: Footer

    }
})