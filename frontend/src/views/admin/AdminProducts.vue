<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useMainStore } from '@/stores/mainStore'
import { 
  PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, 
  Squares2X2Icon, ListBulletIcon, MagnifyingGlassIcon, 
  PhotoIcon, ExclamationTriangleIcon, CubeIcon, ArchiveBoxIcon,
  PowerIcon // 🟢 Imported PowerIcon for the modal
} from '@heroicons/vue/24/outline'

const store = useMainStore()

// State
const showModal = ref(false)
const showDeleteModal = ref(false)
const showStatusModal = ref(false) // 🟢 NEW: State for Status Modal
const productToDelete = ref(null)
const productToToggle = ref(null) // 🟢 NEW: Track which product to toggle
const isEditing = ref(false)
const viewMode = ref('grid') 
const searchQuery = ref('')
const selectedGroup = ref('All')
const selectedCategory = ref('All')
const selectedSubFilter = ref('All') 
const isScrollActive = ref(false)

// File State
const fileInput = ref(null)
const selectedFile = ref(null)
const imagePreview = ref(null)

onMounted(async () => {
  await store.fetchProducts()
  await store.fetchCategories() 
  window.addEventListener('scroll', () => { isScrollActive.value = window.scrollY > 20 })
})

// Form Data
const form = reactive({ 
  id: null, name: '', category: '', subcategory: '', price: '', desc: '' 
})

// --- COMPUTED ---
const distinctGroups = computed(() => ['All', ...new Set(store.categories.map(c => c.group))])

const filteredCategories = computed(() => {
  if (selectedGroup.value === 'All') return store.categories
  return store.categories.filter(c => c.group === selectedGroup.value)
})

const filterSubcategories = computed(() => {
  if (selectedCategory.value === 'All') return []
  const cat = store.categories.find(c => c.name === selectedCategory.value)
  return cat && cat.subcategories ? ['All', ...cat.subcategories] : []
})

const filteredProducts = computed(() => {
  return store.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    if (!matchesSearch) return false
    
    if (selectedGroup.value !== 'All') {
      const catObj = store.categories.find(c => c.name === p.category)
      if (!catObj || catObj.group !== selectedGroup.value) return false
    }
    
    if (selectedCategory.value !== 'All' && p.category !== selectedCategory.value) return false
    if (selectedSubFilter.value !== 'All' && p.subcategory !== selectedSubFilter.value) return false

    return true
  })
})

const availableSubcategories = computed(() => {
  const cat = store.categories.find(c => c.name === form.category)
  return cat ? (cat.subcategories || []) : []
})

watch(selectedGroup, () => { selectedCategory.value = 'All'; selectedSubFilter.value = 'All' })
watch(selectedCategory, () => { selectedSubFilter.value = 'All' })

watch(() => form.category, () => {
  const cat = store.categories.find(c => c.name === form.category)
  const subs = cat ? (cat.subcategories || []) : []
  if (!subs.includes(form.subcategory)) { form.subcategory = '' }
})

// --- ACTIONS ---
const openAdd = () => {
  isEditing.value = false
  Object.assign(form, { id: null, name: '', category: '', subcategory: '', price: '', desc: '' })
  selectedFile.value = null; imagePreview.value = null; showModal.value = true
}

const openEdit = (p) => {
  isEditing.value = true
  Object.assign(form, { ...p, subcategory: p.subcategory || '' })
  imagePreview.value = p.image || null; selectedFile.value = null; showModal.value = true
}

const triggerFileInput = () => fileInput.value.click()
const handleFileChange = (e) => { const f = e.target.files[0]; if(f) { selectedFile.value = f; imagePreview.value = URL.createObjectURL(f) } }

const handleSave = async () => {
  if (!form.name || !form.price || !form.category) { store.showToast('Please fill required fields.', 'error'); return }
  const fd = new FormData(); fd.append('name', form.name); fd.append('category', form.category); fd.append('subcategory', form.subcategory); fd.append('price', form.price); fd.append('desc', form.desc);
  if (selectedFile.value) fd.append('image', selectedFile.value)
  const success = isEditing.value ? await store.updateProduct(form.id, fd) : await store.addProduct(fd)
  if (success) showModal.value = false
}

const promptDelete = (id) => { productToDelete.value = id; showDeleteModal.value = true }
const confirmDelete = async () => { if(productToDelete.value) { await store.deleteProduct(productToDelete.value); showDeleteModal.value = false; productToDelete.value = null } }
const formatCurrency = (val) => `$${parseFloat(val).toFixed(2)}`

// 🟢 NEW: PROMPT STATUS CHANGE
const promptToggleStatus = (product) => {
  productToToggle.value = product
  showStatusModal.value = true
}

// 🟢 NEW: EXECUTE STATUS CHANGE
const confirmToggleStatus = async () => {
  if (productToToggle.value) {
    await store.toggleProductActive(productToToggle.value.id, !productToToggle.value.isActive)
    showStatusModal.value = false
    productToToggle.value = null
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFC] pb-32 font-sans selection:bg-gray-900 selection:text-white">
    
    <div class="relative bg-gray-900 pt-10 pb-20 px-6 overflow-hidden">
      <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div class="absolute inset-0 bg-gradient-to-b from-transparent to-[#F8FAFC]"></div>
      
      <div class="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div class="flex items-center gap-2 text-indigo-300 mb-2 text-xs font-bold tracking-widest uppercase">
            <CubeIcon class="w-4 h-4" /> Management
          </div>
          <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Product <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-white">Hub</span>
          </h1>
        </div>
        <button @click="openAdd" class="bg-white text-gray-900 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-50 transition shadow-[0_10px_20px_rgba(255,255,255,0.1)] flex items-center gap-2 transform hover:-translate-y-1 active:scale-95">
          <PlusIcon class="w-5 h-5" /> Add New
        </button>
      </div>
    </div>

    <div :class="['sticky top-0 z-30 transition-all duration-300 -mt-10 px-4 md:px-8', isScrollActive ? 'py-3' : '']">
      <div :class="['max-w-7xl mx-auto bg-white/90 backdrop-blur-xl rounded-[1.5rem] border border-white/20 p-4 shadow-xl transition-all duration-300', isScrollActive ? 'shadow-lg border-gray-200/50' : 'shadow-2xl']">
        
        <div class="flex flex-col gap-3">
          <div class="flex flex-row gap-3 items-center">
            <div class="relative flex-1 group">
              <MagnifyingGlassIcon class="w-5 h-5 text-gray-400 absolute left-3 top-2.5 transition group-focus-within:text-indigo-600" />
              <input v-model="searchQuery" type="text" placeholder="Search..." class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition text-sm font-medium shadow-inner">
            </div>
            
            <div class="flex bg-gray-100 p-1 rounded-xl shrink-0">
              <button @click="viewMode = 'grid'" :class="['p-1.5 rounded-lg transition-all', viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-gray-400']"><Squares2X2Icon class="w-5 h-5" /></button>
              <button @click="viewMode = 'list'" :class="['p-1.5 rounded-lg transition-all', viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-gray-400']"><ListBulletIcon class="w-5 h-5" /></button>
            </div>
          </div>

          <div class="flex flex-col gap-3 pt-2 border-t border-gray-100">
            <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <button v-for="grp in distinctGroups" :key="grp" @click="selectedGroup = grp" 
                :class="['px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap', selectedGroup === grp ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100']">
                {{ grp }}
              </button>
            </div>
            
            <div v-if="filteredCategories.length > 0" class="flex gap-2 overflow-x-auto no-scrollbar pb-1 items-center">
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1 shrink-0">Cat:</span>
              <button @click="selectedCategory = 'All'" :class="['px-3 py-1.5 rounded-lg text-xs font-bold border transition whitespace-nowrap shrink-0', selectedCategory === 'All' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400']">All</button>
              <button v-for="cat in filteredCategories" :key="cat.id" @click="selectedCategory = cat.name" 
                :class="['px-3 py-1.5 rounded-lg text-xs font-bold border transition whitespace-nowrap flex items-center gap-1 shrink-0', selectedCategory === cat.name ? 'bg-white border-indigo-600 ring-1 ring-indigo-600 text-indigo-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400']">
                <div class="w-3 h-3 rounded-full bg-gray-100 overflow-hidden"><img :src="cat.image" class="w-full h-full object-cover"></div>
                {{ cat.name }}
              </button>
            </div>

            <div v-if="filterSubcategories.length > 1" class="flex gap-2 overflow-x-auto no-scrollbar pb-1 items-center animate-fade-in-down">
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1 shrink-0">Sub:</span>
              <button v-for="sub in filterSubcategories" :key="sub" @click="selectedSubFilter = sub"
                :class="['px-3 py-1 rounded-md text-[10px] font-bold border transition whitespace-nowrap shrink-0', selectedSubFilter === sub ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50']">
                {{ sub }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 md:px-8 mt-6">
      
      <div v-if="filteredProducts.length === 0" class="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-200 shadow-sm">
        <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4"><ArchiveBoxIcon class="w-8 h-8 text-gray-300" /></div>
        <h3 class="text-lg font-bold text-gray-900">No products found</h3>
        <p class="text-gray-500 mt-1 text-xs">Try adjusting your search or filters.</p>
        <button @click="openAdd" class="mt-4 text-indigo-600 font-bold hover:underline text-sm">Add New Item</button>
      </div>

      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 animate-fade-in">
        <div v-for="product in filteredProducts" :key="product.id" class="group bg-white rounded-2xl md:rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col relative shadow-sm">
          
          <div class="h-40 md:h-48 overflow-hidden relative bg-gray-50">
            <img :src="product.image" :class="['w-full h-full object-cover transition duration-700 group-hover:scale-110', !product.isActive ? 'grayscale opacity-70' : '']" @error="$event.target.src='https://via.placeholder.com/300'">
            
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div class="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide text-gray-800 border border-white/50 shadow-sm">
              {{ product.category }}
            </div>

            <div v-if="!product.isActive" class="absolute top-2 right-2 bg-red-500/90 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide text-white shadow-sm border border-red-400">
              Inactive
            </div>
            
            <div class="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <button @click="openEdit(product)" class="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-700 hover:text-indigo-600 shadow-md transition"><PencilSquareIcon class="w-4 h-4" /></button>
              <button @click="promptDelete(product.id)" class="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-700 hover:text-red-500 shadow-md transition"><TrashIcon class="w-4 h-4" /></button>
            </div>
          </div>

          <div class="p-3 md:p-5 flex-1 flex flex-col">
            <div class="mb-1">
              <h3 class="font-bold text-gray-900 text-sm md:text-base leading-tight line-clamp-1 group-hover:text-indigo-600 transition-colors">{{ product.name }}</h3>
            </div>
            <p class="text-[10px] md:text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{{ product.desc }}</p>
            
            <div class="mt-auto flex items-center justify-between pt-3 border-t border-dashed border-gray-100">
              <span class="text-base md:text-lg font-black text-gray-900 tracking-tight">{{ formatCurrency(product.price) }}</span>
              
              <button 
                @click.stop="promptToggleStatus(product)" 
                :class="['w-9 h-5 rounded-full relative transition-colors duration-300 focus:outline-none', product.isActive ? 'bg-green-500' : 'bg-gray-300']"
                title="Toggle Active Status"
              >
                <div :class="['w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300', product.isActive ? 'left-[20px]' : 'left-[2px]']"></div>
              </button>

            </div>
          </div>
        </div>
      </div>

      <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
        <div v-for="product in filteredProducts" :key="product.id" class="flex items-center gap-3 md:gap-5 p-3 md:p-5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition group">
          
          <div class="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200 shadow-sm relative">
            <img :src="product.image" :class="['w-full h-full object-cover', !product.isActive ? 'grayscale opacity-60' : '']">
            <div v-if="!product.isActive" class="absolute inset-0 flex items-center justify-center bg-black/10">
               <span class="text-[8px] font-black bg-red-500 text-white px-1 rounded">OFF</span>
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-gray-900 text-sm md:text-base truncate">{{ product.name }}</h3>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{{ product.category }}</span>
              <span v-if="product.subcategory" class="text-[10px] text-gray-400">• {{ product.subcategory }}</span>
            </div>
            <p class="text-xs text-gray-400 mt-1 truncate max-w-xs">{{ product.desc }}</p>
          </div>

          <div class="flex flex-col items-end gap-2">
             <div class="font-black text-gray-900 text-sm md:text-lg">{{ formatCurrency(product.price) }}</div>
             <button 
                @click.stop="promptToggleStatus(product)" 
                :class="['w-8 h-4 rounded-full relative transition-colors duration-300', product.isActive ? 'bg-green-500' : 'bg-gray-300']"
              >
                <div :class="['w-3 h-3 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300', product.isActive ? 'left-[18px]' : 'left-[2px]']"></div>
              </button>
          </div>

          <div class="flex gap-1 md:gap-2 pl-2 md:pl-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button @click="openEdit(product)" class="p-2 bg-white border border-gray-200 rounded-lg hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 shadow-sm"><PencilSquareIcon class="w-4 h-4" /></button>
            <button @click="promptDelete(product.id)" class="p-2 bg-white border border-gray-200 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 shadow-sm"><TrashIcon class="w-4 h-4" /></button>
          </div>
        </div>
      </div>

    </div>

    <transition name="modal">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity" @click="showModal = false"></div>
        <div class="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl relative z-10 p-6 md:p-8 transform transition-all scale-100 overflow-y-auto max-h-[90vh] animate-zoom-in">
          
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3 class="text-2xl font-black text-gray-900 tracking-tight">{{ isEditing ? 'Edit Item' : 'New Item' }}</h3>
              <p class="text-gray-500 text-sm mt-0.5">Product details</p>
            </div>
            <button @click="showModal = false" class="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition"><XMarkIcon class="w-5 h-5" /></button>
          </div>
          
          <form @submit.prevent="handleSave" class="space-y-5">
            <div class="group relative w-full h-40 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-500 transition-all" @click="triggerFileInput">
              <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover">
              <div v-else class="text-gray-400 flex flex-col items-center">
                <PhotoIcon class="w-8 h-8 mb-2" />
                <span class="text-xs font-bold uppercase tracking-wide">Upload Image</span>
              </div>
              <input type="file" ref="fileInput" class="hidden" @change="handleFileChange" accept="image/*">
            </div>

            <div><label class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Name</label><input v-model="form.name" type="text" required class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition text-sm font-bold"></div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Category</label>
                <div class="relative">
                  <select v-model="form.category" required class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition text-sm font-bold appearance-none">
                    <option disabled value="">Select</option>
                    <option v-for="cat in store.categories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
                  </select>
                  <div class="absolute right-3 top-3.5 pointer-events-none text-gray-400 text-[10px]">▼</div>
                </div>
              </div>
              <div><label class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Price</label><input v-model="form.price" type="number" step="0.01" required class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition text-sm font-bold"></div>
            </div>

            <div v-if="availableSubcategories.length > 0">
              <label class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Subcategory</label>
              <div class="relative">
                <select v-model="form.subcategory" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition text-sm font-bold appearance-none">
                  <option value="">None</option>
                  <option v-for="sub in availableSubcategories" :key="sub" :value="sub">{{ sub }}</option>
                </select>
                <div class="absolute right-3 top-3.5 pointer-events-none text-gray-400 text-[10px]">▼</div>
              </div>
            </div>

            <div><label class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Description</label><textarea v-model="form.desc" rows="3" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition text-sm font-medium resize-none"></textarea></div>

            <div class="pt-4 border-t border-dashed border-gray-200 flex justify-end gap-3">
              <button type="button" @click="showModal = false" class="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition text-sm">Cancel</button>
              <button class="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-indigo-600 transition shadow-lg active:scale-95 text-sm">{{ isEditing ? 'Save' : 'Create' }}</button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <transition name="modal">
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" @click="showDeleteModal = false"></div>
        <div class="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl relative z-10 p-8 text-center transform transition-all scale-100 animate-pop-in">
          <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><ExclamationTriangleIcon class="w-8 h-8" /></div>
          <h3 class="text-xl font-black text-gray-900 mb-2">Delete Product?</h3>
          <div class="grid grid-cols-2 gap-4 mt-6">
            <button @click="showDeleteModal = false" class="py-3 rounded-xl font-bold bg-gray-50 text-gray-600 hover:bg-gray-100 transition">Cancel</button>
            <button @click="confirmDelete" class="py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg transition">Delete</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="modal">
      <div v-if="showStatusModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" @click="showStatusModal = false"></div>
        <div class="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl relative z-10 p-8 text-center transform transition-all scale-100 animate-pop-in">
          
          <div :class="['w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4', productToToggle?.isActive ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500']">
            <PowerIcon class="w-8 h-8" />
          </div>
          
          <h3 class="text-xl font-black text-gray-900 mb-2">
            {{ productToToggle?.isActive ? 'Deactivate Product?' : 'Activate Product?' }}
          </h3>
          
          <p class="text-sm text-gray-500 mb-4">
            Are you sure you want to {{ productToToggle?.isActive ? 'hide' : 'show' }} 
            <span class="font-bold text-gray-800">"{{ productToToggle?.name }}"</span> 
            from the menu?
          </p>

          <div class="grid grid-cols-2 gap-4 mt-6">
            <button @click="showStatusModal = false" class="py-3 rounded-xl font-bold bg-gray-50 text-gray-600 hover:bg-gray-100 transition">Cancel</button>
            
            <button 
              @click="confirmToggleStatus" 
              :class="['py-3 rounded-xl font-bold text-white shadow-lg transition', productToToggle?.isActive ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700']"
            >
              {{ productToToggle?.isActive ? 'Deactivate' : 'Activate' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.animate-zoom-in { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes zoomIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.animate-pop-in { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.animate-fade-in-down { animation: fadeInDown 0.4s ease-out forwards; }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

.no-scrollbar::-webkit-scrollbar { display: none; }
</style>