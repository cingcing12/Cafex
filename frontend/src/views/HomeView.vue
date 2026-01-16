<script setup>
import { ref, computed } from 'vue'
import { useMainStore } from '@/stores/mainStore'
import { 
  ShoppingBagIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  HeartIcon, 
  ArrowDownIcon,
  SparklesIcon,
  TruckIcon,
  ShieldCheckIcon,
  FireIcon
} from '@heroicons/vue/24/outline'
import { 
  StarIcon as StarSolid, 
  HeartIcon as HeartSolid 
} from '@heroicons/vue/24/solid'

const store = useMainStore()
const selectedCategory = ref('All')
const searchQuery = ref('')
const selectedProduct = ref(null)
const newRating = ref(0)
const newComment = ref('')
const email = ref('')

const categories = ['All', 'Coffee', 'Tea', 'Snacks', 'Desserts']

// --- COMPUTED ---

const filteredProducts = computed(() => {
  return store.products.filter(p => {
    const matchesCategory = selectedCategory.value === 'All' || p.category === selectedCategory.value
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesCategory && matchesSearch
  })
})

// Get top 3 rated products for "Trending" section
const featuredProducts = computed(() => {
  return [...store.products]
    .sort((a, b) => store.getAverageRating(b.reviews) - store.getAverageRating(a.reviews))
    .slice(0, 3)
})

// --- ACTIONS ---

const formatCurrency = (val) => `$${val.toFixed(2)}`

const openProductModal = (product) => {
  selectedProduct.value = product
  newRating.value = 0
  newComment.value = ''
}

const submitProductReview = () => {
  if (newRating.value === 0) return
  store.addProductReview(selectedProduct.value.id, newRating.value, newComment.value)
  newRating.value = 0
  newComment.value = ''
}

const handleAddToCart = (product) => {
  store.addToCart(product)
}

const toggleWishlist = (product) => {
  store.toggleWishlist(product)
}

const scrollToMenu = () => {
  document.getElementById('menu-section').scrollIntoView({ behavior: 'smooth' })
}

const subscribeNewsletter = () => {
  if(email.value) {
    store.showToast('Subscribed successfully!', 'success')
    email.value = ''
  }
}
</script>

<template>
  <div class="bg-gray-50 min-h-screen font-sans">
    
    <div class="relative bg-gray-900 h-[600px] flex items-center overflow-hidden">
      <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600" class="absolute inset-0 w-full h-full object-cover opacity-50">
      <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-black/60"></div>
      
      <div class="relative z-10 max-w-7xl mx-auto px-4 w-full text-center md:text-left">
        <div class="max-w-3xl animate-fade-in-up">
          <span class="inline-block py-1 px-3 rounded-full bg-coffee-600/20 border border-coffee-500/50 text-coffee-400 font-bold tracking-widest uppercase text-xs mb-4 backdrop-blur-sm">
            Premium Quality
          </span>
          <h1 class="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg">
            Taste the <br> <span class="text-transparent bg-clip-text bg-gradient-to-r from-coffee-400 to-amber-200">Extraordinary</span>
          </h1>
          <p class="text-gray-200 text-lg mb-8 max-w-lg leading-relaxed md:mx-0 mx-auto">
            Experience coffee crafted with passion. From the farm to your cup, we ensure every sip is a journey of flavor.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button @click="scrollToMenu" class="bg-coffee-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-coffee-500 transition shadow-lg shadow-coffee-900/50 hover:scale-105 active:scale-95 duration-200">
              Order Now
            </button>
            <button class="px-8 py-4 rounded-full font-bold text-lg text-white border border-white/30 hover:bg-white/10 transition backdrop-blur-sm">
              Our Story
            </button>
          </div>
        </div>
      </div>

      <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce text-white/50">
        <ArrowDownIcon class="w-8 h-8" />
      </div>
    </div>

    <div class="bg-white py-12 border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div class="p-6 rounded-2xl hover:bg-gray-50 transition duration-300">
          <div class="w-14 h-14 bg-coffee-50 text-coffee-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <SparklesIcon class="w-7 h-7" />
          </div>
          <h3 class="font-bold text-gray-900 text-lg mb-2">Premium Beans</h3>
          <p class="text-gray-500 text-sm">Sourced from the best sustainable farms worldwide.</p>
        </div>
        <div class="p-6 rounded-2xl hover:bg-gray-50 transition duration-300">
          <div class="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <TruckIcon class="w-7 h-7" />
          </div>
          <h3 class="font-bold text-gray-900 text-lg mb-2">Fast Delivery</h3>
          <p class="text-gray-500 text-sm">Fresh hot coffee delivered to your door in minutes.</p>
        </div>
        <div class="p-6 rounded-2xl hover:bg-gray-50 transition duration-300">
          <div class="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheckIcon class="w-7 h-7" />
          </div>
          <h3 class="font-bold text-gray-900 text-lg mb-2">Quality Guarantee</h3>
          <p class="text-gray-500 text-sm">Not satisfied? We will remake your drink for free.</p>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-16">
      <div class="flex items-center gap-2 mb-8">
        <FireIcon class="w-6 h-6 text-orange-500" />
        <h2 class="text-2xl font-bold text-gray-900">Trending Now</h2>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="product in featuredProducts" :key="product.id" class="relative group cursor-pointer overflow-hidden rounded-3xl h-64 md:h-80" @click="openProductModal(product)">
          <img :src="product.image" class="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-110">
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div class="absolute bottom-0 left-0 p-6 text-white w-full">
            <div class="flex justify-between items-end">
              <div>
                <span class="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded mb-2 inline-block">HOT</span>
                <h3 class="text-2xl font-bold">{{ product.name }}</h3>
                <p class="text-gray-300 text-sm line-clamp-1">{{ product.desc }}</p>
              </div>
              <button class="bg-white text-gray-900 p-3 rounded-full hover:bg-gray-200 transition">
                <ShoppingBagIcon class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="menu-section" class="bg-gray-100/50 py-16">
      <div class="max-w-7xl mx-auto px-4">
        
        <div class="text-center mb-12">
          <h2 class="text-3xl font-extrabold text-gray-900">Our Menu</h2>
          <p class="text-gray-500 mt-2">Discover your new favorite drink.</p>
        </div>

        <div class="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div class="flex flex-wrap justify-center gap-2">
            <button 
              v-for="cat in categories" 
              :key="cat"
              @click="selectedCategory = cat"
              :class="['px-5 py-2 rounded-full text-sm font-bold transition-all duration-300', 
                selectedCategory === cat ? 'bg-gray-900 text-white shadow-lg transform scale-105' : 'bg-gray-50 text-gray-600 hover:bg-gray-200']"
            >
              {{ cat }}
            </button>
          </div>

          <div class="relative w-full md:w-72">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Search items..." 
              class="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-coffee-500 outline-none transition-all"
            >
            <MagnifyingGlassIcon class="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <div v-for="product in filteredProducts" :key="product.id" class="group bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden relative flex flex-col">
            
            <div @click="openProductModal(product)" class="h-60 overflow-hidden bg-gray-100 cursor-pointer relative">
              <img :src="product.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              
              <div v-if="store.getAverageRating(product.reviews) >= 4.5" class="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                TOP RATED
              </div>

              <button 
                @click.stop="toggleWishlist(product)" 
                class="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur rounded-full shadow-sm hover:bg-white transition z-10"
              >
                <HeartSolid v-if="store.isInWishlist(product.id)" class="w-5 h-5 text-red-500 transition-colors" />
                <HeartIcon v-else class="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors" />
              </button>

              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                <span class="bg-white/90 text-gray-900 text-sm font-bold px-6 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 backdrop-blur-md">
                  Quick View
                </span>
              </div>
            </div>

            <div class="p-6 flex-1 flex flex-col">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <span class="text-[10px] font-bold text-coffee-600 uppercase tracking-wide bg-coffee-50 px-2 py-1 rounded">{{ product.category }}</span>
                  <h3 class="font-bold text-gray-900 text-lg leading-tight mt-2 group-hover:text-coffee-600 transition-colors cursor-pointer" @click="openProductModal(product)">
                    {{ product.name }}
                  </h3>
                </div>
                <span class="font-extrabold text-xl text-gray-900">{{ formatCurrency(product.price) }}</span>
              </div>
              
              <div class="flex items-center gap-1 mb-4">
                 <StarSolid class="w-4 h-4 text-yellow-400" /> 
                 <span class="font-bold text-gray-900 text-sm">{{ store.getAverageRating(product.reviews) }}</span>
                 <span class="text-xs text-gray-400">({{ product.reviews.length }} reviews)</span>
              </div>

              <button 
                @click="handleAddToCart(product)" 
                class="mt-auto w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-coffee-600 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBagIcon class="w-5 h-5" /> Add to Cart
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="filteredProducts.length === 0" class="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 mt-8">
          <div class="text-6xl mb-4 grayscale opacity-50">☕</div>
          <h3 class="text-2xl font-bold text-gray-900">No items found</h3>
          <p class="text-gray-500 mt-2">Try changing your filter or search term.</p>
          <button @click="selectedCategory = 'All'; searchQuery = ''" class="mt-6 text-coffee-600 font-bold hover:underline">
            Clear Filters
          </button>
        </div>
      </div>
    </div>

    <div class="bg-gray-900 text-white py-16 relative overflow-hidden">
      <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      <div class="max-w-4xl mx-auto px-4 text-center relative z-10">
        <h2 class="text-3xl md:text-4xl font-extrabold mb-4">Join the Coffee Club</h2>
        <p class="text-gray-300 mb-8 max-w-xl mx-auto">Subscribe to our newsletter and get 10% off your first order, plus updates on new beans and events.</p>
        
        <div class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input 
            v-model="email" 
            type="email" 
            placeholder="Enter your email" 
            class="flex-1 px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:bg-white/20 outline-none transition"
          >
          <button @click="subscribeNewsletter" class="bg-coffee-600 px-8 py-4 rounded-full font-bold hover:bg-coffee-500 transition shadow-lg shadow-coffee-900/50">
            Subscribe
          </button>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="selectedProduct" class="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" @click="selectedProduct = null"></div>
        
        <div class="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 grid md:grid-cols-2 shadow-2xl overflow-hidden animate-zoom-in">
          
          <button @click="selectedProduct = null" class="absolute top-4 right-4 bg-white/80 hover:bg-white rounded-full p-2 z-20 backdrop-blur transition-colors">
            <XMarkIcon class="w-6 h-6 text-gray-900" />
          </button>

          <div class="h-64 md:h-auto bg-gray-100 relative">
            <img :src="selectedProduct.image" class="w-full h-full object-cover">
          </div>

          <div class="p-8 md:p-10 flex flex-col h-full">
            <div class="flex-1">
              <span class="text-coffee-600 text-sm font-bold uppercase tracking-wide">{{ selectedProduct.category }}</span>
              <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2 mt-1">{{ selectedProduct.name }}</h2>
              
              <div class="flex items-center gap-2 mb-6">
                <div class="flex text-yellow-400">
                  <StarSolid v-for="i in 5" :key="i" class="w-5 h-5" :class="i <= Math.round(store.getAverageRating(selectedProduct.reviews)) ? 'text-yellow-400' : 'text-gray-200'" />
                </div>
                <span class="text-gray-500 text-sm font-medium">{{ selectedProduct.reviews.length }} Reviews</span>
              </div>
              
              <p class="text-gray-600 leading-relaxed text-lg mb-6">{{ selectedProduct.desc }}</p>
            </div>

            <div class="mt-auto pt-6 border-t border-gray-100">
               <div class="flex items-center justify-between mb-8">
                 <div>
                   <span class="block text-gray-400 text-xs font-bold uppercase">Price</span>
                   <span class="text-3xl font-extrabold text-coffee-600">{{ formatCurrency(selectedProduct.price) }}</span>
                 </div>
                 <button 
                   @click="handleAddToCart(selectedProduct); selectedProduct = null" 
                   class="bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold text-lg hover:bg-coffee-600 transition shadow-xl active:scale-95"
                 >
                   Add to Order
                 </button>
               </div>

               <div class="bg-gray-50 rounded-xl p-5 border border-gray-100">
                 <h3 class="font-bold text-sm mb-3 text-gray-900">Write a Review</h3>
                 <div class="flex gap-2 mb-3">
                   <StarSolid v-for="i in 5" :key="i" @click="newRating = i" :class="['w-6 h-6 cursor-pointer transition-colors', i <= newRating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200']" />
                 </div>
                 <div class="flex gap-2">
                   <input v-model="newComment" type="text" placeholder="Your thoughts..." class="w-full text-sm border-none bg-white rounded-lg px-3 py-2 shadow-sm focus:ring-2 ring-coffee-500 outline-none">
                   <button @click="submitProductReview" class="text-xs bg-gray-900 text-white px-4 rounded-lg font-bold hover:bg-gray-800 transition">Post</button>
                 </div>
                 
                 <div v-if="selectedProduct.reviews.length > 0" class="mt-4 pt-4 border-t border-gray-200 max-h-32 overflow-y-auto space-y-3 custom-scrollbar">
                    <div v-for="r in selectedProduct.reviews.slice().reverse()" :key="r.id" class="text-sm">
                        <div class="flex justify-between items-center">
                            <span class="font-bold text-gray-900">{{ r.user }}</span>
                            <span class="text-yellow-500 text-xs font-bold">★ {{ r.rating }}</span>
                        </div>
                        <p class="text-gray-500 text-xs mt-0.5">{{ r.comment }}</p>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes fadeInUp {
  to { opacity: 1; transform: translateY(0); }
}

.animate-zoom-in { animation: zoomIn 0.3s ease-out; }
@keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

/* Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
</style>