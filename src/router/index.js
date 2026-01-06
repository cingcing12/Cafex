import { createRouter, createWebHashHistory } from 'vue-router'

// User Views
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import ContactView from '../views/ContactView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'
import WishlistView from '../views/WishlistView.vue' // Import the new view

// Layouts
import AdminLayout from '../layouts/AdminLayout.vue'

// Admin Views
import AdminLogin from '../views/admin/AdminLogin.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import AdminOrders from '../views/admin/AdminOrders.vue'
import AdminProducts from '../views/admin/AdminProducts.vue'
import AdminUsers from '../views/admin/AdminUsers.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    // --- USER ROUTES ---
    { path: '/', component: HomeView },
    { path: '/about', component: AboutView },
    { path: '/contact', component: ContactView },
    { path: '/checkout', component: CheckoutView },
    { path: '/login', component: LoginView },
    { path: '/profile', component: ProfileView },
    { path: '/wishlist', component: WishlistView }, // Add this line

    // --- ADMIN ROUTES ---
    { 
      path: '/admin/login', 
      component: AdminLogin,
      meta: { layout: 'blank' }
    },
    { 
      path: '/admin', 
      component: AdminLayout,
      meta: { layout: 'admin' },
      children: [
        { path: '', redirect: '/admin/dashboard' },
        { path: 'dashboard', component: AdminDashboard },
        { path: 'orders', component: AdminOrders },
        { path: 'products', component: AdminProducts },
        { path: 'users', component: AdminUsers },
      ]
    },
  ]
})

export default router