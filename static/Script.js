import Home from './components/Home.js'
import Login from './components/Login.js'
import Register from './components/Register.js'
import Navbar from './components/Navbar.js'
import Footer from './components/Footer.js'
import Admin_dash from './components/Admin_dash.js'
import Add_lot from './components/Add_lot.js'
import Edit_lot from './components/Edit_lot.js'
import User_details from './components/User_details.js'
import Admin_summary from './components/Admin_summary.js'
import User_dash from './components/User_dash.js'
import User_summary from './components/User_summary.js'






const routes = [ 
    {path: '/', component: Home},
    {path: '/login', component: Login },
    {path: '/register', component: Register},
    {path: '/admin_dash', component: Admin_dash},
    {path: '/add_lot', component: Add_lot},
    {path: '/edit_lot/:id', component: Edit_lot },
    {path: '/user_details', component: User_details},
    {path: '/admin_summary', component: Admin_summary},
    {path: '/user_dash', component: User_dash},
    {path: '/user_summary', component: User_summary},





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