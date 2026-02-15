<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useMainStore } from '@/stores/mainStore'
import { 
  PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, 
  FolderIcon, PhotoIcon, TagIcon, Squares2X2Icon
} from '@heroicons/vue/24/outline'

const store = useMainStore()
const showModal = ref(false)
const isEditing = ref(false)
const activeGroup = ref('All') // 👈 Tab State

// Form State
const form = reactive({ 
  id: null, 
  name: '', 
  group: 'Drinks', 
  subcategories: [], 
  newSub: '' 
})

const selectedFile = ref(null)
const imagePreview = ref(null)
const fileInput = ref(null)

// Main Groups
const groups = ['Drinks', 'Food', 'At Home Coffee', 'Merchandise']

onMounted(() => {
  store.fetchCategories()
})

// --- COMPUTED ---
const filteredCategories = computed(() => {
  if (activeGroup.value === 'All') return store.categories
  return store.categories.filter(c => c.group === activeGroup.value)
})

// --- ACTIONS ---
const openAddModal = () => {
  isEditing.value = false
  // Default group to currently active tab if specific, else 'Drinks'
  const defaultGroup = activeGroup.value === 'All' ? 'Drinks' : activeGroup.value
  Object.assign(form, { id: null, name: '', group: defaultGroup, subcategories: [], newSub: '' })
  selectedFile.value = null
  imagePreview.value = null
  showModal.value = true
}

const openEditModal = (cat) => {
  isEditing.value = true
  Object.assign(form, { 
    ...cat, 
    subcategories: [...(cat.subcategories || [])], 
    newSub: '' 
  })
  selectedFile.value = null
  imagePreview.value = cat.image || null
  showModal.value = true
}

const addSubcategory = () => {
  if (form.newSub.trim()) {
    form.subcategories.push(form.newSub.trim())
    form.newSub = ''
  }
}

const removeSubcategory = (index) => {
  form.subcategories.splice(index, 1)
}

const triggerFileInput = () => fileInput.value.click()

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    selectedFile.value = file
    imagePreview.value = URL.createObjectURL(file)
  }
}

const handleSubmit = async () => {
  if (!form.name) return

  const formData = new FormData()
  formData.append('name', form.name)
  formData.append('group', form.group)
  formData.append('subcategories', JSON.stringify(form.subcategories))
  
  if (selectedFile.value) {
    formData.append('image', selectedFile.value)
  }

  if (isEditing.value) {
    await store.updateCategory(form.id, formData)
  } else {
    await store.addCategory(formData)
  }
  showModal.value = false
}

const handleDelete = async (id) => {
  if(confirm("Delete this category?")) await store.deleteCategory(id)
}
</script>

<template>
  <div class="min-h-screen bg-[#FAFAFA] font-sans pb-24 px-4 md:px-8 py-8 animate-fade-in">
    
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
      <div>
        <h2 class="text-3xl font-black text-gray-900 tracking-tight">Categories</h2>
        <p class="text-gray-500 text-sm mt-1">Organize your menu structure and groupings.</p>
      </div>
      <button @click="openAddModal" class="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition shadow-lg flex items-center gap-2 transform active:scale-95">
        <PlusIcon class="w-5 h-5" /> Add Category
      </button>
    </div>

    <div class="sticky top-0 z-20 bg-[#FAFAFA]/95 backdrop-blur-sm py-2 -mx-4 px-4 md:mx-0 md:px-0 mb-6">
      <div class="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        <button 
          @click="activeGroup = 'All'"
          :class="['px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap border', activeGroup === 'All' ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50']"
        >
          All Groups
        </button>
        <button 
          v-for="grp in groups" 
          :key="grp" 
          @click="activeGroup = grp"
          :class="['px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap border', activeGroup === grp ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50']"
        >
          {{ grp }}
        </button>
      </div>
    </div>

    <div v-if="filteredCategories.length === 0" class="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-200">
      <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
        <FolderIcon class="w-10 h-10" />
      </div>
      <h3 class="text-lg font-bold text-gray-900">No categories found</h3>
      <p class="text-gray-500 text-xs mt-1">Select a different group or add a new one.</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div 
        v-for="cat in filteredCategories" 
        :key="cat.id" 
        class="group bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
      >
        <div class="flex items-start gap-4 mb-4">
          <div class="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 shadow-inner group-hover:scale-105 transition-transform">
            <img v-if="cat.image" :src="cat.image" class="w-full h-full object-cover">
            <Squares2X2Icon v-else class="w-8 h-8 text-gray-300" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{{ cat.group }}</div>
            <h3 class="font-black text-gray-900 text-lg leading-tight truncate">{{ cat.name }}</h3>
            <span class="text-xs text-indigo-500 font-bold mt-1 inline-block">{{ cat.subcategories?.length || 0 }} sub-types</span>
          </div>
        </div>

        <div class="flex-1">
          <div class="flex flex-wrap gap-2">
            <span v-for="sub in cat.subcategories.slice(0, 3)" :key="sub" class="px-2.5 py-1 bg-gray-50 text-gray-600 text-[10px] font-bold rounded-lg border border-gray-200">
              {{ sub }}
            </span>
            <span v-if="cat.subcategories.length > 3" class="px-2 py-1 text-[10px] font-bold text-gray-400 bg-gray-50 rounded-lg">
              +{{ cat.subcategories.length - 3 }}
            </span>
            <span v-if="cat.subcategories.length === 0" class="text-[10px] text-gray-300 italic p-1">No subcategories</span>
          </div>
        </div>

        <div class="mt-5 pt-4 border-t border-dashed border-gray-100 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button @click="openEditModal(cat)" class="p-2 bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition">
            <PencilSquareIcon class="w-5 h-5" />
          </button>
          <button @click="handleDelete(cat.id)" class="p-2 bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-500 rounded-xl transition">
            <TrashIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <transition name="modal">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity" @click="showModal = false"></div>
        
        <div class="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 p-8 transform transition-all scale-100 overflow-y-auto max-h-[90vh] animate-pop-in">
          
          <div class="flex justify-between items-center mb-8">
            <h3 class="text-2xl font-black text-gray-900">{{ isEditing ? 'Edit Category' : 'New Category' }}</h3>
            <button @click="showModal = false" class="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition text-gray-500">
              <XMarkIcon class="w-6 h-6"/>
            </button>
          </div>
          
          <form @submit.prevent="handleSubmit" class="space-y-6">
            
            <div class="flex flex-col items-center">
              <div class="group relative w-28 h-28 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/20 transition-all" @click="triggerFileInput">
                <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover">
                <div v-else class="text-gray-400 flex flex-col items-center">
                  <PhotoIcon class="w-8 h-8" />
                </div>
                <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <span class="text-xs font-bold text-white uppercase">Change</span>
                </div>
              </div>
              <input type="file" ref="fileInput" class="hidden" @change="handleFileChange" accept="image/*">
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Group</label>
                <div class="relative">
                  <select v-model="form.group" class="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 font-bold text-gray-900 appearance-none cursor-pointer transition">
                    <option v-for="g in groups" :key="g">{{ g }}</option>
                  </select>
                  <div class="absolute right-4 top-4 pointer-events-none text-gray-400 text-xs">▼</div>
                </div>
              </div>
              
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Category Name</label>
                <input v-model="form.name" type="text" required class="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 font-bold text-gray-900 transition" placeholder="e.g. Blended Beverages">
              </div>
            </div>

            <div class="bg-gray-50 p-5 rounded-[1.5rem] border border-gray-100">
              <label class="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                <TagIcon class="w-3.5 h-3.5" /> Subcategories
              </label>
              
              <div class="flex gap-2 mb-4">
                <input 
                  v-model="form.newSub" 
                  @keyup.enter.prevent="addSubcategory" 
                  class="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition" 
                  placeholder="Type & Enter..."
                >
                <button type="button" @click="addSubcategory" class="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition shadow-md active:scale-95">Add</button>
              </div>

              <div class="flex flex-wrap gap-2 min-h-[40px]">
                <span v-for="(sub, idx) in form.subcategories" :key="idx" class="pl-3 pr-1 py-1 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm animate-fade-in-down">
                  {{ sub }}
                  <button type="button" @click="removeSubcategory(idx)" class="p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition">
                    <XMarkIcon class="w-3 h-3" />
                  </button>
                </span>
                <span v-if="form.subcategories.length === 0" class="text-xs text-gray-400 italic w-full text-center py-2">No subcategories yet.</span>
              </div>
            </div>

            <div class="pt-4">
              <button class="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition shadow-xl shadow-indigo-200 active:scale-[0.98]">
                {{ isEditing ? 'Save Changes' : 'Create Category' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.animate-pop-in { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes popIn { from { transform: scale(0.9) translateY(10px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }

.animate-fade-in-down { animation: fadeInDown 0.3s ease-out forwards; }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

.no-scrollbar::-webkit-scrollbar { display: none; }
</style>