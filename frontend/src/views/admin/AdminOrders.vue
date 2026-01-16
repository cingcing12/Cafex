<script setup>
import { computed, ref } from 'vue'
import { useMainStore } from '@/stores/mainStore'
import { 
  MagnifyingGlassIcon, 
  TrashIcon, 
  MapPinIcon, 
  PhoneIcon, 
  UserCircleIcon,
  CreditCardIcon,
  BanknotesIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ShoppingBagIcon
} from '@heroicons/vue/24/outline'

const store = useMainStore()
const filterStatus = ref('All')
const searchQuery = ref('')

// Modal State
const showDeleteModal = ref(false)
const orderToDelete = ref(null)

const filteredOrders = computed(() => {
  let result = store.orders.slice().reverse()

  // Filter by Status
  if (filterStatus.value !== 'All') {
    result = result.filter(o => o.status === filterStatus.value)
  }

  // Filter by Search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(o => 
      o.id.toString().includes(query) || 
      o.userName.toLowerCase().includes(query) ||
      (o.delivery && o.delivery.name.toLowerCase().includes(query))
    )
  }
  return result
})

// --- ACTIONS ---
const promptDelete = (id) => {
  orderToDelete.value = id
  showDeleteModal.value = true
}

const confirmDelete = () => {
  if (orderToDelete.value) {
    store.deleteOrder(orderToDelete.value)
    showDeleteModal.value = false
    orderToDelete.value = null
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', { 
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  })
}

const getStatusColor = (status) => {
  const colors = {
    'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
    'Preparing': 'bg-blue-100 text-blue-700 border-blue-200',
    'Ready': 'bg-violet-100 text-violet-700 border-violet-200',
    'Completed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Cancelled': 'bg-rose-100 text-rose-700 border-rose-200'
  }
  return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-20 font-sans">
    
    <div class="sticky top-0 z-30 bg-gray-50/80 backdrop-blur-md py-6 px-1 mb-6 border-b border-gray-100 transition-all duration-300">
      <div class="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h2 class="text-3xl font-black text-gray-900 tracking-tight">Live Orders</h2>
          <p class="text-gray-500 text-sm font-medium mt-1">
            <span class="text-coffee-600 font-bold">{{ filteredOrders.length }}</span> active transactions
          </p>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          <div class="relative group w-full sm:w-72">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon class="h-5 w-5 text-gray-400 group-focus-within:text-coffee-600 transition-colors" />
            </div>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Search order ID, name..." 
              class="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl leading-5 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-coffee-500/10 focus:border-coffee-500 transition-all shadow-sm"
            >
          </div>

          <div class="flex bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm overflow-x-auto no-scrollbar">
            <button v-for="status in ['All', 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled']" 
                    :key="status"
                    @click="filterStatus = status"
                    :class="['px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap', 
                      filterStatus === status ? 'bg-gray-900 text-white shadow-md transform scale-105' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50']">
              {{ status }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <transition-group name="list" tag="div" class="space-y-6">
      
      <div v-for="order in filteredOrders" :key="order.id" class="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-coffee-100 transition-all duration-500 group relative">
        
        <div :class="['absolute top-0 left-0 bottom-0 w-1.5', order.paymentMethod === 'khqr' ? 'bg-gradient-to-b from-rose-400 to-rose-600' : 'bg-gradient-to-b from-emerald-400 to-emerald-600']"></div>

        <div class="p-1 pl-3 grid lg:grid-cols-12 gap-0 lg:divide-x divide-gray-50">
          
          <div class="lg:col-span-4 p-6 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-4">
                <span class="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest">#{{ order.id.toString().slice(-4) }}</span>
                <span class="flex items-center text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                  <ClockIcon class="w-3 h-3 mr-1" /> {{ formatDate(order.date) }}
                </span>
              </div>

              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 shadow-inner">
                  <UserCircleIcon class="w-7 h-7" />
                </div>
                <div>
                  <h3 class="font-bold text-gray-900 text-lg leading-tight">{{ order.delivery?.name || order.userName }}</h3>
                  <div class="flex items-center gap-2 mt-1 text-gray-500 text-xs font-medium">
                    <PhoneIcon class="w-3 h-3" /> {{ order.delivery?.phone || 'No Phone' }}
                  </div>
                </div>
              </div>

              <div class="mt-5 bg-gray-50/50 p-3 rounded-xl border border-gray-100 flex items-start gap-3">
                <MapPinIcon class="w-4 h-4 text-coffee-500 mt-0.5 shrink-0" />
                <p class="text-xs text-gray-600 font-medium leading-relaxed">{{ order.delivery?.address || 'Store Pickup' }}</p>
              </div>
            </div>

            <div v-if="order.delivery?.note" class="mt-4 flex gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
              <ChatBubbleLeftEllipsisIcon class="w-4 h-4 shrink-0" />
              <span class="italic font-medium">"{{ order.delivery.note }}"</span>
            </div>
          </div>

          <div class="lg:col-span-5 p-6 bg-gray-50/30">
            <h4 class="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-4">Order Items ({{ order.items.length }})</h4>
            <div class="space-y-3 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
              <div v-for="item in order.items" :key="item.id" class="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
                <div class="flex items-center gap-3">
                  <span class="w-6 h-6 flex items-center justify-center bg-gray-900 text-white text-[10px] font-bold rounded-md shadow-md">{{ item.quantity }}</span>
                  <span class="text-sm font-bold text-gray-700">{{ item.name }}</span>
                </div>
                <span class="text-sm font-medium text-gray-900">${{ (item.price * item.quantity).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div class="lg:col-span-3 p-6 flex flex-col justify-between bg-white relative">
            
            <div class="space-y-3">
              <div :class="['flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border', order.paymentMethod === 'khqr' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100']">
                <component :is="order.paymentMethod === 'khqr' ? CreditCardIcon : BanknotesIcon" class="w-4 h-4" />
                {{ order.paymentMethod === 'khqr' ? 'KHQR Paid' : 'Cash on Delivery' }}
              </div>

              <div class="relative">
                <select 
                  :value="order.status"
                  @change="e => store.updateOrderStatus(order.id, e.target.value)"
                  :class="['w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl text-xs font-bold border outline-none cursor-pointer transition-all hover:shadow-md focus:ring-2 focus:ring-offset-1 focus:ring-gray-200', getStatusColor(order.status)]"
                >
                  <option value="Pending">Pending</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Ready">Ready</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500/70">
                  <ChevronDownIcon class="w-4 h-4" />
                </div>
              </div>
            </div>

            <div class="mt-6">
              <div class="flex justify-between items-end mb-4 pt-4 border-t border-dashed border-gray-200">
                <span class="text-xs font-bold text-gray-400 uppercase">Total</span>
                <span class="text-2xl font-black text-gray-900">${{ order.total.toFixed(2) }}</span>
              </div>
              
              <button 
                @click="promptDelete(order.id)"
                class="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-red-600 hover:bg-red-50 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 opacity-0 group-hover:opacity-100"
              >
                <TrashIcon class="w-4 h-4" /> Remove Order
              </button>
            </div>
          </div>

        </div>
      </div>

    </transition-group>

    <div v-if="filteredOrders.length === 0" class="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
      <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-gray-100">
        <ShoppingBagIcon class="w-10 h-10 text-gray-300" />
      </div>
      <h3 class="text-2xl font-black text-gray-900 tracking-tight">No orders found</h3>
      <p class="text-gray-500 mt-2">Adjust your filters to see results.</p>
      <button @click="filterStatus = 'All'; searchQuery = ''" class="mt-8 text-coffee-600 font-bold hover:underline">Reset Filters</button>
    </div>

    <transition name="modal">
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-md transition-opacity" @click="showDeleteModal = false"></div>
        
        <div class="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl relative z-10 p-8 transform transition-all scale-100 border border-white/20">
          <div class="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm rotate-3">
            <ExclamationTriangleIcon class="w-8 h-8" />
          </div>
          
          <h3 class="text-2xl font-black text-center text-gray-900 mb-2">Delete Order?</h3>
          <p class="text-center text-gray-500 text-sm mb-8 leading-relaxed">
            Are you sure you want to remove this order permanently? This action <span class="font-bold text-gray-800">cannot be undone</span>.
          </p>
          
          <div class="grid grid-cols-2 gap-4">
            <button 
              @click="showDeleteModal = false" 
              class="py-3.5 px-4 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition active:scale-95"
            >
              Cancel
            </button>
            <button 
              @click="confirmDelete" 
              class="py-3.5 px-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-rose-600 shadow-xl shadow-rose-200 transition-all transform active:scale-95"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
/* List Animations */
.list-move, 
.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(30px);
}

.list-leave-active {
  position: absolute;
  width: 100%;
  z-index: 0;
}

/* Modal Animations */
.modal-enter-active, .modal-leave-active { transition: opacity 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .transform, .modal-leave-active .transform { transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.modal-enter-from .transform { transform: scale(0.9) translateY(20px); opacity: 0; }

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>