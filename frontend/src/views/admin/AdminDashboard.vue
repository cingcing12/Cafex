<script setup>
import { computed } from 'vue'
import { useMainStore } from '@/stores/mainStore'
import { ArrowTrendingUpIcon, ShoppingCartIcon, UserGroupIcon, CurrencyDollarIcon } from '@heroicons/vue/24/outline'

const store = useMainStore()

const totalRevenue = computed(() => store.orders.reduce((sum, o) => sum + o.total, 0))
const totalOrders = computed(() => store.orders.length)
const totalUsers = computed(() => store.users.length)
const recentOrders = computed(() => store.orders.slice().reverse().slice(0, 5))

const statusClass = (status) => {
  if (status === 'Pending') return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  if (status === 'Completed') return 'bg-green-100 text-green-800 border-green-200'
  if (status === 'Ready') return 'bg-purple-100 text-purple-800 border-purple-200'
  return 'bg-blue-100 text-blue-800 border-blue-200'
}
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <div>
      <h2 class="text-3xl font-bold text-gray-900">Dashboard</h2>
      <p class="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
            <p class="text-4xl font-extrabold text-gray-900 mt-2">${{ totalRevenue.toFixed(2) }}</p>
          </div>
          <div class="p-3 bg-green-50 text-green-600 rounded-2xl">
            <CurrencyDollarIcon class="w-8 h-8" />
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Orders</p>
            <p class="text-4xl font-extrabold text-gray-900 mt-2">{{ totalOrders }}</p>
          </div>
          <div class="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <ShoppingCartIcon class="w-8 h-8" />
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-gray-500 text-xs font-bold uppercase tracking-wider">Active Users</p>
            <p class="text-4xl font-extrabold text-gray-900 mt-2">{{ totalUsers }}</p>
          </div>
          <div class="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <UserGroupIcon class="w-8 h-8" />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-8 border-b border-gray-100 flex justify-between items-center">
        <h3 class="text-lg font-bold text-gray-900">Recent Transactions</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th class="p-5 font-bold">Order ID</th>
              <th class="p-5 font-bold">Customer</th>
              <th class="p-5 font-bold">Items</th>
              <th class="p-5 font-bold">Total</th>
              <th class="p-5 font-bold">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="order in recentOrders" :key="order.id" class="hover:bg-gray-50 transition">
              <td class="p-5 font-medium text-gray-600">#{{ order.id.toString().slice(-4) }}</td>
              <td class="p-5 font-bold text-gray-900">{{ order.userName }}</td>
              <td class="p-5 text-gray-500 text-sm">{{ order.items.length }} Items</td>
              <td class="p-5 font-bold text-gray-900">${{ order.total.toFixed(2) }}</td>
              <td class="p-5">
                <span :class="['px-3 py-1 rounded-full text-xs font-bold border', statusClass(order.status)]">
                  {{ order.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>