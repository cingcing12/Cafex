<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMainStore } from '@/stores/mainStore'
import { 
  ChartBarIcon, 
  ShoppingBagIcon, 
  ClipboardDocumentListIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ArrowLeftOnRectangleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const store = useMainStore()
const router = useRouter()

// Security Check
if (!store.currentUser || store.currentUser.role !== 'admin') {
  router.push('/login')
}

const activeTab = ref('dashboard')
const showProductModal = ref(false)
const isEditing = ref(false)

// Stats Logic
const totalRevenue = computed(() => store.orders.reduce((sum, o) => sum + o.total, 0))
const todaySales = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return store.orders.filter(o => o.date.startsWith(today)).reduce((sum, o) => sum + o.total, 0)
})
const pendingOrders = computed(() => store.orders.filter(o => o.status === 'Pending').length)

// Forms & Modals
const productForm = reactive({ id: null, name: '', category: 'Coffee', price: '', image: '', desc: '', reviews: [] })
const categories = ['Coffee', 'Tea', 'Snacks', 'Desserts']

const openAddModal = () => {
  isEditing.value = false
  Object.assign(productForm, { id: Date.now(), name: '', category: 'Coffee', price: '', image: 'https://source.unsplash.com/random/400x400/?coffee', desc: '' })
  showProductModal.value = true
}

const openEditModal = (product) => {
  isEditing.value = true
  Object.assign(productForm, product)
  showProductModal.value = true
}

const saveProduct = () => {
  const payload = { ...productForm, price: parseFloat(productForm.price) }
  if (isEditing.value) {
    const index = store.products.findIndex(p => p.id === payload.id)
    if (index !== -1) store.products[index] = payload
  } else {
    store.addProduct(payload)
  }
  localStorage.setItem('cafex_products', JSON.stringify(store.products))
  showProductModal.value = false
}

const handleDelete = (id) => { if(confirm('Delete item?')) store.deleteProduct(id) }
const handleLogout = () => { store.logout(); router.push('/login') }

const statusClass = (status) => {
  if (status === 'Pending') return 'bg-yellow-100 text-yellow-800'
  if (status === 'Preparing') return 'bg-blue-100 text-blue-800'
  if (status === 'Ready') return 'bg-purple-100 text-purple-800'
  return 'bg-green-100 text-green-800'
}
</script>

<template>
  <div class="flex h-screen bg-gray-100 font-sans overflow-hidden">
    
    <aside class="w-64 bg-gray-900 text-white flex flex-col shadow-2xl z-20">
      <div class="p-6">
        <h1 class="text-3xl font-bold text-coffee-500 tracking-tighter">CAFÉX <span class="text-xs text-gray-400 font-normal block">Admin Panel</span></h1>
      </div>
      
      <nav class="flex-1 px-4 space-y-2 mt-4">
        <button @click="activeTab = 'dashboard'" :class="['w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all', activeTab === 'dashboard' ? 'bg-coffee-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white']">
          <ChartBarIcon class="w-5 h-5" /> Dashboard
        </button>
        <button @click="activeTab = 'orders'" :class="['w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all', activeTab === 'orders' ? 'bg-coffee-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white']">
          <ShoppingBagIcon class="w-5 h-5" /> Orders
          <span v-if="pendingOrders > 0" class="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{{ pendingOrders }}</span>
        </button>
        <button @click="activeTab = 'menu'" :class="['w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all', activeTab === 'menu' ? 'bg-coffee-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white']">
          <ClipboardDocumentListIcon class="w-5 h-5" /> Menu Manager
        </button>
      </nav>

      <div class="p-4 border-t border-gray-800">
        <button @click="handleLogout" class="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-800 rounded-xl transition">
          <ArrowLeftOnRectangleIcon class="w-5 h-5" /> Logout
        </button>
      </div>
    </aside>

    <main class="flex-1 overflow-y-auto p-8">
      
      <div v-if="activeTab === 'dashboard'" class="animate-fade-in">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div class="text-gray-500 text-sm font-medium uppercase mb-1">Total Revenue</div>
            <div class="text-3xl font-bold text-gray-900">${{ totalRevenue.toFixed(2) }}</div>
          </div>
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div class="text-gray-500 text-sm font-medium uppercase mb-1">Today's Sales</div>
            <div class="text-3xl font-bold text-green-600">${{ todaySales.toFixed(2) }}</div>
          </div>
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div class="text-gray-500 text-sm font-medium uppercase mb-1">Total Orders</div>
            <div class="text-3xl font-bold text-blue-600">{{ store.orders.length }}</div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'orders'" class="animate-fade-in">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Order Management</h2>
        <div class="space-y-4">
          <div v-for="order in store.orders.slice().reverse()" :key="order.id" class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div class="flex items-center gap-3 mb-1">
                <span class="font-bold text-lg text-gray-900">Order #{{ order.id.toString().slice(-4) }}</span>
                <span class="text-sm text-gray-500">{{ new Date(order.date).toLocaleString() }}</span>
              </div>
              <div class="text-sm text-gray-600 mb-2">Customer: <span class="font-semibold">{{ order.userName }}</span></div>
              <div class="flex gap-2 text-sm text-gray-500 flex-wrap">
                <span v-for="item in order.items" :key="item.id" class="bg-gray-100 px-2 py-1 rounded">{{ item.quantity }}x {{ item.name }}</span>
              </div>
            </div>
            <div class="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
               <div class="font-bold text-xl mr-4">${{ order.total.toFixed(2) }}</div>
               <select :value="order.status" @change="e => store.updateOrderStatus(order.id, e.target.value)" :class="['px-4 py-2 rounded-lg border outline-none font-medium', statusClass(order.status)]">
                 <option>Pending</option><option>Preparing</option><option>Ready</option><option>Completed</option>
               </select>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'menu'" class="animate-fade-in">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">Menu Items</h2>
          <button @click="openAddModal" class="bg-coffee-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-coffee-700 transition shadow-lg">
            <PlusIcon class="w-5 h-5" /> Add New Item
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="product in store.products" :key="product.id" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
            <div class="h-48 overflow-hidden relative">
              <img :src="product.image" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
              <div class="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm">{{ product.category }}</div>
            </div>
            <div class="p-4">
              <div class="flex justify-between items-start mb-2">
                <h3 class="font-bold text-gray-900">{{ product.name }}</h3>
                <span class="text-coffee-600 font-bold">${{ product.price }}</span>
              </div>
              <p class="text-xs text-gray-500 mb-4 line-clamp-2">{{ product.desc }}</p>
              <div class="flex gap-2 mt-auto">
                <button @click="openEditModal(product)" class="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center justify-center gap-1"><PencilIcon class="w-4 h-4" /> Edit</button>
                <button @click="handleDelete(product.id)" class="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center justify-center gap-1"><TrashIcon class="w-4 h-4" /> Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div v-if="showProductModal" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showProductModal = false"></div>
      <div class="bg-white rounded-2xl w-full max-w-lg relative z-10 p-8 shadow-2xl animate-fade-in-up">
        <h3 class="text-xl font-bold mb-4">{{ isEditing ? 'Edit Product' : 'Add New Product' }}</h3>
        <form @submit.prevent="saveProduct" class="space-y-4">
          <input v-model="productForm.name" type="text" placeholder="Name" class="w-full border rounded p-2">
          <div class="grid grid-cols-2 gap-4">
            <select v-model="productForm.category" class="w-full border rounded p-2"><option v-for="c in categories" :key="c">{{ c }}</option></select>
            <input v-model="productForm.price" type="number" step="0.01" placeholder="Price" class="w-full border rounded p-2">
          </div>
          <input v-model="productForm.image" type="text" placeholder="Image URL" class="w-full border rounded p-2">
          <textarea v-model="productForm.desc" placeholder="Description" class="w-full border rounded p-2"></textarea>
          <button class="w-full bg-coffee-600 text-white py-2 rounded font-bold">Save</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>