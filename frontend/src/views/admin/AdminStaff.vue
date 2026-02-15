<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useMainStore } from '@/stores/mainStore'
import { 
  UserGroupIcon, PlusIcon, TruckIcon, XMarkIcon, 
  PhoneIcon, ChatBubbleLeftRightIcon, EnvelopeIcon,
  PencilSquareIcon, TrashIcon, ExclamationTriangleIcon, KeyIcon,
  MagnifyingGlassIcon, Squares2X2Icon, ListBulletIcon,
  CameraIcon, StarIcon, SignalIcon, EllipsisVerticalIcon
} from '@heroicons/vue/24/outline'
import { StarIcon as StarSolid } from '@heroicons/vue/24/solid'

const store = useMainStore()

// UI State
const showModal = ref(false)
const showDeleteModal = ref(false)
const isLoading = ref(false)
const isEditing = ref(false)
const deleteTargetId = ref(null)
const viewMode = ref('grid') // 'grid' or 'list'
const searchQuery = ref('')
const filterStatus = ref('All')

// File Upload State
const fileInput = ref(null)
const selectedFile = ref(null)
const imagePreview = ref(null)

const form = reactive({
  id: null,
  name: '',
  phone: '',
  email: '',
  password: '',
  telegramUsername: '',
  vehicleType: 'Motorcycle',
  status: 'Active'
})

onMounted(() => {
  store.fetchDeliveryStaff()
})

// --- COMPUTED ---
const stats = computed(() => {
    const list = store.staffList || [];
    return {
        total: list.length,
        active: list.filter(s => s.status === 'Active').length,
        busy: list.filter(s => s.status === 'Busy').length
    }
})

const filteredStaff = computed(() => {
    let data = store.staffList || [];
    
    // 1. Filter by Status
    if (filterStatus.value !== 'All') {
        data = data.filter(s => s.status === filterStatus.value);
    }

    // 2. Filter by Search
    if (searchQuery.value) {
        const lowerQ = searchQuery.value.toLowerCase();
        data = data.filter(s => 
            s.name.toLowerCase().includes(lowerQ) || 
            s.phone.includes(lowerQ) ||
            s.vehicleType.toLowerCase().includes(lowerQ)
        );
    }
    return data;
})

// --- ACTIONS ---
const openAddModal = () => {
    isEditing.value = false;
    selectedFile.value = null;
    imagePreview.value = null;
    Object.assign(form, { 
        id: null, name: '', phone: '', email: '', 
        password: '123456', 
        telegramUsername: '', vehicleType: 'Motorcycle', status: 'Active' 
    });
    showModal.value = true;
}

const openEditModal = (staff) => {
    isEditing.value = true;
    selectedFile.value = null;
    imagePreview.value = staff.image || null; // Show current image
    Object.assign(form, { 
        id: staff._id, 
        name: staff.name, 
        phone: staff.phone, 
        email: staff.email, 
        password: '', 
        telegramUsername: staff.telegramUsername, 
        vehicleType: staff.vehicleType,
        status: staff.status
    });
    showModal.value = true;
}

const triggerFileInput = () => fileInput.value.click()

const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        selectedFile.value = file;
        imagePreview.value = URL.createObjectURL(file);
    }
}

const handleSubmit = async () => {
  if (!form.name || !form.phone) return;
  isLoading.value = true;
  
  // Use FormData for File Upload
  const formData = new FormData();
  formData.append('name', form.name);
  formData.append('phone', form.phone);
  formData.append('email', form.email || '');
  formData.append('telegramUsername', form.telegramUsername || '');
  formData.append('vehicleType', form.vehicleType);
  formData.append('status', form.status);

  // Only append password if it exists (Add Mode) or is typed (Edit Mode)
  if (form.password) {
      formData.append('password', form.password);
  }

  // Append Image if selected
  if (selectedFile.value) {
      formData.append('image', selectedFile.value);
  }

  let success = false;
  if (isEditing.value) {
      success = await store.updateDeliveryStaff(form.id, formData);
  } else {
      success = await store.addDeliveryStaff(formData);
  }
  
  isLoading.value = false;
  if (success) showModal.value = false;
}

const confirmDelete = (id) => { deleteTargetId.value = id; showDeleteModal.value = true; }
const executeDelete = async () => {
    if (!deleteTargetId.value) return;
    await store.deleteDeliveryStaff(deleteTargetId.value);
    showDeleteModal.value = false;
    deleteTargetId.value = null;
}

const openTelegram = (username) => {
    if(!username) return;
    window.open(`https://t.me/${username.replace('@', '')}`, '_blank');
}
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFC] p-6 md:p-10 font-sans text-slate-800">
    
    <div class="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 animate-fade-in">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div class="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
             <UserGroupIcon class="w-6 h-6 text-white" />
          </div>
          Delivery Team
        </h1>
        <p class="text-slate-500 font-medium mt-1 ml-1">Manage your fleet and track performance.</p>
      </div>

      <div class="flex gap-4 w-full xl:w-auto">
         <div class="flex-1 xl:w-32 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
            <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</p>
            <p class="text-2xl font-black text-slate-900">{{ stats.total }}</p>
         </div>
         <div class="flex-1 xl:w-32 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
            <p class="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Active</p>
            <p class="text-2xl font-black text-emerald-600">{{ stats.active }}</p>
         </div>
         <div class="flex-1 xl:w-32 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
            <p class="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Busy</p>
            <p class="text-2xl font-black text-orange-500">{{ stats.busy }}</p>
         </div>
      </div>
    </div>

    <div class="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-3 sticky top-2 z-20">
        <div class="relative flex-1">
            <MagnifyingGlassIcon class="w-5 h-5 absolute left-3 top-3 text-slate-400" />
            <input v-model="searchQuery" type="text" placeholder="Search driver, phone or vehicle..." class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 placeholder-slate-400 transition">
        </div>

        <div class="flex bg-slate-100 p-1 rounded-xl">
            <button v-for="s in ['All', 'Active', 'Busy']" :key="s" 
                @click="filterStatus = s"
                :class="['px-4 py-1.5 rounded-lg text-xs font-bold transition', filterStatus === s ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700']"
            >
                {{ s }}
            </button>
        </div>

        <div class="flex bg-slate-100 p-1 rounded-xl">
            <button @click="viewMode = 'grid'" :class="['p-2 rounded-lg transition', viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-slate-400']"><Squares2X2Icon class="w-5 h-5"/></button>
            <button @click="viewMode = 'list'" :class="['p-2 rounded-lg transition', viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-400']"><ListBulletIcon class="w-5 h-5"/></button>
        </div>

        <button @click="openAddModal" class="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition shadow-lg shadow-gray-200 active:scale-95">
            <PlusIcon class="w-5 h-5" /> <span class="hidden md:inline">Add New</span>
        </button>
    </div>

    <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up">
      <div v-for="staff in filteredStaff" :key="staff._id" class="group bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
        
        <div :class="['absolute top-0 left-0 w-full h-1.5', staff.status === 'Active' ? 'bg-emerald-500' : 'bg-orange-500']"></div>

        <div class="flex items-start justify-between mb-4 mt-2">
            <div class="relative">
                <div class="w-16 h-16 rounded-2xl p-1 border border-slate-100 bg-white shadow-sm overflow-hidden">
                    <img :src="staff.image" class="w-full h-full object-cover rounded-xl" @error="$event.target.src='https://cdn-icons-png.flaticon.com/512/1995/1995515.png'">
                </div>
                <div class="absolute -bottom-1 -right-1 bg-indigo-50 text-indigo-600 p-1 rounded-full border-2 border-white shadow-sm text-xs">
                    {{ staff.vehicleType === 'Car' ? '🚗' : '🛵' }}
                </div>
            </div>
            
            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button @click="openEditModal(staff)" class="p-2 rounded-full bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition"><PencilSquareIcon class="w-4 h-4"/></button>
                <button @click="confirmDelete(staff._id)" class="p-2 rounded-full bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"><TrashIcon class="w-4 h-4"/></button>
            </div>
        </div>

        <div>
            <h3 class="font-bold text-slate-900 text-lg leading-tight">{{ staff.name }}</h3>
            <div class="flex items-center gap-1 mt-1 mb-3">
                <StarSolid class="w-4 h-4 text-yellow-400" />
                <span class="text-sm font-bold text-slate-700">{{ staff.rating.toFixed(1) }}</span>
                <span class="text-xs text-slate-400">({{ staff.ratingCount }} reviews)</span>
            </div>
            
            <div class="space-y-2">
                <div class="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                    <PhoneIcon class="w-4 h-4 text-slate-400" /> <span class="font-mono font-medium">{{ staff.phone }}</span>
                </div>
                <div v-if="staff.telegramUsername" @click="openTelegram(staff.telegramUsername)" class="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg cursor-pointer hover:bg-blue-100 transition">
                    <ChatBubbleLeftRightIcon class="w-4 h-4" /> <span class="font-bold">@{{ staff.telegramUsername.replace('@', '') }}</span>
                </div>
            </div>
        </div>

        <div class="mt-4 flex justify-between items-center border-t border-dashed border-slate-100 pt-3">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Status</span>
            <span :class="['px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5', staff.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100']">
                <span :class="['w-2 h-2 rounded-full animate-pulse', staff.status === 'Active' ? 'bg-emerald-500' : 'bg-orange-500']"></span>
                {{ staff.status }}
            </span>
        </div>
      </div>
    </div>

    <div v-else class="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
        <table class="w-full text-left border-collapse">
            <thead class="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                    <th class="px-6 py-4">Driver</th>
                    <th class="px-6 py-4">Contact</th>
                    <th class="px-6 py-4">Rating</th>
                    <th class="px-6 py-4">Status</th>
                    <th class="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
                <tr v-for="staff in filteredStaff" :key="staff._id" class="hover:bg-slate-50/50 transition">
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <img :src="staff.image" class="w-10 h-10 rounded-full object-cover border border-slate-200">
                            <div>
                                <p class="font-bold text-slate-900">{{ staff.name }}</p>
                                <p class="text-xs text-slate-500">{{ staff.vehicleType }}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex flex-col">
                            <span class="text-sm font-mono text-slate-700">{{ staff.phone }}</span>
                            <span v-if="staff.telegramUsername" class="text-xs text-blue-500 cursor-pointer" @click="openTelegram(staff.telegramUsername)">@{{ staff.telegramUsername.replace('@', '') }}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-1">
                            <StarSolid class="w-4 h-4 text-yellow-400" />
                            <span class="font-bold text-slate-700 text-sm">{{ staff.rating.toFixed(1) }}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <span :class="['px-2.5 py-1 rounded-md text-xs font-bold', staff.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700']">
                            {{ staff.status }}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex justify-end gap-2">
                            <button @click="openEditModal(staff)" class="p-1.5 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg hover:border-indigo-200 transition"><PencilSquareIcon class="w-4 h-4"/></button>
                            <button @click="confirmDelete(staff._id)" class="p-1.5 text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded-lg hover:border-red-200 transition"><TrashIcon class="w-4 h-4"/></button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <div v-if="filteredStaff.length === 0" class="flex flex-col items-center justify-center py-20 text-slate-400">
        <TruckIcon class="w-16 h-16 opacity-20 mb-4"/>
        <p class="font-bold text-lg">No drivers found.</p>
        <p class="text-sm">Try adjusting your filters.</p>
    </div>

    <transition name="modal">
      <div v-if="showModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" @click="showModal = false"></div>
        
        <div class="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 p-8 transform transition-all scale-100 animate-pop-in max-h-[90vh] overflow-y-auto custom-scrollbar">
          
          <div class="flex justify-between items-start mb-6">
            <div>
                <h3 class="text-2xl font-black text-slate-900">{{ isEditing ? 'Edit Profile' : 'New Driver' }}</h3>
                <p class="text-sm text-slate-500">Manage account details & access.</p>
            </div>
            <button @click="showModal = false" class="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition"><XMarkIcon class="w-6 h-6 text-slate-500" /></button>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-5">
            
            <div class="flex justify-center mb-6">
                <div class="relative group cursor-pointer" @click="triggerFileInput">
                    <div class="w-28 h-28 rounded-full border-4 border-slate-100 overflow-hidden bg-slate-50 shadow-inner">
                        <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover">
                        <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
                            <CameraIcon class="w-10 h-10" />
                        </div>
                    </div>
                    <div class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span class="text-white text-xs font-bold">Change</span>
                    </div>
                    <div class="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full border-4 border-white shadow-sm text-white">
                        <CameraIcon class="w-4 h-4"/>
                    </div>
                    <input type="file" ref="fileInput" class="hidden" @change="handleFileChange" accept="image/*">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="col-span-1 md:col-span-2">
                    <label class="label">Full Name</label>
                    <input v-model="form.name" type="text" required class="input">
                </div>

                <div>
                    <label class="label">Phone (Login ID)</label>
                    <div class="relative">
                        <PhoneIcon class="w-5 h-5 absolute left-3 top-3 text-slate-400"/>
                        <input v-model="form.phone" type="tel" required class="input pl-10">
                    </div>
                </div>

                <div>
                    <label class="label">Password</label>
                    <div class="relative">
                        <KeyIcon class="w-5 h-5 absolute left-3 top-3 text-slate-400"/>
                        <input v-model="form.password" type="text" :placeholder="isEditing ? 'Unchanged' : '123456'" :required="!isEditing" class="input pl-10 placeholder-slate-300">
                    </div>
                </div>

                <div>
                    <label class="label">Telegram</label>
                    <input v-model="form.telegramUsername" type="text" placeholder="@username" class="input">
                </div>

                <div>
                    <label class="label">Email</label>
                    <input v-model="form.email" type="email" class="input">
                </div>

                <div>
                    <label class="label">Vehicle</label>
                    <select v-model="form.vehicleType" class="input appearance-none">
                        <option value="Motorcycle">Motorcycle</option>
                        <option value="TukTuk">TukTuk</option>
                        <option value="Car">Car</option>
                    </select>
                </div>

                <div>
                    <label class="label">Status</label>
                    <select v-model="form.status" class="input appearance-none">
                        <option value="Active">Active 🟢</option>
                        <option value="Busy">Busy 🟠</option>
                    </select>
                </div>
            </div>

            <div class="pt-6 flex gap-3">
              <button type="button" @click="showModal = false" class="flex-1 py-3.5 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition">Cancel</button>
              <button type="submit" :disabled="isLoading" class="flex-1 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <span v-if="isLoading" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                {{ isLoading ? 'Saving...' : 'Save Driver' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <transition name="modal">
      <div v-if="showDeleteModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-red-900/20 backdrop-blur-sm transition-opacity" @click="showDeleteModal = false"></div>
        <div class="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl relative z-10 p-8 text-center animate-pop-in border-4 border-red-50">
            <div class="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <ExclamationTriangleIcon class="w-10 h-10" />
            </div>
            <h3 class="text-2xl font-black text-slate-900 mb-2">Remove Driver?</h3>
            <p class="text-slate-500 text-sm mb-8 leading-relaxed">This action is permanent. Their history will remain, but they cannot login.</p>
            
            <div class="flex gap-3">
                <button @click="showDeleteModal = false" class="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Cancel</button>
                <button @click="executeDelete" class="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 transition">Delete</button>
            </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
/* UTILS */
.label { @apply text-xs font-bold text-slate-400 uppercase tracking-wide ml-1 block mb-1.5; }
.input { @apply w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition font-bold text-slate-900; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

/* ANIMATIONS */
.modal-enter-active, .modal-leave-active { transition: opacity 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.animate-pop-in { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.animate-fade-in { animation: fadeIn 0.6s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { animation: fadeInUp 0.5s ease-out; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>