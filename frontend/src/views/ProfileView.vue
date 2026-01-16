<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMainStore } from '@/stores/mainStore'
import { 
  UserCircleIcon, 
  ShoppingBagIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon, 
  ArrowPathIcon,
  CreditCardIcon,
  ClockIcon,
  CheckCircleIcon,
  MapPinIcon,
  PhoneIcon,
  XMarkIcon,
  ArchiveBoxXMarkIcon,
  ExclamationTriangleIcon // Ensure this is imported for the cancel modal
} from '@heroicons/vue/24/outline'

const store = useMainStore()
const router = useRouter()
const activeTab = ref('history')
const selectedOrder = ref(null) 
const isEditing = ref(false)
const showSaveMessage = ref(false)

// Custom Cancel Modal State
const showCancelModal = ref(false)
const orderToCancel = ref(null)

// Redirect if not logged in
if (!store.currentUser) {
  router.push('/login')
}

// Form State
const editForm = ref({
  name: store.currentUser?.name || '',
  email: store.currentUser?.email || '',
  phone: store.currentUser?.phone || '',
  password: store.currentUser?.password || ''
})

// --- ACTIONS ---

const handleSaveProfile = () => {
  store.updateProfile(editForm.value)
  showSaveMessage.value = true
  isEditing.value = false
  setTimeout(() => showSaveMessage.value = false, 3000)
}

const handleLogout = () => {
  store.logout()
  router.push('/login')
}

const handleReorder = (items) => {
  store.reOrder(items)
  selectedOrder.value = null 
}

const openOrderDetails = (order) => {
  selectedOrder.value = order
}

const closeOrderDetails = () => {
  selectedOrder.value = null
}

// Updated Cancel Logic with Custom Modal
const promptCancel = (orderId) => {
  orderToCancel.value = orderId
  showCancelModal.value = true
}

const confirmCancel = () => {
  if (orderToCancel.value) {
    store.cancelOrder(orderToCancel.value)
    showCancelModal.value = false
    orderToCancel.value = null
    selectedOrder.value = null // Close detail modal
  }
}

// --- HELPERS ---

const points = computed(() => store.loyaltyPoints)
const progressWidth = computed(() => Math.min(points.value, 100) + '%')

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date)
}

const statusClass = (status) => {
  if (status === 'Pending') return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  if (status === 'Preparing') return 'bg-blue-100 text-blue-700 border-blue-200'
  if (status === 'Ready') return 'bg-purple-100 text-purple-700 border-purple-200'
  if (status === 'Cancelled') return 'bg-red-100 text-red-700 border-red-200'
  return 'bg-green-100 text-green-700 border-green-200'
}

const canCancel = (status) => status === 'Pending'
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 font-sans">
    <div class="max-w-7xl mx-auto">
      
      <div class="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">
            Hi, {{ store.currentUser?.name.split(' ')[0] }}! <span class="text-2xl">👋</span>
          </h1>
          <p class="text-gray-500 mt-1">Welcome to your personal coffee hub.</p>
        </div>
        <button @click="handleLogout" class="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-500 bg-white hover:bg-red-50 px-5 py-2.5 rounded-full shadow-sm transition border border-gray-100">
          <ArrowRightOnRectangleIcon class="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div class="grid lg:grid-cols-3 gap-8">
        
        <div class="space-y-8">
          <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
            <div class="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
            <div class="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-coffee-500/20 blur-2xl"></div>
            <div class="relative z-10">
              <div class="flex justify-between items-start mb-8">
                <div>
                  <p class="text-coffee-400 text-[10px] font-bold uppercase tracking-[0.2em]">CAFÉX REWARDS</p>
                  <h3 class="text-2xl font-bold mt-1">Gold Member</h3>
                </div>
                <CreditCardIcon class="w-8 h-8 text-white/30" />
              </div>
              <div class="mb-4">
                <div class="flex justify-between text-sm mb-2 font-medium">
                  <span>Points</span>
                  <span class="text-coffee-400">{{ points }} / 100</span>
                </div>
                <div class="w-full bg-gray-700/50 rounded-full h-2 backdrop-blur-sm overflow-hidden">
                  <div class="bg-gradient-to-r from-yellow-400 to-yellow-600 h-full rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]" :style="{ width: progressWidth }"></div>
                </div>
                <p class="text-xs text-gray-400 mt-3 flex items-center gap-2">
                  <CheckCircleIcon class="w-4 h-4 text-green-400" />
                  {{ points >= 100 ? 'Free coffee unlocked!' : `${100 - points} points to next reward` }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <nav class="flex flex-col p-3 space-y-1">
              <button @click="activeTab = 'history'" :class="['flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 text-left font-bold', activeTab === 'history' ? 'bg-coffee-50 text-coffee-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900']">
                <div :class="['w-10 h-10 rounded-full flex items-center justify-center transition-colors', activeTab === 'history' ? 'bg-white text-coffee-600' : 'bg-gray-100 text-gray-400']">
                  <ShoppingBagIcon class="w-5 h-5" />
                </div>
                <div>
                  <span class="block text-sm">My Orders</span>
                  <span class="text-[10px] text-gray-400 font-normal uppercase tracking-wide">Track & History</span>
                </div>
              </button>
              <button @click="activeTab = 'settings'" :class="['flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 text-left font-bold', activeTab === 'settings' ? 'bg-coffee-50 text-coffee-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900']">
                <div :class="['w-10 h-10 rounded-full flex items-center justify-center transition-colors', activeTab === 'settings' ? 'bg-white text-coffee-600' : 'bg-gray-100 text-gray-400']">
                  <Cog6ToothIcon class="w-5 h-5" />
                </div>
                <div>
                  <span class="block text-sm">Settings</span>
                  <span class="text-[10px] text-gray-400 font-normal uppercase tracking-wide">Profile & Security</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        <div class="lg:col-span-2">
          
          <transition name="fade" mode="out-in">
            <div v-if="activeTab === 'history'" key="history" class="space-y-6">
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-bold text-gray-900">Recent Transactions</h2>
                <span class="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{{ store.myOrders.length }} Orders</span>
              </div>

              <div v-if="store.myOrders.length === 0" class="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
                <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                  <ShoppingBagIcon class="w-10 h-10" />
                </div>
                <h3 class="text-lg font-bold text-gray-900">No orders placed yet</h3>
                <p class="text-gray-500 text-sm mb-8 mt-2 max-w-xs mx-auto">Start your journey with a fresh cup of coffee delivered to your door.</p>
                <button @click="router.push('/')" class="bg-coffee-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-coffee-700 transition shadow-lg shadow-coffee-200">
                  Start Ordering
                </button>
              </div>

              <div v-else class="grid gap-4">
                <div v-for="order in store.myOrders" :key="order.id" @click="openOrderDetails(order)" class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-coffee-200 transition-all cursor-pointer group">
                  <div class="flex justify-between items-start">
                    <div class="flex items-start gap-4">
                      <div :class="['w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border', order.status === 'Cancelled' ? 'bg-red-50 border-red-100 text-red-500' : 'bg-gray-50 border-gray-100 text-gray-500 group-hover:bg-coffee-50 group-hover:text-coffee-600']">
                        <ArchiveBoxXMarkIcon v-if="order.status === 'Cancelled'" class="w-6 h-6" />
                        <ClockIcon v-else class="w-6 h-6 transition-colors" />
                      </div>
                      <div>
                        <div class="flex items-center gap-2 mb-1">
                          <span class="font-bold text-gray-900">Order #{{ order.id.toString().slice(-4) }}</span>
                          <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase', statusClass(order.status)]">{{ order.status }}</span>
                        </div>
                        <p class="text-xs text-gray-500">{{ formatDate(order.date) }} • {{ order.items.length }} Items</p>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="text-lg font-extrabold text-gray-900">${{ order.total.toFixed(2) }}</p>
                      <span class="text-xs font-bold text-coffee-600 hover:underline">View Details &rarr;</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else key="settings" class="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <div class="flex justify-between items-center mb-8">
                <div>
                  <h2 class="text-xl font-bold text-gray-900">Edit Profile</h2>
                  <p class="text-sm text-gray-500">Update your personal information.</p>
                </div>
                <button @click="isEditing = !isEditing" class="text-sm font-bold text-coffee-600 hover:bg-coffee-50 px-4 py-2 rounded-lg transition">
                  {{ isEditing ? 'Cancel' : 'Edit Details' }}
                </button>
              </div>

              <transition name="fade">
                <div v-if="showSaveMessage" class="mb-6 p-4 bg-green-50 text-green-700 rounded-2xl flex items-center gap-3 border border-green-100 font-medium text-sm">
                  <CheckCircleIcon class="w-5 h-5" /> Profile updated successfully!
                </div>
              </transition>

              <div class="space-y-6">
                <div class="grid md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">Full Name</label>
                    <input v-model="editForm.name" :disabled="!isEditing" type="text" class="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 rounded-xl px-4 py-3 outline-none transition disabled:opacity-60 disabled:cursor-not-allowed font-medium">
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">Email Address</label>
                    <input v-model="editForm.email" :disabled="!isEditing" type="email" class="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 rounded-xl px-4 py-3 outline-none transition disabled:opacity-60 disabled:cursor-not-allowed font-medium">
                  </div>
                </div>
                <div class="grid md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">Phone Number</label>
                    <input v-model="editForm.phone" :disabled="!isEditing" type="tel" class="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 rounded-xl px-4 py-3 outline-none transition disabled:opacity-60 disabled:cursor-not-allowed font-medium">
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">Password</label>
                    <input v-model="editForm.password" :disabled="!isEditing" type="password" class="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 rounded-xl px-4 py-3 outline-none transition disabled:opacity-60 disabled:cursor-not-allowed font-medium">
                  </div>
                </div>
                <div v-if="isEditing" class="pt-4 flex justify-end border-t border-gray-100">
                  <button @click="handleSaveProfile" class="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-coffee-600 transition shadow-lg active:scale-95">Save Changes</button>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <transition name="modal">
      <div v-if="selectedOrder" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeOrderDetails"></div>
        
        <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
          
          <div class="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 class="text-xl font-extrabold text-gray-900">Order #{{ selectedOrder.id.toString().slice(-4) }}</h3>
              <p class="text-sm text-gray-500">{{ formatDate(selectedOrder.date) }}</p>
            </div>
            <button @click="closeOrderDetails" class="p-2 bg-white rounded-full hover:bg-gray-200 transition text-gray-500">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <div class="p-6 overflow-y-auto space-y-8">
            <div class="flex items-center gap-3">
              <span :class="['px-4 py-2 rounded-lg text-sm font-bold border', statusClass(selectedOrder.status)]">
                Status: {{ selectedOrder.status }}
              </span>
              <span v-if="selectedOrder.status === 'Cancelled'" class="text-sm text-red-500 font-medium">
                This order was cancelled.
              </span>
            </div>

            <div>
              <h4 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Items Ordered</h4>
              <div class="space-y-3">
                <div v-for="item in selectedOrder.items" :key="item.id" class="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div class="flex items-center gap-3">
                    <img :src="item.image" class="w-12 h-12 rounded-lg object-cover">
                    <div>
                      <p class="font-bold text-gray-900 text-sm">{{ item.name }}</p>
                      <p class="text-xs text-gray-500">x{{ item.quantity }}</p>
                    </div>
                  </div>
                  <p class="font-bold text-gray-900 text-sm">${{ (item.price * item.quantity).toFixed(2) }}</p>
                </div>
              </div>
            </div>

            <div v-if="selectedOrder.delivery" class="grid md:grid-cols-2 gap-6 bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <div>
                <p class="text-xs font-bold text-gray-400 uppercase mb-1">Delivery Address</p>
                <div class="flex gap-2">
                  <MapPinIcon class="w-4 h-4 text-coffee-600 mt-0.5" />
                  <p class="text-sm font-medium text-gray-800">{{ selectedOrder.delivery.address }}</p>
                </div>
              </div>
              <div>
                <p class="text-xs font-bold text-gray-400 uppercase mb-1">Contact Info</p>
                <div class="flex gap-2">
                  <PhoneIcon class="w-4 h-4 text-coffee-600 mt-0.5" />
                  <p class="text-sm font-medium text-gray-800">{{ selectedOrder.delivery.phone }}</p>
                </div>
                <p class="text-xs text-gray-500 ml-6">{{ selectedOrder.delivery.name }}</p>
              </div>
              <div v-if="selectedOrder.delivery.note" class="md:col-span-2 border-t border-gray-50 pt-3">
                <p class="text-xs font-bold text-gray-400 uppercase mb-1">Note to Barista</p>
                <p class="text-sm italic text-gray-600">"{{ selectedOrder.delivery.note }}"</p>
              </div>
            </div>

            <div class="flex justify-between items-center pt-4 border-t border-gray-100">
              <span class="text-gray-500 font-medium">Total Amount</span>
              <span class="text-2xl font-extrabold text-coffee-600">${{ selectedOrder.total.toFixed(2) }}</span>
            </div>
          </div>

          <div class="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button @click="handleReorder(selectedOrder.items)" class="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-coffee-600 transition flex justify-center items-center gap-2">
              <ArrowPathIcon class="w-5 h-5" /> Re-Order
            </button>
            <button v-if="canCancel(selectedOrder.status)" @click="promptCancel(selectedOrder.id)" class="flex-1 bg-white text-red-500 border border-red-200 py-3 rounded-xl font-bold hover:bg-red-50 transition flex justify-center items-center gap-2">
              <XMarkIcon class="w-5 h-5" /> Cancel Order
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="modal">
      <div v-if="showCancelModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" @click="showCancelModal = false"></div>
        
        <div class="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl relative z-10 p-8 transform transition-all scale-100 border border-white/40">
          <div class="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm rotate-3 border border-red-100">
            <ExclamationTriangleIcon class="w-8 h-8" />
          </div>
          
          <h3 class="text-2xl font-black text-center text-gray-900 mb-2">Cancel Order?</h3>
          <p class="text-center text-gray-500 text-sm mb-8 leading-relaxed px-2">
            Are you sure you want to cancel? This action cannot be undone once confirmed.
          </p>
          
          <div class="grid grid-cols-2 gap-4">
            <button @click="showCancelModal = false" class="py-3.5 px-4 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition active:scale-95">
              Back
            </button>
            <button @click="confirmCancel" class="py-3.5 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-xl shadow-red-200 transition-all transform active:scale-95">
              Yes, Cancel
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-enter-from { opacity: 0; transform: translateY(10px); }
.fade-leave-to { opacity: 0; transform: translateY(-10px); }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .bg-white, .modal-leave-active .bg-white { transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.modal-enter-from .bg-white { transform: scale(0.9); }
.modal-leave-to .bg-white { transform: scale(0.9); }
</style>