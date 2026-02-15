<script setup>
import { computed, ref, onMounted } from 'vue'
import { useMainStore } from '@/stores/mainStore'
import { 
  MagnifyingGlassIcon, TrashIcon, CurrencyDollarIcon, 
  ShoppingBagIcon, ChevronRightIcon, CalendarIcon, XMarkIcon 
} from '@heroicons/vue/24/outline'

const store = useMainStore()
const filterStatus = ref('All')
const searchQuery = ref('')
const showDeleteModal = ref(false)
const orderToDelete = ref(null)
const selectedOrder = ref(null)

onMounted(() => store.fetchOrders())

const filteredOrders = computed(() => {
  let result = store.orders.slice().reverse()
  if (filterStatus.value !== 'All') {
    if (filterStatus.value === 'Active') result = result.filter(o => ['Pending', 'Preparing', 'Ready'].includes(o.deliveryStatus))
    else result = result.filter(o => o.deliveryStatus === filterStatus.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(o => o.billNumber?.toLowerCase().includes(q) || o.customer?.name?.toLowerCase().includes(q))
  }
  return result
})

const promptDelete = (id) => { orderToDelete.value = id; showDeleteModal.value = true }
const confirmDelete = async () => { if (orderToDelete.value) { await store.deleteOrder(orderToDelete.value); showDeleteModal.value = false; selectedOrder.value = null } }
const updateDelivery = async (id, val) => { await store.updateOrderStatus(id, { deliveryStatus: val }); if (selectedOrder.value?.id === id) selectedOrder.value.deliveryStatus = val }
const updatePayment = async (id, val) => { await store.updateOrderStatus(id, { paymentStatus: val }); if (selectedOrder.value?.id === id) selectedOrder.value.paymentStatus = val }

const formatDate = (date) => new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

const getStatusColor = (status) => {
  switch(status) {
    case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'Preparing': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'Ready': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200'
    default: return 'bg-gray-100 text-gray-700'
  }
}

// 🟢 NEW: Format Price Helper
const displayPrice = (val) => {
  const amount = Number(val || 0)
  return amount === 0 ? 'FREE' : `$${amount.toFixed(2)}`
}
</script>

<template>
  <div class="min-h-screen bg-[#FAFAFA] font-sans pb-20 p-4 md:p-6 flex flex-col gap-6">
    
    <div class="flex flex-col gap-4">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-3xl font-black text-gray-900 tracking-tight">Orders</h2>
          <p class="text-gray-500 text-sm mt-1">Manage and track customer orders.</p>
        </div>
        <div class="relative w-full md:w-64">
          <MagnifyingGlassIcon class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          <input v-model="searchQuery" placeholder="Search orders..." class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-gray-900 outline-none shadow-sm transition">
        </div>
      </div>

      <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button v-for="tab in ['All', 'Active', 'Pending', 'Completed', 'Cancelled']" :key="tab" @click="filterStatus = tab"
          :class="['px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap', filterStatus === tab ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50']">
          {{ tab }}
        </button>
      </div>
    </div>

    <div class="block md:hidden space-y-4">
      <div v-if="filteredOrders.length === 0" class="text-center py-10 text-gray-400">No orders found.</div>
      
      <div v-for="order in filteredOrders" :key="order.id" @click="selectedOrder = order" 
           class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer">
        <div class="flex justify-between items-start mb-3">
          <div>
            <span class="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">#{{ order.billNumber || order.id.slice(-6).toUpperCase() }}</span>
            <h3 class="font-bold text-gray-900">{{ order.customer?.name || 'Guest' }}</h3>
          </div>
          <span :class="['px-2 py-1 rounded text-[10px] font-bold border uppercase', getStatusColor(order.deliveryStatus)]">{{ order.deliveryStatus }}</span>
        </div>
        <div class="flex justify-between items-center text-sm text-gray-500 border-t border-gray-50 pt-3 mt-2">
          <span class="flex items-center gap-1"><CalendarIcon class="w-4 h-4"/> {{ formatDate(order.date) }}</span>
          
          <span class="font-black text-lg" :class="(order.total || 0) === 0 ? 'text-green-600' : 'text-gray-900'">
            {{ displayPrice(order.total) }}
          </span>
        </div>
      </div>
    </div>

    <div class="hidden md:flex bg-white rounded-[2rem] shadow-sm border border-gray-100 flex-1 overflow-hidden flex-col h-[calc(100vh-12rem)]">
      <div class="grid grid-cols-12 gap-4 p-5 bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider sticky top-0 z-10">
        <div class="col-span-3 pl-2">Order Info</div>
        <div class="col-span-3">Customer</div>
        <div class="col-span-2">Status</div>
        <div class="col-span-2 text-right">Total</div>
        <div class="col-span-2 text-center">Action</div>
      </div>
      <div class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        <div v-if="filteredOrders.length === 0" class="flex flex-col items-center justify-center h-full text-gray-400">
          <ShoppingBagIcon class="w-16 h-16 mb-4 opacity-20" />
          <p class="font-medium">No orders found</p>
        </div>
        <div v-for="order in filteredOrders" :key="order.id" @click="selectedOrder = order"
          :class="['grid grid-cols-12 gap-4 p-4 rounded-xl items-center cursor-pointer transition-all border border-transparent', selectedOrder?.id === order.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50']">
          <div class="col-span-3 flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-lg shadow-sm">🧾</div>
            <div class="min-w-0">
              <div class="font-bold text-gray-900 text-sm truncate">#{{ order.billNumber || order.id.slice(-6).toUpperCase() }}</div>
              <div class="text-[10px] text-gray-400 font-medium truncate">{{ formatDate(order.date) }}</div>
            </div>
          </div>
          <div class="col-span-3 min-w-0">
            <div class="font-bold text-sm text-gray-800 truncate">{{ order.customer?.name || 'Guest' }}</div>
            <div class="text-xs text-gray-400 truncate">{{ order.customer?.phone || 'No Phone' }}</div>
          </div>
          <div class="col-span-2 flex flex-col gap-1.5 items-start">
            <span :class="['px-2 py-0.5 rounded text-[10px] font-bold border uppercase', getStatusColor(order.deliveryStatus)]">{{ order.deliveryStatus }}</span>
            <span :class="['px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1', order.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200']"><CurrencyDollarIcon class="w-3 h-3"/> {{ order.paymentStatus }}</span>
          </div>
          
          <div class="col-span-2 text-right font-black" :class="(order.total || 0) === 0 ? 'text-green-600' : 'text-gray-900'">
            {{ displayPrice(order.total) }}
          </div>

          <div class="col-span-2 flex justify-center"><button @click.stop="promptDelete(order.id)" class="p-2 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500 transition"><TrashIcon class="w-5 h-5" /></button></div>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="selectedOrder" class="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-40" @click="selectedOrder = null"></div>
    </transition>

    <transition name="slide-in">
      <div v-if="selectedOrder" class="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-50 p-6 flex flex-col border-l border-gray-100">
        
        <div class="flex justify-between items-start mb-6">
          <div><h3 class="text-xl font-black text-gray-900">Order Details</h3><p class="text-xs text-gray-500">#{{ selectedOrder.billNumber }}</p></div>
          <button @click="selectedOrder = null" class="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition shadow-sm">
            <XMarkIcon class="w-6 h-6"/>
          </button>
        </div>
        
        <div class="space-y-4 mb-8">
          <div>
            <label class="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Payment Status</label>
            <div class="grid grid-cols-2 gap-2">
              <button @click="updatePayment(selectedOrder.id, 'Paid')" :class="['py-2 rounded-lg text-xs font-bold border', selectedOrder.paymentStatus === 'Paid' ? 'bg-green-600 text-white border-green-600' : 'bg-white border-gray-200 text-gray-600']">Paid</button>
              <button @click="updatePayment(selectedOrder.id, 'Unpaid')" :class="['py-2 rounded-lg text-xs font-bold border', selectedOrder.paymentStatus === 'Unpaid' ? 'bg-red-500 text-white border-red-500' : 'bg-white border-gray-200 text-gray-600']">Unpaid</button>
            </div>
          </div>
          <div>
            <label class="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Delivery Status</label>
            <select :value="selectedOrder.deliveryStatus" @change="e => updateDelivery(selectedOrder.id, e.target.value)" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold outline-none"><option value="Pending">🕒 Pending</option><option value="Preparing">🔥 Preparing</option><option value="Ready">✅ Ready</option><option value="Completed">🚀 Completed</option><option value="Cancelled">❌ Cancelled</option></select>
          </div>
        </div>

        <div class="h-px bg-gray-100 w-full mb-6"></div>

        <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
          <h4 class="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">Items</h4>
          <div v-for="item in selectedOrder.items" :key="item.id" class="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <img :src="item.image" class="w-12 h-12 rounded-lg object-cover bg-white">
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start">
                <p class="text-sm font-bold text-gray-900 truncate">{{ item.name }}</p>
                <span class="text-xs font-bold text-gray-900">
                  {{ displayPrice(item.price * item.quantity) }}
                </span>
              </div>
              <p class="text-xs text-gray-500">Qty: {{ item.quantity }} <span v-if="item.isReward" class="text-green-600 font-bold ml-1">REWARD</span></p>
            </div>
          </div>
        </div>
        
        <div class="pt-6 mt-4 border-t border-dashed border-gray-200">
          <div class="flex justify-between items-center text-lg mt-2">
            <span class="font-black text-gray-900">Total</span>
            <span class="font-black" :class="(selectedOrder.total || 0) === 0 ? 'text-green-600' : 'text-gray-900'">
              {{ displayPrice(selectedOrder.total) }}
            </span>
          </div>
          <button @click="promptDelete(selectedOrder.id)" class="w-full mt-4 py-3 text-red-500 bg-red-50 rounded-xl font-bold text-sm hover:bg-red-100 transition">Delete Order</button>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showDeleteModal" class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
        <div class="bg-white p-8 rounded-[2rem] max-w-sm w-full text-center shadow-2xl">
          <h3 class="text-xl font-black text-gray-900 mb-2">Delete this order?</h3>
          <div class="grid grid-cols-2 gap-4 mt-6"><button @click="showDeleteModal = false" class="py-3 rounded-xl font-bold bg-gray-100 text-gray-600">Cancel</button><button @click="confirmDelete" class="py-3 rounded-xl font-bold bg-red-600 text-white shadow-lg shadow-red-200">Yes, Delete</button></div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.slide-in-enter-active, .slide-in-leave-active { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-in-enter-from, .slide-in-leave-to { transform: translateX(100%); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>