<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue' 
import Footer from '@/components/Footer.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import { useMainStore } from '@/stores/mainStore'
import { 
  XMarkIcon, PlusIcon, MinusIcon, TrashIcon, 
  ShoppingBagIcon, SparklesIcon 
} from '@heroicons/vue/24/solid'

const store = useMainStore()
const router = useRouter()
const route = useRoute()

const isCartOpen = ref(false)
const showRemoveModal = ref(false)
const itemToRemoveId = ref(null)

const openCart = () => isCartOpen.value = true

onMounted(() => {
  window.addEventListener('toggle-cart', openCart)
  if (store.currentUser) store.fetchUserCart()
})

onUnmounted(() => window.removeEventListener('toggle-cart', openCart))

const formatCurrency = (val) => `$${Number(val).toFixed(2)}`

const proceedToCheckout = () => {
  if (store.cart.length === 0) return;
  isCartOpen.value = false
  router.push('/checkout')
}

const promptRemove = (cartId) => {
  itemToRemoveId.value = cartId
  showRemoveModal.value = true
}

const confirmRemove = () => {
  if (itemToRemoveId.value) {
    store.removeFromCart(itemToRemoveId.value)
    showRemoveModal.value = false
    itemToRemoveId.value = null
    store.showToast("Item removed from cart", "info")
  }
}

const isAuthPage = computed(() => {
  const authPaths = ['/login', '/register', '/otp', '/forgot-password'] 
  return authPaths.includes(route.path)
})
</script>

<template>
  <div class="flex flex-col min-h-screen bg-[#FDFBF7] font-sans text-gray-800 selection:bg-orange-100 selection:text-orange-900">
    
    <NavBar v-if="!isAuthPage" />
    
    <div class="relative z-[9999]">
      <ToastContainer />
    </div>

    <div class="flex-grow pt-2 relative z-0">
      <slot />
    </div>
    
    <Footer v-if="!isAuthPage" />

    <transition name="slide-over">
      <div v-if="isCartOpen && !isAuthPage" class="fixed inset-0 z-[100] flex justify-end">
        <div @click="isCartOpen = false" class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"></div>
        <div class="relative w-full max-w-md bg-white/95 backdrop-blur-2xl h-full flex flex-col shadow-2xl transform transition-transform duration-300 ease-out border-l border-white/50">
          
          <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-white/50 backdrop-blur-md z-10 sticky top-0">
            <h2 class="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                My Cart 
                <span v-if="store.cartTotalQuantity > 0" class="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-bold animate-scale-in">
                    {{ store.cartTotalQuantity }}
                </span>
            </h2>
            <button @click="isCartOpen = false" class="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition shadow-sm">
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-gray-50/50">
            <div v-if="store.cart.length === 0" class="flex flex-col items-center justify-center h-full text-gray-400 pb-20 animate-fade-in">
              <div class="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-md border border-gray-100">
                  <ShoppingBagIcon class="w-14 h-14 text-gray-200" />
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h3>
              <p class="font-medium text-gray-500 text-sm mb-8 text-center max-w-[220px] leading-relaxed">
                  Looks like you haven't added any delicious coffee yet.
              </p>
              <button @click="isCartOpen = false" class="text-white font-bold bg-gray-900 px-8 py-3 rounded-2xl shadow-lg hover:bg-black hover:scale-105 transition transform">
                Start Ordering
              </button>
            </div>

            <transition-group name="list">
                <div v-for="item in store.cart" :key="item.cartId" class="relative group bg-white p-3 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div class="flex gap-4">
                    <div class="w-24 h-24 rounded-2xl overflow-hidden shadow-sm shrink-0 relative bg-gray-100">
                        <img :src="item.image" class="w-full h-full object-cover transform group-hover:scale-110 transition duration-500" @error="$event.target.src='https://cdn-icons-png.flaticon.com/512/924/924514.png'">
                        <div v-if="item.isReward" class="absolute top-0 right-0 bg-yellow-400 text-white text-[9px] font-bold px-2 py-1 rounded-bl-xl shadow-sm">FREE</div>
                    </div>
                    <div class="flex-1 flex flex-col justify-between py-1 min-w-0">
                        <div>
                            <div class="flex justify-between items-start mb-1">
                                <h4 class="font-black text-gray-900 text-base leading-tight truncate pr-2">{{ item.name }}</h4>
                                <p class="text-sm font-bold text-gray-900">{{ formatCurrency(item.price * item.quantity) }}</p>
                            </div>
                            <div class="flex flex-wrap gap-1 mt-1.5">
                                <span v-if="item.options?.size" class="tag bg-blue-50 text-blue-600 border-blue-100">{{ item.options.size }}</span>
                                <span v-if="item.options?.sugar" class="tag bg-pink-50 text-pink-600 border-pink-100">{{ item.options.sugar }}</span>
                                <span v-if="item.options?.ice" class="tag bg-cyan-50 text-cyan-600 border-cyan-100">{{ item.options.ice }}</span>
                            </div>
                        </div>
                        <div class="flex items-center justify-between mt-3">
                            <div class="flex items-center bg-gray-50 rounded-xl p-1 shadow-inner border border-gray-100">
                                <button @click="store.decrementItem(item.cartId)" class="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-black active:scale-90 transition border border-gray-100"><MinusIcon class="w-3 h-3"/></button>
                                <span class="w-8 text-center font-bold text-sm text-gray-800">{{ item.quantity }}</span>
                                <button @click="store.incrementItem(item.cartId)" class="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-black active:scale-90 transition border border-gray-100"><PlusIcon class="w-3 h-3"/></button>
                            </div>
                            <button @click="promptRemove(item.cartId)" class="w-9 h-9 flex items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-500 transition active:scale-90">
                                <TrashIcon class="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
                </div>
            </transition-group>
          </div>

          <div v-if="store.cart.length > 0" class="p-6 border-t border-gray-100 bg-white/80 backdrop-blur-xl z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
            <div class="space-y-3 mb-6">
                <div class="flex justify-between items-center text-sm text-gray-500 font-medium">
                    <span>Subtotal</span>
                    <span>{{ formatCurrency(store.cartTotalValue) }}</span>
                </div>
                <div class="flex justify-between items-end">
                    <span class="text-xl font-black text-gray-900">Total</span>
                    <span class="text-3xl font-black text-gray-900 tracking-tighter">{{ formatCurrency(store.cartTotalValue) }}</span>
                </div>
            </div>
            <button @click="proceedToCheckout" class="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-black hover:shadow-xl hover:shadow-gray-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2 relative overflow-hidden group">
              <span class="relative z-10 flex items-center gap-2">Checkout Securely <SparklesIcon class="w-5 h-5 text-yellow-400 animate-pulse"/></span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="modal-bounce">
      <div v-if="showRemoveModal" class="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/30 backdrop-blur-sm transition-opacity" @click="showRemoveModal = false"></div>
        <div class="bg-white w-full max-w-xs rounded-[2.5rem] shadow-2xl relative z-10 p-8 transform transition-all text-center border border-white/50">
          <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-red-100 animate-bounce-in">
            <TrashIcon class="w-8 h-8" />
          </div>
          <h3 class="text-2xl font-black text-gray-900 mb-2">Remove Item?</h3>
          <p class="text-gray-500 font-medium text-sm mb-8 leading-relaxed">
            This item will be removed from your cart. You can add it back later.
          </p>
          <div class="flex gap-3">
            <button @click="showRemoveModal = false" class="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition active:scale-95">Cancel</button>
            <button @click="confirmRemove" class="flex-1 py-3.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition active:scale-95">Remove</button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
.tag { @apply text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide; }
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }

.slide-over-enter-active, .slide-over-leave-active { transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-over-enter-from, .slide-over-leave-to { opacity: 0; }
.slide-over-enter-active .transform, .slide-over-leave-active .transform { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-over-enter-from .transform { transform: translateX(100%); }
.slide-over-leave-to .transform { transform: translateX(100%); }

.list-move, .list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from { opacity: 0; transform: translateX(30px); }
.list-leave-to { opacity: 0; transform: translateX(-30px); position: absolute; width: 100%; }

.modal-bounce-enter-active { animation: bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.modal-bounce-leave-active { transition: opacity 0.2s ease; }
.modal-bounce-leave-to { opacity: 0; }
@keyframes bounceIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }

.page-fade-enter-active, .page-fade-leave-active { transition: opacity 0.2s ease; }
.page-fade-enter-from, .page-fade-leave-to { opacity: 0; }
.animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
</style>