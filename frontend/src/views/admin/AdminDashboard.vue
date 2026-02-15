<script setup>
import { computed, onMounted } from 'vue'
import { useMainStore } from '@/stores/mainStore'
import { 
  ShoppingCartIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  CreditCardIcon, 
  BanknotesIcon 
} from '@heroicons/vue/24/outline'

const store = useMainStore()

// Fetch latest data on mount
onMounted(async () => {
  await store.fetchOrders()
  await store.fetchProducts()
  await store.fetchUsers()
})

// --- COMPUTED STATS ---
const totalRevenue = computed(() => {
  if (!store.orders) return 0
  // Only count orders that are NOT Cancelled
  const validOrders = store.orders.filter(o => o.deliveryStatus !== 'Cancelled')
  return validOrders.reduce((sum, o) => sum + (o.total || o.amount || 0), 0)
})

const totalOrders = computed(() => store.orders ? store.orders.length : 0)
const totalUsers = computed(() => store.users ? store.users.length : 0)

// Get 5 most recent orders
const recentOrders = computed(() => {
  return store.orders ? store.orders.slice(0, 5) : []
})

// --- HELPERS ---
const getPaymentColor = (status) => {
  return status === 'Paid' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-100'
}

const getDeliveryColor = (status) => {
  switch(status) {
    case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'Preparing': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'Ready': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'Cancelled': return 'bg-gray-100 text-gray-500 border-gray-200'
    default: return 'bg-gray-50 text-gray-600'
  }
}

// 🟢 NEW: Format Price Helper
const formatPrice = (val) => {
  const amount = Number(val || 0)
  return amount === 0 ? 'FREE' : `$${amount.toFixed(2)}`
}
</script>

<template>
  <div class="space-y-8 animate-fade-in pb-10">
    
    <div>
      <h2 class="text-3xl font-black text-gray-900 tracking-tight">Dashboard</h2>
      <p class="text-gray-500 mt-1">Live overview of your cafe performance.</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-start">
        <div>
          <p class="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
          <p class="text-4xl font-extrabold text-gray-900 mt-2">${{ totalRevenue.toFixed(2) }}</p>
        </div>
        <div class="p-3 bg-green-50 rounded-2xl text-green-600">
          <CurrencyDollarIcon class="w-8 h-8" />
        </div>
      </div>

      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-start">
        <div>
          <p class="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Orders</p>
          <p class="text-4xl font-extrabold text-gray-900 mt-2">{{ totalOrders }}</p>
        </div>
        <div class="p-3 bg-blue-50 rounded-2xl text-blue-600">
          <ShoppingCartIcon class="w-8 h-8" />
        </div>
      </div>

      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-start">
        <div>
          <p class="text-gray-400 text-xs font-bold uppercase tracking-wider">Active Users</p>
          <p class="text-4xl font-extrabold text-gray-900 mt-2">{{ totalUsers }}</p>
        </div>
        <div class="p-3 bg-purple-50 rounded-2xl text-purple-600">
          <UserGroupIcon class="w-8 h-8" />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-8 border-b border-gray-100 flex justify-between items-center">
        <h3 class="text-lg font-bold text-gray-900">Recent Transactions</h3>
        <router-link to="/admin/orders" class="text-sm font-bold text-coffee-600 hover:underline">View All</router-link>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-gray-50/50 text-xs uppercase text-gray-400 font-bold tracking-wider">
            <tr>
              <th class="p-6">Bill ID</th>
              <th class="p-6">Customer</th>
              <th class="p-6">Method</th>
              <th class="p-6">Payment</th>
              <th class="p-6">Delivery</th>
              <th class="p-6 text-right">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50 text-sm font-medium">
            <tr v-if="recentOrders.length === 0">
              <td colspan="6" class="p-8 text-center text-gray-400">No recent orders.</td>
            </tr>
            <tr v-for="order in recentOrders" :key="order.id" class="hover:bg-gray-50 transition-colors">
              <td class="p-6 font-mono text-gray-500">
                {{ order.billNumber || '#' + order.id.slice(-6).toUpperCase() }}
              </td>
              <td class="p-6">
                <div class="font-bold text-gray-900">{{ order.customer?.name || 'Guest' }}</div>
                <div class="text-xs text-gray-400">{{ order.customer?.phone }}</div>
              </td>
              <td class="p-6">
                <div class="flex items-center gap-2 text-gray-600">
                  <component :is="order.paymentMethod === 'khqr' ? CreditCardIcon : BanknotesIcon" class="w-4 h-4" />
                  <span class="uppercase text-xs font-bold">{{ order.paymentMethod === 'khqr' ? 'KHQR' : 'Cash' }}</span>
                </div>
              </td>
              <td class="p-6">
                <span :class="['px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border', getPaymentColor(order.paymentStatus)]">
                  {{ order.paymentStatus }}
                </span>
              </td>
              <td class="p-6">
                <span :class="['px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border', getDeliveryColor(order.deliveryStatus)]">
                  {{ order.deliveryStatus }}
                </span>
              </td>
              
              <td class="p-6 text-right font-bold" :class="(order.total || order.amount || 0) == 0 ? 'text-green-600' : 'text-gray-900'">
                {{ formatPrice(order.total || order.amount) }}
              </td>

            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>