<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useMainStore } from '@/stores/mainStore'
import { 
  ShoppingBagIcon, XMarkIcon, MagnifyingGlassIcon, HeartIcon, 
  SparklesIcon, FireIcon, FunnelIcon, StarIcon as StarOutline, 
  GiftIcon, PlusIcon, ArrowRightIcon, TagIcon, ChevronDownIcon,
  AdjustmentsHorizontalIcon, HandThumbUpIcon
} from '@heroicons/vue/24/outline'
import { StarIcon as StarSolid, HeartIcon as HeartSolid } from '@heroicons/vue/24/solid'

const store = useMainStore()

// --- STATE ---
const selectedGroup = ref('') 
const selectedCategory = ref('All')
const selectedSubcategory = ref('All')
const searchQuery = ref('')
const selectedProduct = ref(null)
const newRating = ref(0)
const newComment = ref('')
const isScrollActive = ref(false)

// Default Options
const currentOptions = ref({
  size: 'Regular',    
  sugar: '100%',      
  ice: 'Normal',      
  temperature: 'Warm', 
  cutlery: 'No',      
  note: ''            
})

// --- LIFECYCLE ---
onMounted(async () => {
  await store.fetchProducts()
  await store.fetchCategories()
  window.addEventListener('scroll', handleScroll)
  if (distinctGroups.value.length > 0) selectedGroup.value = distinctGroups.value[0]
})

const handleScroll = () => { isScrollActive.value = window.scrollY > 20 }

// --- COMPUTED ---
const distinctGroups = computed(() => [...new Set(store.categories.map(c => c.group))])
const categoriesInGroup = computed(() => store.categories.filter(c => c.group === selectedGroup.value))

const currentSubcategories = computed(() => {
  if (selectedCategory.value === 'All') return []
  const catObj = store.categories.find(c => c.name === selectedCategory.value)
  return catObj && catObj.subcategories ? ['All', ...catObj.subcategories] : []
})

// 🟢 FIX: Filter out Inactive Products here
const filteredProducts = computed(() => {
  return store.products.filter(p => {
    // 1. Safety Check: If product is inactive, hide it immediately
    if (p.isActive === false) return false

    // 2. Search Filter
    if (searchQuery.value) return p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    // 3. Group/Category Filters
    const productCatObj = store.categories.find(c => c.name === p.category)
    if (!productCatObj || productCatObj.group !== selectedGroup.value) return false
    if (selectedCategory.value !== 'All' && p.category !== selectedCategory.value) return false
    if (selectedSubcategory.value !== 'All' && p.subcategory !== selectedSubcategory.value) return false
    
    return true
  })
})

// 🟢 FIX: Filter Featured Products too
const featuredProducts = computed(() => {
  return [...store.products]
    .filter(p => p.isActive !== false) // Only active items
    .sort((a, b) => store.getAverageRating(b.reviews) - store.getAverageRating(a.reviews))
    .slice(0, 3)
})

// Determine UI Group (For Modal Display Only)
const productGroupType = computed(() => {
  if (!selectedProduct.value) return 'Drinks'
  const cat = store.categories.find(c => c.name === selectedProduct.value.category)
  return cat ? cat.group : 'Drinks' 
})

// --- WATCHERS ---
watch(selectedGroup, () => { selectedCategory.value = 'All'; selectedSubcategory.value = 'All' })
watch(selectedCategory, () => { selectedSubcategory.value = 'All' })

// --- ACTIONS ---
const formatCurrency = (val) => `$${val.toFixed(2)}`

const openProductModal = (product) => { 
  selectedProduct.value = product
  newRating.value = 0
  newComment.value = ''
  
  // Reset UI Defaults
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

const handleAddToCart = (product) => { 
  store.addToCart(product, 1, currentOptions.value)
  selectedProduct.value = null 
}

const handleRedeem = (product) => { store.redeemReward(product); selectedProduct.value = null }
const toggleWishlist = (product) => store.toggleWishlist(product)
const scrollToMenu = () => { document.getElementById('menu-section').scrollIntoView({ behavior: 'smooth' }) }

const submitProductReview = async () => {
  if (newRating.value === 0) { store.showToast("Select a rating", "error"); return; }
  await store.addProductReview(selectedProduct.value.id || selectedProduct.value._id, newRating.value, newComment.value);
  newRating.value = 0; newComment.value = ''
}
</script>

<template>
  <div class="bg-[#FAFAFA] min-h-screen font-sans selection:bg-gray-900 selection:text-white pb-32">
    
    <div class="relative h-[500px] lg:h-[600px] overflow-hidden bg-gray-900 rounded-b-[50px] shadow-2xl">
      <div class="absolute inset-0 opacity-60">
        <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1600" class="w-full h-full object-cover animate-pan-zoom">
      </div>
      <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
      <div class="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-center items-center text-center">
        <div class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white font-bold text-xs uppercase tracking-[0.2em] mb-8 shadow-lg animate-fade-in-down">
          <SparklesIcon class="w-4 h-4 text-yellow-400" /> Premium Selection
        </div>
        <h1 class="text-5xl lg:text-8xl font-black text-white mb-8 leading-tight tracking-tight animate-fade-in-up drop-shadow-2xl">
          Crafted for <br>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">Perfection.</span>
        </h1>
        <button @click="scrollToMenu" class="bg-white text-gray-900 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.2)] transform hover:-translate-y-1 active:scale-95 animate-fade-in-up delay-100 flex items-center gap-2">
          View Menu <ChevronDownIcon class="w-5 h-5" />
        </button>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-16 -mt-20 relative z-20">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="product in featuredProducts" :key="product.id" @click="openProductModal(product)" class="group bg-white/90 backdrop-blur-md rounded-[2rem] p-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer flex gap-5 items-center border border-white/50 ring-1 ring-gray-100">
          <div class="w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-lg relative group-hover:scale-105 transition-transform">
            <img :src="product.image" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          </div>
          <div>
            <div class="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-orange-500 mb-1.5">
              <FireIcon class="w-3.5 h-3.5" /> Trending
            </div>
            <h3 class="font-extrabold text-gray-900 text-lg leading-tight line-clamp-1 mb-1">{{ product.name }}</h3>
            <p class="text-xs text-gray-500 line-clamp-1 mb-2">{{ product.desc }}</p>
            <div class="flex items-center gap-1 text-sm bg-yellow-50 px-2 py-1 rounded-lg w-fit">
              <StarSolid class="w-3.5 h-3.5 text-yellow-400" />
              <span class="font-bold text-gray-900">{{ store.getAverageRating(product.reviews) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="menu-section" class="pt-8">
      <div :class="['sticky top-0 z-30 transition-all duration-500 py-4', isScrollActive ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm' : 'bg-transparent']">
        <div class="max-w-7xl mx-auto px-6">
          <div class="flex flex-col gap-4">
            <div class="flex flex-col md:flex-row justify-between items-center gap-4">
              <div class="flex gap-1 bg-gray-200/60 p-1.5 rounded-2xl overflow-x-auto no-scrollbar w-full md:w-auto">
                <button v-for="group in distinctGroups" :key="group" @click="selectedGroup = group" 
                  :class="['px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all whitespace-nowrap flex-1 md:flex-none', 
                  selectedGroup === group ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900']">
                  {{ group }}
                </button>
              </div>
              <div class="relative w-full md:w-72 group">
                <MagnifyingGlassIcon class="w-5 h-5 text-gray-400 absolute left-4 top-3 transition group-focus-within:text-gray-900" />
                <input v-model="searchQuery" type="text" placeholder="Search menu..." class="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 transition text-sm font-bold shadow-sm">
              </div>
            </div>
            
            <div class="flex gap-3 overflow-x-auto pb-1 no-scrollbar items-center">
              <button @click="selectedCategory = 'All'" :class="['px-5 py-2.5 rounded-xl border text-sm font-bold transition-all whitespace-nowrap', selectedCategory === 'All' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400']">View All</button>
              <div class="w-[1px] h-6 bg-gray-300 mx-1"></div>
              <button v-for="cat in categoriesInGroup" :key="cat.id" @click="selectedCategory = cat.name" :class="['flex items-center gap-2 px-2 pr-4 py-1.5 rounded-xl border transition-all whitespace-nowrap group', selectedCategory === cat.name ? 'bg-white border-gray-900 ring-1 ring-gray-900' : 'bg-white border-gray-200 hover:border-gray-400']">
                <div class="w-8 h-8 rounded-lg overflow-hidden bg-gray-100"><img :src="cat.image || 'https://via.placeholder.com/150'" class="w-full h-full object-cover"></div>
                <span :class="['text-xs font-bold', selectedCategory === cat.name ? 'text-gray-900' : 'text-gray-600']">{{ cat.name }}</span>
              </button>
            </div>

            <div v-if="currentSubcategories.length > 1" class="flex gap-2 overflow-x-auto pb-1 no-scrollbar animate-fade-in-down border-t border-dashed border-gray-200 pt-3">
              <button v-for="sub in currentSubcategories" :key="sub" @click="selectedSubcategory = sub" :class="['px-4 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 whitespace-nowrap', selectedSubcategory === sub ? 'bg-gray-200 border-gray-200 text-gray-900' : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-50']">{{ sub }}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-6 mt-8">
        <div v-if="filteredProducts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 animate-fade-in">
          <div v-for="product in filteredProducts" :key="product.id" @click="openProductModal(product)" class="group relative cursor-pointer">
            <div class="relative h-60 rounded-[2rem] overflow-hidden shadow-md group-hover:shadow-2xl transition-all duration-500 bg-white">
              <img :src="product.image" class="w-full h-full object-cover group-hover:scale-110 transition duration-700">
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-40 transition-opacity"></div>
              <button @click.stop="toggleWishlist(product)" class="absolute top-3 right-3 z-10 w-9 h-9 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-red-500 transition-colors">
                <HeartSolid v-if="store.isInWishlist(product.id)" class="w-5 h-5 text-red-500" />
                <HeartIcon v-else class="w-5 h-5" />
              </button>
              <button class="absolute bottom-3 right-3 bg-white text-gray-900 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gray-900 hover:text-white">
                <PlusIcon class="w-5 h-5" />
              </button>
            </div>
            <div class="mt-3 px-2">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-bold text-gray-900 text-lg leading-tight line-clamp-1">{{ product.name }}</h3>
                <span class="text-lg font-black text-gray-900">{{ formatCurrency(product.price) }}</span>
              </div>
              <p class="text-xs text-gray-500 line-clamp-1 mb-2">{{ product.desc }}</p>
              <div class="flex items-center gap-1">
                <StarSolid class="w-3.5 h-3.5 text-yellow-400" />
                <span class="text-xs font-bold text-gray-900">{{ store.getAverageRating(product.reviews) }}</span>
                <span class="text-[10px] text-gray-400">({{ product.reviews.length }})</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-gray-200">
          <FunnelIcon class="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 class="text-lg font-bold text-gray-900">No items found</h3>
          <p class="text-gray-500 text-sm">Try changing filters or search.</p>
        </div>
      </div>
    </div>

    <transition name="pop">
      <div v-if="store.cart.length > 0" class="fixed bottom-8 right-6 z-40">
        <router-link to="/checkout" class="flex items-center gap-4 bg-gray-900 text-white p-2.5 pr-8 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:scale-105 transition-all duration-300 active:scale-95 border border-white/10 backdrop-blur-sm group">
          <div class="bg-white text-gray-900 w-12 h-12 rounded-full flex items-center justify-center text-lg font-black shadow-lg">
            {{ store.cartTotalQuantity }}
          </div>
          <div class="flex flex-col items-start">
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-white transition-colors">Checkout</span>
            <span class="text-xl font-black leading-none">{{ formatCurrency(store.cartTotalValue) }}</span>
          </div>
          <ArrowRightIcon class="w-6 h-6 ml-2 text-yellow-400 animate-pulse" />
        </router-link>
      </div>
    </transition>

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
                      :class="['flex-1 py-2.5 rounded-xl text-xs font-bold transition-all', currentOptions.sugar === level ? 'bg-white text-gray-900 shadow-sm scale-100' : 'text-gray-500 hover:text-gray-700 scale-95']">{{ level }}</button>
                  </div>
                </div>
                <div>
                  <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block ml-1">Ice Level</label>
                  <div class="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner">
                    <button v-for="ice in ['No Ice', 'Less', 'Normal', 'Extra']" :key="ice" @click="currentOptions.ice = ice"
                      :class="['flex-1 py-2.5 rounded-xl text-xs font-bold transition-all', currentOptions.ice === ice ? 'bg-white text-blue-600 shadow-sm scale-100' : 'text-gray-500 hover:text-gray-700 scale-95']">{{ ice }}</button>
                  </div>
                </div>
              </template>

              <template v-else-if="productGroupType === 'Food'">
                <div>
                  <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block ml-1">Preparation</label>
                  <div class="grid grid-cols-2 gap-4">
                    <button @click="currentOptions.temperature = 'Warm'" :class="['p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between', currentOptions.temperature === 'Warm' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-transparent bg-white text-gray-500 hover:bg-gray-50']">
                      <div><span class="block font-bold">Warm It Up</span><span class="text-xs opacity-70">Served hot</span></div>
                      <FireIcon class="w-6 h-6" />
                    </button>
                    <button @click="currentOptions.temperature = 'Room Temp'" :class="['p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between', currentOptions.temperature === 'Room Temp' ? 'border-gray-900 bg-gray-100 text-gray-900' : 'border-transparent bg-white text-gray-500 hover:bg-gray-50']">
                      <div><span class="block font-bold">Room Temp</span><span class="text-xs opacity-70">Ready to eat</span></div>
                      <HandThumbUpIcon class="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <div>
                  <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block ml-1">Need Cutlery?</label>
                  <div class="flex gap-3">
                    <button v-for="opt in ['Yes', 'No']" :key="opt" @click="currentOptions.cutlery = opt"
                      :class="['px-8 py-3 rounded-2xl border-2 text-sm font-bold transition-all', currentOptions.cutlery === opt ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200']">{{ opt }}</button>
                  </div>
                </div>
              </template>

              <div>
                <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block ml-1">Special Instructions</label>
                <textarea v-model="currentOptions.note" rows="2" placeholder="e.g. Allergy info, extra napkins..." class="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 outline-none resize-none transition-all shadow-sm placeholder:text-gray-300"></textarea>
              </div>

              <div>
                <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block ml-1 flex items-center gap-2">
                  <TagIcon class="w-4 h-4" /> Customer Reviews
                </label>
                
                <div v-if="selectedProduct.reviews.length === 0" class="text-center py-6 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">No reviews yet. Be the first!</div>
                <div v-else class="space-y-3 mb-4">
                  <div v-for="(review, idx) in selectedProduct.reviews" :key="idx" class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div class="flex justify-between items-center mb-1">
                      <span class="font-bold text-xs text-gray-900">{{ review.user }}</span>
                      <div class="flex text-yellow-400 gap-0.5"><StarSolid v-for="n in review.rating" :key="n" class="w-3 h-3" /></div>
                    </div>
                    <p class="text-sm text-gray-600">{{ review.comment }}</p>
                  </div>
                </div>

                <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm focus-within:ring-2 focus-within:ring-coffee-600/20 transition">
                   <div class="flex gap-2 mb-3">
                     <StarSolid v-for="i in 5" :key="i" @click="newRating = i" 
                        :class="['w-6 h-6 cursor-pointer transition transform hover:scale-110', i <= newRating ? 'text-yellow-400' : 'text-gray-200']" />
                   </div>
                   <div class="flex gap-2">
                     <input v-model="newComment" placeholder="Write a review..." class="flex-1 text-sm bg-transparent outline-none">
                     <button @click="submitProductReview" class="text-xs font-bold text-white bg-gray-900 px-4 py-2 rounded-xl hover:bg-gray-700 transition">Post</button>
                   </div>
                </div>
              </div>

          </div>

          <div class="p-6 border-t border-gray-100 bg-white flex items-center justify-between gap-6 z-20">
             
             <div v-if="store.loyaltyPoints >= 100 && selectedProduct.price <= 2.5" class="flex-1 bg-gradient-to-r from-amber-50 to-yellow-50 p-2.5 rounded-xl border border-amber-100 flex items-center justify-between">
                 <span class="text-xs font-bold text-amber-800 flex items-center gap-1.5"><GiftIcon class="w-4 h-4"/> Use {{ store.loyaltyPoints }} pts</span>
                 <button @click="handleRedeem(selectedProduct)" class="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-600 transition shadow-sm">Claim Free</button>
             </div>

             <div v-else class="flex flex-1 items-center justify-between gap-6">
                 <div>
                   <span class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Amount</span>
                   <span class="text-2xl font-black text-gray-900">{{ formatCurrency(selectedProduct.price) }}</span>
                 </div>
                 <button @click="handleAddToCart(selectedProduct)" class="bg-gray-900 text-white py-4 px-8 rounded-2xl font-bold text-sm hover:bg-coffee-600 transition-all shadow-xl shadow-gray-200 active:scale-95 flex items-center justify-center gap-3">
                   <span>Add to Order</span> <ArrowRightIcon class="w-5 h-5"/>
                 </button>
             </div>

          </div>

        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
.animate-pan-zoom { animation: panZoom 20s infinite alternate linear; }
@keyframes panZoom { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }
.animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(40px); }
@keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.animate-zoom-in { animation: zoomIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes zoomIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.pop-enter-active { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes popIn { from { transform: scale(0) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>