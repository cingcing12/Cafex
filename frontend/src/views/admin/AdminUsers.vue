<script setup>
import { ref, computed } from 'vue'
import { useMainStore } from '@/stores/mainStore'
import { 
  TrashIcon, 
  UserCircleIcon, 
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/vue/24/outline'

const store = useMainStore()
const searchQuery = ref('')
const showDeleteModal = ref(false)
const userToDelete = ref(null)

// --- COMPUTED ---

const filteredUsers = computed(() => {
  if (!store.users) return [] // Safety check
  let result = store.users

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(u => 
      (u.name && u.name.toLowerCase().includes(query)) || 
      (u.email && u.email.toLowerCase().includes(query))
    )
  }
  return result
})

const adminCount = computed(() => store.users.filter(u => u.role === 'admin').length)
const customerCount = computed(() => store.users.filter(u => u.role === 'customer').length)

// --- ACTIONS ---

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Helper to safely get ID
const getUserId = (user) => user.id || user._id || ''

const promptDelete = (user) => {
  const currentUserId = store.currentUser?.id || store.currentUser?._id
  const targetId = getUserId(user)
  
  if (targetId === currentUserId) return // Prevent self-delete
  
  userToDelete.value = user
  showDeleteModal.value = true
}

const confirmDelete = () => {
  if (userToDelete.value) {
    const id = getUserId(userToDelete.value)
    if (id) {
      store.deleteUser(id)
    }
    showDeleteModal.value = false
    userToDelete.value = null
  }
}
</script>

<template>
  <div class="space-y-8 animate-fade-in pb-24 font-sans bg-[#FAFAFA] min-h-screen px-4 md:px-8 py-8">
    
    <div class="flex flex-col gap-1">
      <h2 class="text-3xl font-black text-gray-900 tracking-tight">User Management</h2>
      <p class="text-gray-500 text-sm">Oversee platform users, admins, and permissions.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
        <div>
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Users</p>
          <h3 class="text-4xl font-black text-gray-900 tracking-tighter">{{ store.users.length }}</h3>
        </div>
        <div class="w-14 h-14 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <UserGroupIcon class="w-7 h-7" />
        </div>
      </div>

      <div class="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-[2rem] shadow-lg shadow-indigo-200 flex items-center justify-between group transform hover:-translate-y-1 transition-all">
        <div>
          <p class="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-1">Admins</p>
          <h3 class="text-4xl font-black tracking-tighter">{{ adminCount }}</h3>
        </div>
        <div class="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 group-hover:rotate-12 transition-transform">
          <ShieldCheckIcon class="w-7 h-7 text-white" />
        </div>
      </div>

      <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
        <div>
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Customers</p>
          <h3 class="text-4xl font-black text-coffee-600 tracking-tighter">{{ customerCount }}</h3>
        </div>
        <div class="w-14 h-14 bg-coffee-50 text-coffee-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <UserCircleIcon class="w-7 h-7" />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      
      <div class="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="relative w-full md:w-96 group">
          <MagnifyingGlassIcon class="w-5 h-5 text-gray-400 absolute left-4 top-3.5 transition group-focus-within:text-gray-900" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search name, email..." 
            class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-100 rounded-2xl outline-none text-sm font-medium transition-all"
          >
        </div>
        
        <div class="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wide">
          <span>Showing {{ filteredUsers.length }} users</span>
        </div>
      </div>

      <div class="block md:hidden p-4 space-y-4 bg-gray-50/50">
        <div v-for="user in filteredUsers" :key="getUserId(user)" class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg shadow-inner border border-white">
                {{ getInitials(user.name) }}
              </div>
              <div>
                <h4 class="font-bold text-gray-900">{{ user.name }}</h4>
                <div class="flex items-center gap-1.5 mt-1">
                  <span :class="['px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border', user.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-green-50 text-green-700 border-green-100']">
                    {{ user.role }}
                  </span>
                  <span v-if="getUserId(user) === (store.currentUser?.id || store.currentUser?._id)" class="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">YOU</span>
                </div>
              </div>
            </div>
            
            <button 
              v-if="getUserId(user) !== (store.currentUser?.id || store.currentUser?._id)" 
              @click="promptDelete(user)"
              class="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"
            >
              <TrashIcon class="w-5 h-5" />
            </button>
          </div>
          
          <div class="grid grid-cols-1 gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-xl">
            <div class="flex items-center gap-2"><EnvelopeIcon class="w-4 h-4 text-gray-400"/> {{ user.email }}</div>
            <div class="flex items-center gap-2"><PhoneIcon class="w-4 h-4 text-gray-400"/> {{ user.phone || 'No phone' }}</div>
          </div>
        </div>
      </div>

      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
              <th class="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
              <th class="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th class="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="user in filteredUsers" :key="getUserId(user)" class="group hover:bg-gray-50/80 transition-colors">
              
              <td class="px-8 py-5">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-700 font-bold text-lg shadow-sm border border-white">
                    {{ getInitials(user.name) }}
                  </div>
                  <div>
                    <div class="font-bold text-gray-900 text-sm">{{ user.name }}</div>
                    <div class="text-[10px] text-gray-400 font-mono mt-0.5 uppercase tracking-wide">
                      ID: {{ getUserId(user).toString().slice(-6) }}
                    </div>
                  </div>
                </div>
              </td>

              <td class="px-8 py-5">
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <EnvelopeIcon class="w-4 h-4 text-gray-300" /> {{ user.email }}
                  </div>
                  <div class="flex items-center gap-2 text-xs text-gray-400">
                    <PhoneIcon class="w-3.5 h-3.5 text-gray-300" /> {{ user.phone || 'N/A' }}
                  </div>
                </div>
              </td>

              <td class="px-8 py-5">
                <div class="flex items-center gap-2">
                  <span :class="['px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 w-fit shadow-sm', 
                    user.role === 'admin' 
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100']">
                    <ShieldCheckIcon v-if="user.role === 'admin'" class="w-3.5 h-3.5" />
                    <UserCircleIcon v-else class="w-3.5 h-3.5" />
                    {{ user.role }}
                  </span>
                  <span v-if="getUserId(user) === (store.currentUser?.id || store.currentUser?._id)" class="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">YOU</span>
                </div>
              </td>

              <td class="px-8 py-5 text-right">
                <button 
                  v-if="getUserId(user) !== (store.currentUser?.id || store.currentUser?._id)"
                  @click="promptDelete(user)" 
                  class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                  title="Remove User"
                >
                  <TrashIcon class="w-5 h-5" />
                </button>
                <div v-else class="w-9 h-9 mx-auto"></div> </td>

            </tr>
            
            <tr v-if="filteredUsers.length === 0">
              <td colspan="4" class="p-20 text-center">
                <div class="flex flex-col items-center justify-center text-gray-400">
                  <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4"><MagnifyingGlassIcon class="w-8 h-8 opacity-20" /></div>
                  <p class="font-medium">No users match your search.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <transition name="modal">
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity" @click="showDeleteModal = false"></div>
        
        <div class="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 p-8 transform transition-all scale-100 border border-white/20 text-center animate-pop-in">
          <div class="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
            <ExclamationTriangleIcon class="w-10 h-10" />
          </div>
          
          <h3 class="text-2xl font-black text-gray-900 mb-2">Remove User?</h3>
          <p class="text-gray-500 text-sm mb-8 leading-relaxed">
            Are you sure you want to remove <strong class="text-gray-900">{{ userToDelete?.name }}</strong>?<br>
            They will lose access immediately.
          </p>
          
          <div class="grid grid-cols-2 gap-4">
            <button @click="showDeleteModal = false" class="py-3.5 px-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition">
              Cancel
            </button>
            <button @click="confirmDelete" class="py-3.5 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-xl shadow-red-200 transition transform active:scale-95">
              Confirm
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

.animate-pop-in { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes popIn { from { transform: scale(0.9) translateY(10px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }

.animate-fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>