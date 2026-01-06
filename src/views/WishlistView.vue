<script setup>
import { useMainStore } from '@/stores/mainStore'
import { ShoppingBagIcon, TrashIcon, HeartIcon, ArrowLongRightIcon } from '@heroicons/vue/24/outline'

const store = useMainStore()
const formatCurrency = (val) => `$${val.toFixed(2)}`

const moveToCart = (product) => {
  store.addToCart(product)
  store.toggleWishlist(product) // Optional: Remove from wishlist after adding to cart
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    
    <div class="bg-white border-b border-gray-100 shadow-sm sticky top-20 z-10">
      <div class="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">My Wishlist</h1>
          <p class="text-gray-500 text-sm mt-1">
            <span class="font-bold text-coffee-600">{{ store.wishlist.length }} items</span> saved for later
          </p>
        </div>
        <button 
          v-if="store.wishlist.length > 0"
          @click="$router.push('/')" 
          class="text-sm font-bold text-gray-500 hover:text-coffee-600 flex items-center gap-2 transition-colors"
        >
          Continue Shopping <ArrowLongRightIcon class="w-5 h-5" />
        </button>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-12">
      
      <transition name="fade" mode="out-in">
        <div v-if="store.wishlist.length === 0" class="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm text-center">
          <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <HeartIcon class="w-10 h-10 text-gray-300" />
          </div>
          <h3 class="text-2xl font-bold text-gray-900">Your wishlist is empty</h3>
          <p class="text-gray-500 mt-2 max-w-sm">Looks like you haven't found anything yet. Explore our menu to find your new favorites.</p>
          <button @click="$router.push('/')" class="mt-8 bg-coffee-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-coffee-200 hover:bg-coffee-700 transition transform hover:-translate-y-1 active:scale-95">
            Browse Menu
          </button>
        </div>

        <div v-else>
          <transition-group 
            name="list" 
            tag="div" 
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
          >
            <div v-for="product in store.wishlist" :key="product.id" class="group bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden relative flex flex-col">
              
              <div class="h-64 overflow-hidden bg-gray-100 relative">
                <img 
                  :src="product.image" 
                  class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
                
                <button 
                  @click="store.toggleWishlist(product)" 
                  class="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm transition-all duration-300 transform hover:rotate-90 active:scale-90"
                  title="Remove from Wishlist"
                >
                  <TrashIcon class="w-5 h-5" />
                </button>

                <div class="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
                  {{ product.category }}
                </div>
              </div>

              <div class="p-6 flex-1 flex flex-col">
                <div class="mb-4">
                  <h3 class="font-bold text-gray-900 text-lg leading-tight group-hover:text-coffee-600 transition-colors">{{ product.name }}</h3>
                  <p class="text-gray-500 text-sm mt-1 line-clamp-2">{{ product.desc }}</p>
                </div>
                
                <div class="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span class="font-extrabold text-2xl text-gray-900">{{ formatCurrency(product.price) }}</span>
                  
                  <button 
                    @click="moveToCart(product)" 
                    class="bg-gray-900 text-white p-3 rounded-xl hover:bg-coffee-600 transition-colors shadow-lg shadow-gray-200 active:scale-95 flex items-center gap-2 text-sm font-bold pr-4"
                  >
                    <ShoppingBagIcon class="w-5 h-5" />
                    Move to Cart
                  </button>
                </div>
              </div>
            </div>
          </transition-group>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
/* Grid Animation for smooth removal */
.list-move, 
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

/* Ensure items sliding into empty spaces do so smoothly */
.list-leave-active {
  position: absolute;
  width: 100%; /* Important for grid items to fade out in place */
  z-index: -1;
}

/* Page Fade */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>