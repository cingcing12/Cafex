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

// fix: "Why user show only one?" -> We now show ALL users, but handle self-deletion in the template
const filteredUsers = computed(() => {
  let result = store.users

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(u => 
      u.name.toLowerCase().includes(query) || 
      u.email.toLowerCase().includes(query)
    )
  }
  return result
})

const adminCount = computed(() => store.users.filter(u => u.role === 'admin').length)
const customerCount = computed(() => store.users.filter(u => u.role === 'customer').length)

// --- ACTIONS ---

const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const promptDelete = (user) => {
  if (user.id === store.currentUser?.id) return // Safety check
  userToDelete.value = user
  showDeleteModal.value = true
}

const confirmDelete = () => {
  if (userToDelete.value) {
    store.deleteUser(userToDelete.value.id)
    showDeleteModal.value = false
    userToDelete.value = null
  }
}
</script>

<template>
  <div class="space-y-8 animate-fade-in pb-20">
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Users</p>
          <h3 class="text-3xl font-black text-gray-900 mt-1">{{ store.users.length }}</h3>
        </div>
        <div class="w-12 h-12 bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center">
          <UserGroupIcon class="w-6 h-6" />
        </div>
      </div>

      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Customers</p>
          <h3 class="text-3xl font-black text-coffee-600 mt-1">{{ customerCount }}</h3>
        </div>
        <div class="w-12 h-12 bg-coffee-50 text-coffee-600 rounded-2xl flex items-center justify-center">
          <UserCircleIcon class="w-6 h-6" />
        </div>
      </div>

      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Admins</p>
          <h3 class="text-3xl font-black text-purple-600 mt-1">{{ adminCount }}</h3>
        </div>
        <div class="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
          <ShieldCheckIcon class="w-6 h-6" />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
      
      <div class="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 class="text-2xl font-extrabold text-gray-900">User Directory</h2>
          <p class="text-gray-500 text-sm mt-1">Manage access and roles.</p>
        </div>

        <div class="relative w-full md:w-72">
          <MagnifyingGlassIcon class="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search users..." 
            class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 rounded-2xl outline-none text-sm transition-all"
          >
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-gray-50/50 text-xs uppercase text-gray-400 font-bold tracking-wider">
            <tr>
              <th class="px-8 py-5">User Profile</th>
              <th class="px-8 py-5">Contact Info</th>
              <th class="px-8 py-5">Role</th>
              <th class="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50/80 transition-colors group">
              
              <td class="px-8 py-5">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold text-lg shadow-inner">
                    {{ getInitials(user.name) }}
                  </div>
                  <div>
                    <div class="font-bold text-gray-900 text-base">
                      {{ user.name }}
                      <span v-if="user.id === store.currentUser?.id" class="ml-2 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200 uppercase tracking-wide">You</span>
                    </div>
                    <div class="text-xs text-gray-400 font-mono mt-0.5">ID: {{ user.id }}</div>
                  </div>
                </div>
              </td>

              <td class="px-8 py-5">
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2 text-sm text-gray-600">
                    <EnvelopeIcon class="w-4 h-4 text-gray-400" /> {{ user.email }}
                  </div>
                  <div class="flex items-center gap-2 text-xs text-gray-500">
                    <PhoneIcon class="w-3.5 h-3.5 text-gray-400" /> {{ user.phone }}
                  </div>
                </div>
              </td>

              <td class="px-8 py-5">
                <span :class="['px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 w-fit', 
                  user.role === 'admin' 
                    ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                    : 'bg-green-50 text-green-700 border border-green-100']">
                  <ShieldCheckIcon v-if="user.role === 'admin'" class="w-3.5 h-3.5" />
                  <UserCircleIcon v-else class="w-3.5 h-3.5" />
                  {{ user.role }}
                </span>
              </td>

              <td class="px-8 py-5 text-right">
                <button 
                  v-if="user.id !== store.currentUser?.id"
                  @click="promptDelete(user)" 
                  class="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100 transform hover:scale-110"
                  title="Delete User"
                >
                  <TrashIcon class="w-5 h-5" />
                </button>
                <span v-else class="text-xs text-gray-300 italic pr-2">Current Session</span>
              </td>

            </tr>
            
            <tr v-if="filteredUsers.length === 0">
              <td colspan="4" class="p-16 text-center text-gray-400">
                <div class="flex flex-col items-center">
                  <MagnifyingGlassIcon class="w-10 h-10 mb-2 opacity-50" />
                  No users found matching "{{ searchQuery }}"
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <transition name="modal">
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" @click="showDeleteModal = false"></div>
        
        <div class="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl relative z-10 p-8 transform transition-all scale-100 border border-white/20">
          <div class="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm rotate-3 border border-red-100">
            <ExclamationTriangleIcon class="w-8 h-8" />
          </div>
          
          <h3 class="text-2xl font-black text-center text-gray-900 mb-2">Remove User?</h3>
          <p class="text-center text-gray-500 text-sm mb-8 leading-relaxed">
            You are about to remove <span class="font-bold text-gray-800">{{ userToDelete?.name }}</span>. This action cannot be undone.
          </p>
          
          <div class="grid grid-cols-2 gap-4">
            <button @click="showDeleteModal = false" class="py-3.5 px-4 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition active:scale-95">
              Cancel
            </button>
            <button @click="confirmDelete" class="py-3.5 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-xl shadow-red-200 transition-all transform active:scale-95 hover:-translate-y-0.5">
              Remove
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
.modal-enter-active .transform, .modal-leave-active .transform { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-enter-from .transform { transform: scale(0.9) translateY(20px); opacity: 0; }
</style>