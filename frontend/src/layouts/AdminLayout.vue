<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMainStore } from '@/stores/mainStore'
import { 
  ChartBarIcon, 
  ShoppingBagIcon, 
  ClipboardDocumentListIcon, 
  UserGroupIcon, 
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const store = useMainStore()
const router = useRouter()
const route = useRoute()
const isMobileMenuOpen = ref(false)

// --- CRITICAL FIX: Check currentAdmin, not currentUser ---
if (!store.currentAdmin || store.currentAdmin.role !== 'admin') {
  router.push('/admin/login')
}

const handleLogout = () => {
  store.logoutAdmin() // Fix: Log out the admin session
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
      
      <nav class="flex-1 px-4 space-y-2 mt-8">
        <router-link to="/admin/dashboard" @click="isMobileMenuOpen = false" :class="['flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-medium', isActive('dashboard') ? 'bg-coffee-600 text-white shadow-lg shadow-coffee-900/50' : 'text-gray-400 hover:bg-gray-800 hover:text-white']">
          <ChartBarIcon class="w-6 h-6" /> Dashboard
        </router-link>
        <router-link to="/admin/orders" @click="isMobileMenuOpen = false" :class="['flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-medium', isActive('orders') ? 'bg-coffee-600 text-white shadow-lg shadow-coffee-900/50' : 'text-gray-400 hover:bg-gray-800 hover:text-white']">
          <ShoppingBagIcon class="w-6 h-6" /> Orders
        </router-link>
        <router-link to="/admin/products" @click="isMobileMenuOpen = false" :class="['flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-medium', isActive('products') ? 'bg-coffee-600 text-white shadow-lg shadow-coffee-900/50' : 'text-gray-400 hover:bg-gray-800 hover:text-white']">
          <ClipboardDocumentListIcon class="w-6 h-6" /> Menu
        </router-link>
        <router-link to="/admin/users" @click="isMobileMenuOpen = false" :class="['flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-medium', isActive('users') ? 'bg-coffee-600 text-white shadow-lg shadow-coffee-900/50' : 'text-gray-400 hover:bg-gray-800 hover:text-white']">
          <UserGroupIcon class="w-6 h-6" /> Users
        </router-link>
      </nav>

      <div class="p-6 border-t border-gray-800 bg-gray-900/50">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-coffee-400 to-coffee-600 flex items-center justify-center text-sm font-bold shadow-lg">
            {{ store.currentAdmin?.name?.charAt(0) || 'A' }}
          </div>
          <div>
            <p class="text-sm font-bold text-white">{{ store.currentAdmin?.name || 'Admin' }}</p>
            <p class="text-xs text-gray-500">Super Admin</p>
          </div>
        </div>
        <button @click="handleLogout" class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all text-sm font-bold duration-300">
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

      <div class="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
        <div class="max-w-7xl mx-auto">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from { opacity: 0; transform: translateY(10px); }
.fade-leave-to { opacity: 0; transform: translateY(-10px); }
</style>