<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMainStore } from '@/stores/mainStore'
import { 
  ChartBarIcon, ShoppingBagIcon, ClipboardDocumentListIcon, 
  UserGroupIcon, ArrowLeftOnRectangleIcon, Bars3Icon, 
  XMarkIcon, ExclamationTriangleIcon, TagIcon, TruckIcon // 🟢 Added TruckIcon
} from '@heroicons/vue/24/outline'

const store = useMainStore()
const router = useRouter()
const route = useRoute()

const isMobileMenuOpen = ref(false)
const showLogoutModal = ref(false) 

// Security Check
onMounted(() => {
  if (!store.currentAdmin) {
    router.push('/admin/login')
  }
})

const confirmLogout = () => { showLogoutModal.value = true }
const cancelLogout = () => { showLogoutModal.value = false }
const executeLogout = () => {
  showLogoutModal.value = false
  store.logoutAdmin()
  router.push('/admin/login')
}

const isActive = (path) => route.path.includes(path)
</script>

<template>
  <div class="flex h-screen bg-gray-50 font-sans overflow-hidden">
    
    <div v-if="isMobileMenuOpen" @click="isMobileMenuOpen = false" class="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm transition-opacity"></div>

    <aside :class="['fixed lg:static inset-y-0 left-0 w-72 bg-gray-900 text-white flex flex-col shadow-2xl z-30 transform transition-transform duration-300 ease-in-out', isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0']">
      
      <div class="p-8 border-b border-gray-800 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-extrabold text-coffee-500 tracking-tighter">CAFÉX</h1>
          <span class="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Admin Portal</span>
        </div>
        <button @click="isMobileMenuOpen = false" class="lg:hidden text-gray-400 hover:text-white">
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>
      
      <nav class="flex-1 px-4 space-y-2 mt-8 overflow-y-auto">
        <router-link to="/admin/dashboard" @click="isMobileMenuOpen = false" :class="['flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-medium', isActive('dashboard') ? 'bg-coffee-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white']">
          <ChartBarIcon class="w-6 h-6" /> Dashboard
        </router-link>
        <router-link to="/admin/orders" @click="isMobileMenuOpen = false" :class="['flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-medium', isActive('orders') ? 'bg-coffee-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white']">
          <ShoppingBagIcon class="w-6 h-6" /> Orders
        </router-link>
        <router-link to="/admin/categories" @click="isMobileMenuOpen = false" :class="['flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-medium', isActive('categories') ? 'bg-coffee-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white']">
          <TagIcon class="w-6 h-6" /> Categories
        </router-link>
        <router-link to="/admin/products" @click="isMobileMenuOpen = false" :class="['flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-medium', isActive('products') ? 'bg-coffee-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white']">
          <ClipboardDocumentListIcon class="w-6 h-6" /> Menu
        </router-link>
        
        <router-link to="/admin/staff" @click="isMobileMenuOpen = false" :class="['flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-medium', isActive('staff') ? 'bg-coffee-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white']">
          <TruckIcon class="w-6 h-6" /> Delivery Staff
        </router-link>

        <router-link to="/admin/users" @click="isMobileMenuOpen = false" :class="['flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-medium', isActive('users') ? 'bg-coffee-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white']">
          <UserGroupIcon class="w-6 h-6" /> Users
        </router-link>
      </nav>

      <div class="p-6 border-t border-gray-800 bg-gray-900/50">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-coffee-400 to-coffee-600 flex items-center justify-center text-sm font-bold shadow-lg text-white">
            {{ store.currentAdmin?.name?.charAt(0) || 'A' }}
          </div>
          <div>
            <p class="text-sm font-bold text-white">{{ store.currentAdmin?.name || 'Admin' }}</p>
            <p class="text-xs text-gray-500">Super Admin</p>
          </div>
        </div>
        <button @click="confirmLogout" class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all text-sm font-bold duration-300 group">
          <ArrowLeftOnRectangleIcon class="w-5 h-5" /> Sign Out
        </button>
      </div>
    </aside>

    <main class="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      <header class="bg-white shadow-sm border-b border-gray-100 lg:hidden p-4 flex items-center justify-between z-10">
        <button @click="isMobileMenuOpen = true" class="text-gray-600 p-2 rounded-lg hover:bg-gray-100">
          <Bars3Icon class="w-8 h-8" />
        </button>
        <span class="font-bold text-coffee-600 text-lg">CAFÉX Admin</span>
        <div class="w-10"></div> 
      </header>

      <div class="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 relative">
        <div class="max-w-7xl mx-auto">
          
          <router-view v-slot="{ Component, route }">
            <transition name="fade" mode="out-in">
              <div :key="route.path">
                <component :is="Component" />
              </div>
            </transition>
          </router-view>

        </div>
      </div>
    </main>

    <transition name="modal">
      <div v-if="showLogoutModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" @click="cancelLogout"></div>
        <div class="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 transform transition-all scale-100">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
            <ExclamationTriangleIcon class="h-8 w-8 text-red-600" aria-hidden="true" />
          </div>
          <h3 class="text-2xl font-extrabold text-center text-gray-900 mb-2">Signing Out?</h3>
          <p class="text-center text-gray-500 text-sm mb-8">Are you sure you want to end your session?</p>
          <div class="flex gap-3">
            <button @click="cancelLogout" class="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
            <button @click="executeLogout" class="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg">Sign Out</button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
/* Ensure smooth fade transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from { opacity: 0; transform: translateY(5px); }
.fade-leave-to { opacity: 0; transform: translateY(-5px); }
</style>