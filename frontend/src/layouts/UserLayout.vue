<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue' // Added computed
import { useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import Footer from '@/components/Footer.vue'
import ToastContainer from '@/components/ToastContainer.vue' 
import { useMainStore } from '@/stores/mainStore'
import { XMarkIcon, PlusIcon, MinusIcon, GiftIcon } from '@heroicons/vue/24/outline' // Added GiftIcon

const store = useMainStore()
const router = useRouter()
const isCartOpen = ref(false)

const openCart = () => isCartOpen.value = true
onMounted(() => window.addEventListener('toggle-cart', openCart))
onUnmounted(() => window.removeEventListener('toggle-cart', openCart))

const formatCurrency = (val) => `$${val.toFixed(2)}`

// *** NEW: Calculate total here to use in multiple places ***
const cartTotalValue = computed(() => {
  return store.cart.reduce((total, item) => total + (item.price * item.quantity), 0)
})

const proceedToCheckout = () => {
  isCartOpen.value = false
  router.push('/checkout')
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <NavBar />
    
    <ToastContainer />

    <div class="flex-grow">
      <slot /> 
    </div>
    
    <Footer />

    <transition name="slide-over">
      <div v-if="isCartOpen" class="fixed inset-0 z-50 flex justify-end">
        <div @click="isCartOpen = false" class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"></div>
        
        <div class="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out">
          
          <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
            <h2 class="text-xl font-bold text-gray-900">Your Order <span class="text-coffee-600">({{ store.cartTotalQuantity }})</span></h2>
            <button @click="isCartOpen = false" class="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
            <div v-if="store.cart.length === 0" class="flex flex-col items-center justify-center h-64 text-gray-400">
              <span class="text-6xl mb-4 grayscale opacity-50">🛒</span>
              <p class="font-medium text-gray-500">Your cart is empty.</p>
              <router-link to="/" @click="isCartOpen = false" class="mt-4 text-coffee-600 font-bold hover:underline bg-coffee-50 px-6 py-2 rounded-full transition">Start Shopping</router-link>
            </div>

            <div v-for="item in store.cart" :key="item.id" class="flex gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
              <img :src="item.image" class="w-20 h-20 rounded-xl object-cover border border-gray-100">
              
              <div class="flex-1 flex flex-col justify-between">
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-bold text-gray-900 text-sm line-clamp-1 flex items-center gap-1">
                      {{ item.name }}
                      <GiftIcon v-if="item.price === 0" class="w-3 h-3 text-green-500" />
                    </h4>
                    
                    <div :class="['text-sm font-bold mt-0.5', item.price === 0 ? 'text-green-600' : 'text-coffee-600']">
                      {{ item.price === 0 ? 'FREE' : formatCurrency(item.price) }}
                    </div>
                  </div>
                </div>
                
                <div class="flex items-center justify-between mt-3">
                  <div class="flex items-center border border-gray-200 rounded-lg bg-gray-50 h-8">
                    <button @click="store.decrementItem(item.id)" class="px-2.5 h-full text-gray-500 hover:text-coffee-600 hover:bg-white rounded-l-lg transition border-r border-transparent hover:border-gray-200">
                      <MinusIcon class="w-3 h-3" />
                    </button>
                    <span class="px-2 text-xs font-bold text-gray-900 min-w-[20px] text-center">{{ item.quantity }}</span>
                    <button @click="store.incrementItem(item.id)" class="px-2.5 h-full text-gray-500 hover:text-coffee-600 hover:bg-white rounded-r-lg transition border-l border-transparent hover:border-gray-200">
                      <PlusIcon class="w-3 h-3" />
                    </button>
                  </div>
                  
                  <button @click="store.removeFromCart(item.id)" class="text-xs text-gray-400 hover:text-red-500 hover:underline transition">Remove</button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="store.cart.length > 0" class="p-6 border-t border-gray-100 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-10">
            <div class="flex justify-between items-center text-sm text-gray-500 mb-2">
              <span>Subtotal</span>
              <span :class="{ 'text-green-600 font-bold': cartTotalValue === 0 }">
                {{ cartTotalValue === 0 ? 'FREE' : formatCurrency(cartTotalValue) }}
              </span>
            </div>
            
            <div class="flex justify-between items-end mb-6">
              <span class="text-xl font-bold text-gray-900">Total</span>
              <span :class="['text-2xl font-extrabold', cartTotalValue === 0 ? 'text-green-600' : 'text-coffee-600']">
                {{ cartTotalValue === 0 ? 'FREE' : formatCurrency(cartTotalValue) }}
              </span>
            </div>
            
            <button 
              @click="proceedToCheckout" 
              class="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-coffee-600 shadow-xl shadow-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Checkout Now
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.slide-over-enter-active, .slide-over-leave-active { transition: opacity 0.3s ease; }
.slide-over-enter-from, .slide-over-leave-to { opacity: 0; }

.slide-over-enter-active .transform,
.slide-over-leave-active .transform { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }

.slide-over-enter-from .transform,
.slide-over-leave-to .transform { transform: translateX(100%); }
</style>