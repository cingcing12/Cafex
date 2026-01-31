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
  ShoppingBagIcon,
  GiftIcon
} from '@heroicons/vue/24/outline'

const store = useMainStore()
const filterStatus = ref('All')
const searchQuery = ref('')

// Modal State
const showDeleteModal = ref(false)
const orderToDelete = ref(null)

const filteredOrders = computed(() => {
  let result = store.orders.slice().reverse()

  if (filterStatus.value !== 'All') {
    result = result.filter(o => o.status === filterStatus.value)
  }

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
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  })
}

const getStatusColor = (status) => {
  const colors = {
    'Pending': 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
    'Preparing': 'bg-blue-50 text-blue-700 ring-blue-600/20',
    'Ready': 'bg-purple-50 text-purple-700 ring-purple-600/20',
    'Completed': 'bg-green-50 text-green-700 ring-green-600/20',
    'Cancelled': 'bg-red-50 text-red-700 ring-red-600/20'
  }
  return colors[status] || 'bg-gray-50 text-gray-600 ring-gray-500/20'
}
</script>

<template>
  <div class="min-h-screen bg-gray-50/50 pb-20 font-sans">
    
    <div class="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 py-4 transition-all duration-300">
      <div class="max-w-7xl mx-auto flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h2 class="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Live Orders <span class="bg-gray-900 text-white text-xs px-2 py-1 rounded-full">{{ filteredOrders.length }}</span>
          </h2>
          <p class="text-gray-500 text-xs font-medium mt-0.5">Real-time transaction monitoring</p>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div class="relative group w-full sm:w-64">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon class="h-4 w-4 text-gray-400 group-focus-within:text-coffee-600 transition-colors" />
            </div>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Search orders..." 
              class="block w-full pl-9 pr-4 py-2.5 bg-gray-100/50 border-0 rounded-xl text-sm font-medium placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-coffee-500 transition-all"
            >
          </div>

          <div class="flex bg-gray-100/50 p-1 rounded-xl overflow-x-auto no-scrollbar">
            <button v-for="status in ['All', 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled']" 
                    :key="status"
                    @click="filterStatus = status"
                    :class="['px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap', 
                      filterStatus === status ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700']">
              {{ status }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 mt-6">
      <transition-group name="list" tag="div" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        <div v-for="order in filteredOrders" :key="order.id" class="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
          
          <div class="flex justify-between items-start mb-4 pb-4 border-b border-gray-50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-white border border-gray-100 flex items-center justify-center text-gray-400 shadow-sm">
                <UserCircleIcon class="w-6 h-6" />
              </div>
              <div>
                <h3 class="font-bold text-gray-900 text-sm leading-tight">{{ order.delivery?.name || order.userName }}</h3>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">#{{ order.id.toString().slice(-4) }}</p>
              </div>
            </div>
            <div class="text-right">
               <p :class="['text-lg font-black', order.total === 0 ? 'text-green-500' : 'text-gray-900']">
                 {{ order.total === 0 ? 'FREE' : '$' + order.total.toFixed(2) }}
               </p>
               <span class="text-[10px] text-gray-400 font-medium">{{ formatDate(order.date) }}</span>
            </div>
          </div>

          <div class="flex gap-2 mb-4">
             <div class="relative flex-1">
                <select 
                  :value="order.status"
                  @change="e => store.updateOrderStatus(order.id, e.target.value)"
                  :class="['w-full appearance-none pl-8 pr-8 py-2 rounded-xl text-xs font-bold ring-1 ring-inset outline-none cursor-pointer transition-all hover:opacity-80', getStatusColor(order.status)]"
                >
                  <option value="Pending">Pending</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Ready">Ready</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 left-2.5 flex items-center">
                   <span class="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                </div>
                <div class="pointer-events-none absolute inset-y-0 right-2.5 flex items-center opacity-50">
                  <ChevronDownIcon class="w-3 h-3" />
                </div>
             </div>

             <div :class="['flex items-center px-3 rounded-xl border', order.paymentMethod === 'khqr' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600']">
                <component :is="order.paymentMethod === 'khqr' ? CreditCardIcon : BanknotesIcon" class="w-4 h-4" />
             </div>
          </div>

          <div class="flex-1 bg-gray-50/50 rounded-2xl p-3 mb-4 space-y-2 overflow-y-auto max-h-[120px] custom-scrollbar">
             <div v-for="item in order.items" :key="item.id" class="flex justify-between items-center text-sm">
                <div class="flex items-center gap-2 overflow-hidden">
                   <span class="bg-white text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 shadow-sm shrink-0">{{ item.quantity }}x</span>
                   <span class="text-gray-600 font-medium truncate">{{ item.name }}</span>
                   <GiftIcon v-if="item.price === 0" class="w-3 h-3 text-green-500 shrink-0" />
                </div>
                <span :class="['font-bold text-xs shrink-0', item.price === 0 ? 'text-green-600' : 'text-gray-900']">
                  {{ item.price === 0 ? 'FREE' : '$' + (item.price * item.quantity).toFixed(2) }}
                </span>
             </div>
          </div>

          <div class="flex flex-col gap-2">
             <div v-if="order.delivery?.address" class="flex items-start gap-2 text-xs text-gray-500 px-1">
                <MapPinIcon class="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span class="line-clamp-1">{{ order.delivery.address }}</span>
             </div>
             <div v-if="order.delivery?.note" class="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                <ChatBubbleLeftEllipsisIcon class="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span class="line-clamp-1 italic">{{ order.delivery.note }}</span>
             </div>
          </div>

          <button 
            @click="promptDelete(order.id)"
            class="absolute top-4 right-4 p-2 bg-white text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-gray-100"
            title="Delete Order"
          >
            <TrashIcon class="w-4 h-4" />
          </button>

        </div>

      </transition-group>

      <div v-if="filteredOrders.length === 0" class="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg shadow-gray-100 border border-gray-50">
          <ShoppingBagIcon class="w-8 h-8 text-gray-300" />
        </div>
        <h3 class="text-xl font-bold text-gray-900">No orders found</h3>
        <p class="text-gray-400 text-sm mt-1">Try adjusting your search or filters.</p>
        <button @click="filterStatus = 'All'; searchQuery = ''" class="mt-6 text-xs font-bold bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">Clear Filters</button>
      </div>
    </div>

    <transition name="modal">
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" @click="showDeleteModal = false"></div>
        <div class="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl relative z-10 p-6 transform transition-all scale-100 border border-white/20">
          <div class="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <ExclamationTriangleIcon class="w-7 h-7" />
          </div>
          <h3 class="text-xl font-black text-center text-gray-900 mb-2">Delete Order?</h3>
          <p class="text-center text-gray-500 text-sm mb-6 leading-relaxed">
            This action cannot be undone. The order data will be permanently removed.
          </p>
          <div class="grid grid-cols-2 gap-3">
            <button @click="showDeleteModal = false" class="py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition">Cancel</button>
            <button @click="confirmDelete" class="py-3 px-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition">Delete</button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
/* List Transitions */
.list-move, 
.list-enter-active,
.list-leave-active { transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1); }
.list-enter-from,
.list-leave-to { opacity: 0; transform: scale(0.95) translateY(20px); }
.list-leave-active { position: absolute; }

/* Modal Transitions */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .transform, .modal-leave-active .transform { transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.modal-enter-from .transform { transform: scale(0.95) translateY(10px); opacity: 0; }

.custom-scrollbar::-webkit-scrollbar { width: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>