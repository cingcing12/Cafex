<script setup>
import { ref, computed } from 'vue' 
import { useMainStore } from '@/stores/mainStore'
import { 
  ShoppingBagIcon, TrashIcon, HeartIcon, ArrowLongRightIcon, 
  XMarkIcon, AdjustmentsHorizontalIcon, FireIcon, 
  SparklesIcon, HandThumbUpIcon
} from '@heroicons/vue/24/outline'
import { StarIcon as StarSolid } from '@heroicons/vue/24/solid' 

const store = useMainStore()
const formatCurrency = (val) => `$${val.toFixed(2)}`

// 🟢 MODAL STATE
const selectedProduct = ref(null)
const currentOptions = ref({
  size: 'Regular',
  sugar: '100%',
  ice: 'Normal',
  temperature: 'Warm',
  cutlery: 'No',
  note: ''
})

const productGroupType = computed(() => {
  if (!selectedProduct.value) return 'Drinks'
  const cat = store.categories.find(c => c.name === selectedProduct.value.category)
  return cat ? cat.group : 'Drinks' 
})

const openMoveToCartModal = (product) => {
  selectedProduct.value = product
  const cat = store.categories.find(c => c.name === product.category)
  const group = cat ? cat.group : 'Drinks'

  if (group === 'Drinks') {
      currentOptions.value = { size: 'Regular', sugar: '100%', ice: 'Normal', note: '' }
  } else if (group === 'Food') {
      currentOptions.value = { temperature: 'Warm', cutlery: 'No', note: '' }
  } else {
      currentOptions.value = { note: '' }
  }
}

const confirmMoveToCart = () => {
  if (!selectedProduct.value) return

  let finalOptions = { note: currentOptions.value.note }
  if (productGroupType.value === 'Drinks') {
      finalOptions.size = currentOptions.value.size
      finalOptions.sugar = currentOptions.value.sugar
      finalOptions.ice = currentOptions.value.ice
  } else if (productGroupType.value === 'Food') {
      finalOptions.temperature = currentOptions.value.temperature
      finalOptions.cutlery = currentOptions.value.cutlery
  }

  store.addToCart(selectedProduct.value, 1, finalOptions)
  store.toggleWishlist(selectedProduct.value)
  selectedProduct.value = null
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans pb-24">
    
    <div class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
      <div class="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">My Wishlist</h1>
          <p class="text-gray-500 text-sm mt-1">
            <span class="font-bold text-coffee-600">{{ store.wishlist.length }} items</span> saved for later
          </p>
        </div>
        <button v-if="store.wishlist.length > 0" @click="$router.push('/')" class="text-sm font-bold text-gray-500 hover:text-coffee-600 flex items-center gap-2 transition-colors">
          Continue Shopping <ArrowLongRightIcon class="w-5 h-5" />
        </button>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-12">
      <transition name="fade" mode="out-in">
        
        <div v-if="store.wishlist.length === 0" class="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm text-center">
          <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6"><HeartIcon class="w-10 h-10 text-gray-300" /></div>
          <h3 class="text-2xl font-bold text-gray-900">Your wishlist is empty</h3>
          <button @click="$router.push('/')" class="mt-8 bg-coffee-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-coffee-200 hover:bg-coffee-700 transition transform hover:-translate-y-1 active:scale-95">Browse Menu</button>
        </div>

        <div v-else>
          <transition-group name="list" tag="div" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            <div v-for="product in store.wishlist" :key="product.id" class="group bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden relative flex flex-col">
              <div class="h-64 overflow-hidden bg-gray-100 relative">
                <img :src="product.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <button @click="store.toggleWishlist(product)" class="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm transition-all duration-300 transform hover:rotate-90 active:scale-90"><TrashIcon class="w-5 h-5" /></button>
                <div class="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">{{ product.category }}</div>
              </div>
              <div class="p-6 flex-1 flex flex-col">
                <div class="mb-4">
                  <h3 class="font-bold text-gray-900 text-lg leading-tight group-hover:text-coffee-600 transition-colors">{{ product.name }}</h3>
                  <p class="text-gray-500 text-sm mt-1 line-clamp-2">{{ product.desc }}</p>
                </div>
                <div class="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span class="font-extrabold text-2xl text-gray-900">{{ formatCurrency(product.price) }}</span>
                  <button @click="openMoveToCartModal(product)" class="bg-gray-900 text-white p-3 rounded-xl hover:bg-coffee-600 transition-colors shadow-lg shadow-gray-200 active:scale-95 flex items-center gap-2 text-sm font-bold pr-4">
                    <ShoppingBagIcon class="w-5 h-5" /> Move to Cart
                  </button>
                </div>
              </div>
            </div>
          </transition-group>
        </div>
      </transition>
    </div>

    <transition name="modal-fade">
      <div v-if="selectedProduct" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-xl transition-opacity" @click="selectedProduct = null"></div>
        
        <div class="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col overflow-hidden animate-zoom-in max-h-[90vh] border border-white/20">
          
          <div class="bg-white px-8 py-5 border-b border-gray-100 flex justify-between items-center z-20">
             <div>
               <p class="text-xs font-extrabold text-gray-400 uppercase tracking-widest">{{ selectedProduct.category }}</p>
               <h3 class="text-xl font-black text-gray-900">{{ selectedProduct.name }}</h3>
             </div>
             <button @click="selectedProduct = null" class="bg-gray-50 hover:bg-gray-100 text-gray-500 p-2 rounded-full transition"><XMarkIcon class="w-6 h-6" /></button>
          </div>

          <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-gray-50/50">
              
              <div class="w-full h-80 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white relative group">
                 <img :src="selectedProduct.image" class="w-full h-full object-cover transform group-hover:scale-105 transition duration-700">
                 <div class="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-gray-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1">
                    <SparklesIcon class="w-3 h-3 text-yellow-500" /> Best Seller
                 </div>
              </div>

              <p class="text-sm text-gray-600 leading-relaxed font-medium px-1">{{ selectedProduct.desc }}</p>

              <template v-if="productGroupType === 'Drinks'">
                
                <div>
                  <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block ml-1">Size Selection</label>
                  <div class="grid grid-cols-3 gap-3">
                    <button v-for="size in ['Small', 'Regular', 'Large']" :key="size" @click="currentOptions.size = size"
                      :class="['py-4 rounded-2xl text-sm font-bold border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden group', 
                      currentOptions.size === size ? 'border-coffee-600 bg-white text-coffee-700 shadow-xl shadow-coffee-100 ring-1 ring-coffee-600' : 'border-transparent bg-white text-gray-400 hover:bg-gray-50 hover:scale-[1.02]']">
                      
                      <svg viewBox="0 0 24 24" fill="currentColor" :class="['transition-all', size === 'Small' ? 'w-5 h-5' : size === 'Regular' ? 'w-7 h-7' : 'w-9 h-9', currentOptions.size === size ? 'text-coffee-600' : 'text-gray-300']">
                        <path d="M4 6h16v2c0 5.52-4.48 10-10 10S0 13.52 0 8V6h4zm14 2h-1.6c.4 1.2.6 2.5.6 4 0 .5-.04 1-.1 1.46.9-.3 1.6-1 2-1.9.5-1.1.5-2.3 0-3.4-.3-.7-.7-1.3-1.3-1.8.1-.1.3-.2.4-.3z"/> 
                        <path d="M3 6h12v2c0 4.4-3.6 8-8 8s-8-3.6-8-8V6h4zm14 2h-1.3c.3 1 .5 2 .5 3.2 0 .4-.03.8-.08 1.17.7-.2 1.3-.8 1.6-1.5.4-.9.4-1.8 0-2.7-.2-.6-.6-1-1-1.4.1-.1.2-.2.3-.2z" fill-opacity="0.3"/> 
                        <path d="M18.2 4H5.8C5.4 4 5 4.4 5 5v7c0 3.9 3.1 7 7 7s7-3.1 7-7V5c0-.6-.4-1-.8-1z" />
                      </svg>

                      {{ size }}
                      <div v-if="currentOptions.size === size" class="absolute top-3 right-3 w-2 h-2 bg-coffee-600 rounded-full animate-pulse"></div>
                    </button>
                  </div>
                </div>

                <div>
                  <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block ml-1">Sugar Level</label>
                  <div class="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner">
                    <button v-for="level in ['0%', '30%', '50%', '70%', '100%']" :key="level" @click="currentOptions.sugar = level"
                      :class="['flex-1 py-2.5 rounded-xl text-xs font-bold transition-all', currentOptions.sugar === level ? 'bg-white text-gray-900 shadow-sm scale-100' : 'text-gray-500 hover:text-gray-700 scale-95']">
                      {{ level }}
                    </button>
                  </div>
                </div>

                <div>
                  <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block ml-1">Ice Level</label>
                  <div class="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner">
                    <button v-for="ice in ['No Ice', 'Less', 'Normal', 'Extra']" :key="ice" @click="currentOptions.ice = ice"
                      :class="['flex-1 py-2.5 rounded-xl text-xs font-bold transition-all', currentOptions.ice === ice ? 'bg-white text-blue-600 shadow-sm scale-100' : 'text-gray-500 hover:text-gray-700 scale-95']">
                      {{ ice }}
                    </button>
                  </div>
                </div>
              </template>

              <template v-else-if="productGroupType === 'Food'">
                
                <div>
                  <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block ml-1">Preparation</label>
                  <div class="grid grid-cols-2 gap-4">
                    <button @click="currentOptions.temperature = 'Warm'" :class="['p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between', currentOptions.temperature === 'Warm' ? 'border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-500' : 'border-transparent bg-white text-gray-500 hover:bg-gray-50']">
                      <div><span class="block font-bold">Warm It Up</span><span class="text-xs opacity-70">Served hot & crispy</span></div>
                      <FireIcon class="w-6 h-6" />
                    </button>
                    <button @click="currentOptions.temperature = 'Room Temp'" :class="['p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between', currentOptions.temperature === 'Room Temp' ? 'border-gray-900 bg-gray-100 text-gray-900 ring-1 ring-gray-900' : 'border-transparent bg-white text-gray-500 hover:bg-gray-50']">
                      <div><span class="block font-bold">Room Temp</span><span class="text-xs opacity-70">As is, ready to eat</span></div>
                      <HandThumbUpIcon class="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div>
                  <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block ml-1">Need Cutlery?</label>
                  <div class="flex gap-3">
                    <button v-for="opt in ['Yes', 'No']" :key="opt" @click="currentOptions.cutlery = opt"
                      :class="['px-6 py-2.5 rounded-xl border-2 text-sm font-bold transition-all', currentOptions.cutlery === opt ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-500']">
                      {{ opt }}
                    </button>
                  </div>
                </div>
              </template>

              <div>
                <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block ml-1">Special Instructions</label>
                <textarea v-model="currentOptions.note" rows="2" placeholder="e.g. Allergy info, extra napkins..." class="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 outline-none resize-none transition-all shadow-sm placeholder:text-gray-300"></textarea>
              </div>
          </div>

          <div class="p-6 border-t border-gray-100 bg-white flex items-center justify-between gap-6 z-20">
             <div>
               <span class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Amount</span>
               <span class="text-2xl font-black text-gray-900">{{ formatCurrency(selectedProduct.price) }}</span>
             </div>
             <button @click="confirmMoveToCart" class="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-coffee-600 transition-all shadow-xl shadow-gray-200 active:scale-95 flex items-center justify-center gap-3">
               <span>Confirm & Move to Cart</span> <ArrowLongRightIcon class="w-5 h-5"/>
             </button>
          </div>

        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
/* Grid Animation */
.list-move, .list-enter-active, .list-leave-active { transition: all 0.5s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(30px); }
.list-leave-active { position: absolute; width: 100%; z-index: -1; }

/* Modal Animation */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.animate-zoom-in { animation: zoomIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes zoomIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }

/* Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
</style>