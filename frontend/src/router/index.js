import { createRouter, createWebHashHistory } from 'vue-router'
import { useMainStore } from '@/stores/mainStore'

// User Views
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import ContactView from '../views/ContactView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'
import WishlistView from '../views/WishlistView.vue'

// 🟢 NEW: Delivery Staff View
import DeliveryDashboard from '../views/DeliveryDashboard.vue'

// Admin Views
import AdminLayout from '../layouts/AdminLayout.vue'
import AdminLogin from '../views/admin/AdminLogin.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import AdminOrders from '../views/admin/AdminOrders.vue'
import AdminProducts from '../views/admin/AdminProducts.vue'
import AdminUsers from '../views/admin/AdminUsers.vue'
import AdminCategories from '../views/admin/AdminCategories.vue'
import AdminStaff from '../views/admin/AdminStaff.vue' // 🟢 NEW: For managing drivers

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    // --- USER ROUTES ---
    { path: '/', component: HomeView },
    { path: '/about', component: AboutView },
    { path: '/contact', component: ContactView },
    { path: '/checkout', component: CheckoutView, meta: { requiresUser: true } },
    { path: '/profile', component: ProfileView, meta: { requiresUser: true } },
    { path: '/wishlist', component: WishlistView, meta: { requiresUser: true } },
    { path: '/login', component: LoginView, meta: { userGuestOnly: true } },

    // 🟢 NEW: DELIVERY STAFF ROUTE
    { 
      path: '/delivery', 
      component: DeliveryDashboard,
      // You might want to add a meta guard here later (e.g., meta: { requiresStaff: true })
    },

    // --- ADMIN ROUTES ---
    { 
      path: '/admin/login', 
      component: AdminLogin, 
      meta: { layout: 'blank' } 
    },
    
    { 
      path: '/admin', 
      component: AdminLayout, 
      meta: { layout: 'admin', requiresAdmin: true },
      children: [
        { path: '', redirect: '/admin/dashboard' },
        { path: 'dashboard', component: AdminDashboard },
        { path: 'orders', component: AdminOrders },
        { path: 'products', component: AdminProducts },
        { path: 'categories', component: AdminCategories },
        { path: 'users', component: AdminUsers },
        { path: 'staff', component: AdminStaff }, // 🟢 NEW: Manage Delivery Staff
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

// --- NAVIGATION GUARDS ---
router.beforeEach((to, from, next) => {
  const store = useMainStore()
  
  // 1. ADMIN LOGIN PAGE
  if (to.path === '/admin/login') {
    if (store.currentAdmin) {
      return next('/admin/dashboard')
    }
    return next()
  }

  // 2. PROTECTED ADMIN PAGES
  if (to.matched.some(r => r.meta.requiresAdmin)) {
    if (!store.currentAdmin) {
      return next('/admin/login')
    }
    return next()
  } 
  
  // 3. PROTECTED USER PAGES
  if (to.matched.some(r => r.meta.requiresUser)) {
    if (!store.currentUser) {
      return next('/login')
    }
    return next()
  } 
  
  // 4. USER GUEST ONLY
  if (to.meta.userGuestOnly && store.currentUser) {
    return next('/profile')
  } 
  
  // Default
  next()
})

export default router