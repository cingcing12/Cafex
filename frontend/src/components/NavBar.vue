<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMainStore } from '@/stores/mainStore'
import { 
  ShoppingBagIcon, 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon,
  HeartIcon // Import Heart
} from '@heroicons/vue/24/outline'

const store = useMainStore()
const router = useRouter()
const isMobileMenuOpen = ref(false)

const navLinks = [
  { name: 'Menu', path: '/' },
  { name: 'Our Story', path: '/about' },
  { name: 'Contact', path: '/contact' },
]

const toggleCart = () => {
  window.dispatchEvent(new Event('toggle-cart'))
}
</script>

<template>
  <nav class="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-20">
        
        <div class="flex-shrink-0 flex items-center cursor-pointer" @click="router.push('/')">
          <span class="text-3xl font-extrabold text-coffee-600 tracking-tighter">CAFÉX</span>
        </div>

        <div class="hidden md:flex space-x-8 items-center">
          <router-link 
            v-for="link in navLinks" 
            :key="link.name" 
            :to="link.path"
            class="text-sm font-medium text-gray-600 hover:text-coffee-600 transition-colors uppercase tracking-wide"
            active-class="text-coffee-600 font-bold"
          >
            {{ link.name }}
          </router-link>
        </div>

        <div class="hidden md:flex items-center space-x-6">
          <router-link v-if="store.currentUser?.role === 'admin'" to="/admin" class="text-xs font-bold bg-gray-900 text-white px-3 py-1 rounded-md">
            ADMIN
          </router-link>

          <div v-if="store.currentUser" class="flex items-center gap-4">
            <button @click="router.push('/wishlist')" class="relative group">
              <HeartIcon class="w-7 h-7 text-gray-700 group-hover:text-red-500 transition" />
              <span v-if="store.wishlist.length" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-white">
                {{ store.wishlist.length }}
              </span>
            </button>

            <div class="flex items-center gap-2 cursor-pointer hover:text-coffee-600" @click="router.push('/profile')">
              <span class="text-sm font-medium">{{ store.currentUser.name }}</span>
              <UserCircleIcon class="w-6 h-6" />
            </div>
          </div>
          
          <button v-else @click="router.push('/login')" class="text-sm font-bold text-coffee-600 border border-coffee-600 px-5 py-2 rounded-full hover:bg-coffee-600 hover:text-white transition-all">
            Login
          </button>

          <button @click="toggleCart" class="relative group">
            <ShoppingBagIcon class="w-7 h-7 text-gray-700 group-hover:text-coffee-600 transition" />
            <span v-if="store.cart.length" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white">
              {{ store.cartTotalQuantity }}
            </span>
          </button>
        </div>

        <div class="md:hidden flex items-center gap-4">
          <button @click="toggleCart" class="relative">
            <ShoppingBagIcon class="w-6 h-6 text-gray-700" />
            <span v-if="store.cart.length" class="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
              {{ store.cartTotalQuantity }}
            </span>
          </button>
          <button @click="isMobileMenuOpen = !isMobileMenuOpen" class="text-gray-700">
            <Bars3Icon v-if="!isMobileMenuOpen" class="w-8 h-8" />
            <XMarkIcon v-else class="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="isMobileMenuOpen" class="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-xl">
      <div class="px-4 pt-2 pb-6 space-y-2">
        <router-link v-for="link in navLinks" :key="link.name" :to="link.path" @click="isMobileMenuOpen = false" class="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-coffee-50 hover:text-coffee-600">
          {{ link.name }}
        </router-link>
        <div class="border-t border-gray-100 my-2"></div>
        <div v-if="store.currentUser">
           <router-link to="/wishlist" @click="isMobileMenuOpen = false" class="block px-3 py-3 text-base font-medium text-gray-700">My Wishlist ({{ store.wishlist.length }})</router-link>
           <router-link to="/profile" @click="isMobileMenuOpen = false" class="block px-3 py-3 text-base font-medium text-gray-700">Profile ({{ store.currentUser.name }})</router-link>
        </div>
        <div v-else @click="router.push('/login'); isMobileMenuOpen=false" class="block px-3 py-3 text-base font-medium text-coffee-600 font-bold">
          Login / Register
        </div>
      </div>
    </div>
  </nav>
</template>