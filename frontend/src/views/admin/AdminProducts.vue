<script setup>
import { ref, reactive, computed } from 'vue'
import { useMainStore } from '@/stores/mainStore'
import { 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  XMarkIcon, 
  Squares2X2Icon, 
  ListBulletIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  TagIcon,
  FunnelIcon // Added Icon
} from '@heroicons/vue/24/outline'

const store = useMainStore()

// State
const showModal = ref(false)
const showDeleteModal = ref(false)
const productToDelete = ref(null)
const isEditing = ref(false)
const viewMode = ref('grid') 
const searchQuery = ref('')
const selectedFilterCategory = ref('All') // New Filter State

const categories = ['Coffee', 'Tea', 'Snacks', 'Desserts']
const filterCategories = ['All', ...categories] // For the tabs

// Form Data
const form = reactive({ 
  id: null, 
  name: '', 
  category: 'Coffee', 
  price: '', 
  image: '', 
  desc: '' 
})

// --- UPDATED COMPUTED PROPERTY ---
const filteredProducts = computed(() => {
  return store.products.filter(p => {
    // 1. Filter by Category Tab
    const matchesCategory = selectedFilterCategory.value === 'All' || p.category === selectedFilterCategory.value
    
    // 2. Filter by Search Query (Name)
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    return matchesCategory && matchesSearch
  })
})

// --- ACTIONS ---

const openAdd = () => {
  isEditing.value = false
  Object.assign(form, { id: Date.now(), name: '', category: 'Coffee', price: '', image: '', desc: '' })
  showModal.value = true
}

const openEdit = (p) => {
  isEditing.value = true
  Object.assign(form, p)
  showModal.value = true
}

const handleSave = () => {
  if (!form.name || !form.price) {
    store.showToast('Please fill in Name and Price.', 'error')
    return
  }

  const payload = { ...form, price: parseFloat(form.price) }

  if (isEditing.value) {
    const idx = store.products.findIndex(p => p.id === payload.id)
    if (idx !== -1) {
      store.products[idx] = payload
      store.saveToStorage()
      store.showToast('Product updated successfully!', 'success')
    }
  } else {
    store.addProduct(payload)
    store.showToast('New product created!', 'success')
  }
  
  showModal.value = false
}

const promptDelete = (id) => {
  productToDelete.value = id
  showDeleteModal.value = true
}

const confirmDelete = () => {
  if (productToDelete.value) {
    store.deleteProduct(productToDelete.value)
    store.showToast('Product deleted.', 'info')
    showDeleteModal.value = false
    productToDelete.value = null
  }
}

const formatCurrency = (val) => `$${parseFloat(val).toFixed(2)}`
</script>

<template>
  <div class="space-y-8 animate-fade-in pb-20">
    
    <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-6">
      
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight">Menu Manager</h2>
          <p class="text-gray-500 text-sm mt-1">Manage your product catalog.</p>
        </div>

        <button 
          @click="openAdd" 
          class="flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-coffee-600 transition shadow-lg shadow-gray-200 active:scale-95"
        >
          <PlusIcon class="w-5 h-5" /> Add New Item
        </button>
      </div>

      <div class="flex flex-col md:flex-row gap-4 items-center justify-between border-t border-gray-100 pt-6">
        
        <div class="flex bg-gray-100/80 p-1.5 rounded-xl overflow-x-auto no-scrollbar w-full md:w-auto">
           <button 
             v-for="cat in filterCategories" 
             :key="cat"
             @click="selectedFilterCategory = cat"
             :class="['px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap', 
               selectedFilterCategory === cat ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900']"
           >
             {{ cat }}
           </button>
        </div>

        <div class="flex gap-3 w-full md:w-auto">
          <div class="relative flex-grow md:w-64">
            <MagnifyingGlassIcon class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Search items..." 
              class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 rounded-xl outline-none text-sm transition-all font-medium"
            >
          </div>

          <div class="flex bg-gray-100 p-1 rounded-xl shrink-0">
            <button @click="viewMode = 'grid'" :class="['p-2 rounded-lg transition-all', viewMode === 'grid' ? 'bg-white shadow text-coffee-600' : 'text-gray-400 hover:text-gray-600']">
              <Squares2X2Icon class="w-5 h-5" />
            </button>
            <button @click="viewMode = 'list'" :class="['p-2 rounded-lg transition-all', viewMode === 'list' ? 'bg-white shadow text-coffee-600' : 'text-gray-400 hover:text-gray-600']">
              <ListBulletIcon class="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>

    <div v-if="filteredProducts.length === 0" class="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
      <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
        <FunnelIcon class="w-10 h-10" />
      </div>
      <h3 class="text-xl font-bold text-gray-900">No items found</h3>
      <p class="text-gray-500 mt-1">Try changing the category filter or search term.</p>
      <button @click="selectedFilterCategory = 'All'; searchQuery = ''" class="mt-6 text-coffee-600 font-bold hover:underline">Clear Filters</button>
    </div>

    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div 
        v-for="product in filteredProducts" 
        :key="product.id" 
        class="group bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
      >
        <div class="h-56 overflow-hidden relative bg-gray-100">
          <img 
            :src="product.image" 
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            @error="$event.target.src='https://via.placeholder.com/300?text=No+Image'" 
          >
          <div class="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold shadow-sm uppercase tracking-wide text-coffee-700">
            {{ product.category }}
          </div>
        </div>

        <div class="p-6 flex-1 flex flex-col">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-bold text-gray-900 text-lg leading-tight line-clamp-1" :title="product.name">{{ product.name }}</h3>
            <span class="text-coffee-600 font-extrabold text-lg">{{ formatCurrency(product.price) }}</span>
          </div>
          <p class="text-sm text-gray-500 mb-6 line-clamp-2 h-10">{{ product.desc }}</p>
          
          <div class="mt-auto flex gap-2 pt-4 border-t border-gray-50">
            <button 
              @click="openEdit(product)" 
              class="flex-1 bg-gray-50 text-gray-600 py-2.5 rounded-xl text-sm font-bold hover:bg-coffee-50 hover:text-coffee-600 transition flex items-center justify-center gap-2"
            >
              <PencilSquareIcon class="w-4 h-4" /> Edit
            </button>
            <button 
              @click="promptDelete(product.id)" 
              class="px-4 bg-white border border-gray-200 text-red-400 rounded-xl hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition"
            >
              <TrashIcon class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-gray-50/50 border-b border-gray-100 text-xs uppercase text-gray-400 font-bold tracking-wider">
            <tr>
              <th class="px-6 py-4">Product</th>
              <th class="px-6 py-4">Category</th>
              <th class="px-6 py-4">Description</th>
              <th class="px-6 py-4">Price</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="product in filteredProducts" :key="product.id" class="hover:bg-gray-50/50 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-4">
                  <img :src="product.image" class="w-12 h-12 rounded-xl object-cover bg-gray-100 border border-gray-100">
                  <span class="font-bold text-gray-900">{{ product.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wide">
                  {{ product.category }}
                </span>
              </td>
              <td class="px-6 py-4 max-w-xs">
                <p class="text-sm text-gray-500 truncate">{{ product.desc }}</p>
              </td>
              <td class="px-6 py-4">
                <span class="font-bold text-gray-900">{{ formatCurrency(product.price) }}</span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="openEdit(product)" class="p-2 text-gray-400 hover:text-coffee-600 hover:bg-coffee-50 rounded-lg transition">
                    <PencilSquareIcon class="w-5 h-5" />
                  </button>
                  <button @click="promptDelete(product.id)" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                    <TrashIcon class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <transition name="modal">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" @click="showModal = false"></div>
        
        <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 p-8 transform transition-all scale-100">
          <div class="flex justify-between items-center mb-8">
            <div>
              <h3 class="text-2xl font-extrabold text-gray-900">{{ isEditing ? 'Edit Item' : 'New Item' }}</h3>
              <p class="text-gray-500 text-sm">Fill in the details below.</p>
            </div>
            <button @click="showModal = false" class="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-600">
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>
          
          <form @submit.prevent="handleSave" class="space-y-5">
            <div>
              <label class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <TagIcon class="w-3 h-3" /> Product Name
              </label>
              <input v-model="form.name" type="text" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 transition font-medium">
            </div>
            
            <div class="grid grid-cols-2 gap-5">
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
                <div class="relative">
                  <select v-model="form.category" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 transition font-medium appearance-none cursor-pointer">
                    <option v-for="c in categories" :key="c">{{ c }}</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
              <div>
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <CurrencyDollarIcon class="w-3 h-3" /> Price
                </label>
                <input v-model="form.price" type="number" step="0.01" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 transition font-medium">
              </div>
            </div>

            <div>
              <label class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <PhotoIcon class="w-3 h-3" /> Image URL
              </label>
              <input v-model="form.image" type="text" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 transition font-medium text-sm">
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
              <textarea v-model="form.desc" rows="3" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 transition font-medium resize-none text-sm"></textarea>
            </div>

            <div class="pt-4 border-t border-gray-100 flex justify-end gap-3">
              <button type="button" @click="showModal = false" class="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition">Cancel</button>
              <button class="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-coffee-600 transition shadow-lg shadow-gray-200 active:scale-95">
                {{ isEditing ? 'Save Changes' : 'Create Item' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <transition name="modal">
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" @click="showDeleteModal = false"></div>
        
        <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl relative z-10 p-6 transform transition-all scale-100">
          <div class="w-14 h-14 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon class="w-8 h-8" />
          </div>
          
          <h3 class="text-xl font-extrabold text-center text-gray-900 mb-2">Delete this product?</h3>
          <p class="text-center text-gray-500 text-sm mb-8">
            This action is permanent. The item will be removed from the menu immediately.
          </p>
          
          <div class="grid grid-cols-2 gap-3">
            <button 
              @click="showDeleteModal = false" 
              class="py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button 
              @click="confirmDelete" 
              class="py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition transform active:scale-95"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .transform, .modal-leave-active .transform { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-enter-from .transform { transform: scale(0.95) translateY(10px); opacity: 0; }

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>