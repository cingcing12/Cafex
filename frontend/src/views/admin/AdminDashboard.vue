<script setup>
import { computed } from 'vue'
import { useMainStore } from '@/stores/mainStore'
import { 
  ShoppingCartIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  EllipsisHorizontalIcon,
  CalendarIcon,
  ArchiveBoxIcon
} from '@heroicons/vue/24/outline'

const store = useMainStore()

// --- REAL DATA COMPUTED FROM STORE (LocalStorage) ---
const totalRevenue = computed(() => store.orders.reduce((sum, o) => sum + o.total, 0))
const totalOrders = computed(() => store.orders.length)
const totalUsers = computed(() => store.users.length)

// Get the last 5 orders
const recentOrders = computed(() => store.orders.slice().reverse().slice(0, 5))

// Helper for UI
const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

const getInitials = (name) => {
  return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'
}

const statusColor = (status) => {
  if (status === 'Pending') return 'text-yellow-600 bg-yellow-50 ring-yellow-500/30'
  if (status === 'Completed') return 'text-green-600 bg-green-50 ring-green-500/30'
  if (status === 'Ready') return 'text-purple-600 bg-purple-50 ring-purple-500/30'
  if (status === 'Cancelled') return 'text-red-600 bg-red-50 ring-red-500/30'
  return 'text-blue-600 bg-blue-50 ring-blue-500/30'
}
</script>

<template>
  <div class="space-y-8 animate-fade-in-up p-2">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h2 class="text-3xl font-black text-gray-900 tracking-tight">Dashboard Overview</h2>
        <div class="flex items-center gap-2 text-gray-500 mt-2 text-sm font-medium">
          <CalendarIcon class="w-4 h-4" />
          {{ currentDate }}
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-default">
        <div class="flex justify-between items-start mb-4">
          <div class="p-3 bg-green-50 text-green-600 rounded-2xl group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
            <CurrencyDollarIcon class="w-8 h-8" />
          </div>
        </div>
        <div>
          <p class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Revenue</p>
          <h3 class="text-4xl font-black text-gray-900 tracking-tight">${{ totalRevenue.toFixed(2) }}</h3>
        </div>
      </div>

      <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-default">
        <div class="flex justify-between items-start mb-4">
          <div class="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
            <ShoppingCartIcon class="w-8 h-8" />
          </div>
        </div>
        <div>
          <p class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Orders</p>
          <h3 class="text-4xl font-black text-gray-900 tracking-tight">{{ totalOrders }}</h3>
        </div>
      </div>

      <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-default">
        <div class="flex justify-between items-start mb-4">
          <div class="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
            <UserGroupIcon class="w-8 h-8" />
          </div>
        </div>
        <div>
          <p class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Users</p>
          <h3 class="text-4xl font-black text-gray-900 tracking-tight">{{ totalUsers }}</h3>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 class="text-xl font-bold text-gray-900">Recent Transactions</h3>
          <p class="text-gray-400 text-sm mt-1">Latest activity from your users.</p>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-gray-50/50 text-xs uppercase text-gray-400 tracking-wider font-bold">
            <tr>
              <th class="p-6">Order ID</th>
              <th class="p-6">Customer</th>
              <th class="p-6">Items</th>
              <th class="p-6">Date</th>
              <th class="p-6">Amount</th>
              <th class="p-6">Status</th>
              <th class="p-6"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="recentOrders.length === 0">
                <td colspan="7" class="p-12">
                    <div class="flex flex-col items-center justify-center text-center text-gray-400 font-medium">
                        <ArchiveBoxIcon class="w-10 h-10 mb-2 opacity-20" />
                        No transactions found.
                    </div>
                </td>
            </tr>

            <tr v-for="order in recentOrders" :key="order.id" class="hover:bg-gray-50/80 transition group">
              <td class="p-6 font-mono text-xs text-gray-400 font-bold">#{{ order.id.toString().slice(-4) }}</td>
              
              <td class="p-6">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-200 shadow-sm">
                    {{ getInitials(order.userName) }}
                  </div>
                  <div>
                    <p class="font-bold text-gray-900 text-sm">{{ order.userName }}</p>
                    <p class="text-xs text-gray-400">Customer</p>
                  </div>
                </div>
              </td>

              <td class="p-6">
                 <div class="flex -space-x-2">
                    <template v-for="(item, i) in order.items.slice(0,3)" :key="i">
                        <img :src="item.image" class="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" :title="item.name">
                    </template>
                    <div v-if="order.items.length > 3" class="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                        +{{ order.items.length - 3 }}
                    </div>
                 </div>
              </td>

              <td class="p-6 text-sm text-gray-500 font-medium">
                {{ new Date(order.date).toLocaleDateString() }}
              </td>

              <td class="p-6 font-bold text-gray-900">
                {{ order.total === 0 ? 'FREE' : '$' + order.total.toFixed(2) }}
              </td>

              <td class="p-6">
                <span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset', statusColor(order.status)]">
                  <span class="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-60"></span>
                  {{ order.status }}
                </span>
              </td>

              <td class="p-6 text-right">
                <button class="text-gray-400 hover:text-gray-900 transition p-2 rounded-full hover:bg-gray-100">
                    <EllipsisHorizontalIcon class="w-6 h-6" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>