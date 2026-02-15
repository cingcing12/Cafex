<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useMainStore } from '@/stores/mainStore'
import { 
  ShoppingBagIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, ArrowPathIcon, 
  ClockIcon, CheckCircleIcon, MapPinIcon, PhoneIcon, XMarkIcon, 
  ArchiveBoxXMarkIcon, ExclamationTriangleIcon, CameraIcon, GiftIcon,
  EnvelopeIcon, LockClosedIcon, FingerPrintIcon, ChevronRightIcon,
  MagnifyingGlassIcon, CalendarDaysIcon, ChatBubbleLeftRightIcon, UserCircleIcon, StarIcon,
  TruckIcon, AdjustmentsHorizontalIcon, FunnelIcon
} from '@heroicons/vue/24/outline'
import { StarIcon as StarSolid } from '@heroicons/vue/24/solid'

// LEAFLET
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const store = useMainStore()
const router = useRouter()

// --- UI STATES ---
const activeTab = ref('history')
const selectedOrder = ref(null) 
const isEditing = ref(false)
const showCancelModal = ref(false)
const showFilterModal = ref(false) // 🟢 Smart Filter Modal
const orderToCancel = ref(null)
const fileInput = ref(null)
const selectedFile = ref(null)
const imagePreview = ref(store.currentUser?.image || null)
const isLoading = ref(false)
const alertState = ref({ show: false, message: '', type: 'success' })

// --- FILTERS ---
const searchQuery = ref('')
const statusFilter = ref('All')
const dateFilter = ref('')

// --- MAP ---
const map = ref(null);
const driverMarker = ref(null);
const userMarker = ref(null);

// --- OTP ---
const showOtpModal = ref(false)
const otpDigits = ref(['', '', '', '', '', ''])
const otpInputs = ref([])
const otpString = computed(() => otpDigits.value.join(''))
const otpLoading = ref(false)
const otpError = ref('')

if (!store.currentUser) { router.push('/login') }

onMounted(async () => {
  isLoading.value = true
  await Promise.all([
      store.fetchOrders(), 
      store.fetchUserProfile(),
      store.fetchDeliveryStaff().catch(() => {}) 
  ])
  isLoading.value = false

  // LIVE DRIVER TRACKING
  store.socket.on("driver-moved", (data) => {
      if (selectedOrder.value && String(selectedOrder.value.id) === String(data.orderId)) {
          const newPos = [data.lat, data.lng];
          if (!driverMarker.value) {
              const carIcon = L.icon({
                  iconUrl: 'https://cdn-icons-png.flaticon.com/512/7541/7541900.png', 
                  iconSize: [40, 40],
                  iconAnchor: [20, 20]
              });
              driverMarker.value = L.marker(newPos, {icon: carIcon}).addTo(map.value);
          } else {
              driverMarker.value.setLatLng(newPos);
          }
          if(map.value) map.value.panTo(newPos); 
      }
  });
})

const editForm = ref({ 
  name: store.currentUser?.name || '', 
  email: store.currentUser?.email || '', 
  phone: store.currentUser?.phone || '', 
  password: '' 
})

// --- LOGIC ---

const getDriverInfo = (staffId) => {
    if (!staffId || !store.staffList.length) return null;
    return store.staffList.find(s => s._id === staffId || s.id === staffId);
}

const filteredOrders = computed(() => {
    let orders = store.myOrders || [];

    // 1. Status Filter
    if (statusFilter.value !== 'All') {
        orders = orders.filter(o => {
            if (statusFilter.value === 'Active') return ['Pending', 'Preparing', 'Ready'].includes(o.deliveryStatus);
            return o.deliveryStatus === statusFilter.value;
        });
    }

    // 2. Date Filter
    if (dateFilter.value) {
        // Fix: Use local date strings to match correctly
        const filterDate = new Date(dateFilter.value).toDateString();
        orders = orders.filter(o => new Date(o.createdAt || o.date).toDateString() === filterDate);
    }

    // 3. Search Filter
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        orders = orders.filter(o => 
            o.id.toString().toLowerCase().includes(q) || 
            o.items.some(i => i.name.toLowerCase().includes(q))
        );
    }

    // Sort Newest First
    return orders.sort((a,b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
});

// 🟢 COLUMN GROUPING LOGIC
const groupedOrders = computed(() => {
    const groups = {};
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    filteredOrders.value.forEach(order => {
        const dateObj = new Date(order.createdAt || order.date);
        const dateStr = dateObj.toDateString();
        
        let key = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        
        if (dateStr === today) key = 'Today';
        else if (dateStr === yesterdayStr) key = 'Yesterday';
        
        if (!groups[key]) groups[key] = [];
        groups[key].push(order);
    });
    return groups;
});

// --- ACTIONS ---
const openTelegram = (username) => { if(username) window.open(`https://t.me/${username.replace('@', '')}`, '_blank'); }
const openPhone = (phone) => { if(phone) window.open(`tel:${phone}`, '_self'); }
const openEmail = (email) => { if(email) window.open(`mailto:${email}`, '_self'); }

const initMap = (order) => {
  if (map.value) return; 
  nextTick(() => {
    const shopLoc = [11.5564, 104.9282]; 
    const userLoc = order.userLocation ? [order.userLocation.lat, order.userLocation.lng] : [11.5621, 104.8885];
    map.value = L.map('tracking-map', { zoomControl: false }).setView(shopLoc, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map.value);
    const userIcon = L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
    userMarker.value = L.marker(userLoc, {icon: userIcon}).addTo(map.value).bindPopup("<b>Delivery Location</b><br>" + order.customer.address).openPopup();
    const shopIcon = L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/931/931949.png', iconSize: [32, 32], iconAnchor: [16, 32] });
    L.marker(shopLoc, {icon: shopIcon}).addTo(map.value);
  });
}
const destroyMap = () => { if(map.value) { map.value.remove(); map.value = null; driverMarker.value = null; userMarker.value = null; } }
const openOrderDetails = (order) => { selectedOrder.value = order; if(['Preparing', 'Ready'].includes(order.deliveryStatus)) { setTimeout(() => initMap(order), 500); } }
const closeOrderDetails = () => { selectedOrder.value = null; destroyMap(); }
const showAlert = (msg, type = 'success') => { alertState.value = { show: true, message: msg, type }; setTimeout(() => alertState.value.show = false, 3000) }
const triggerFileInput = () => { if (isEditing.value) fileInput.value.click() }
const handleFileChange = (event) => { const file = event.target.files[0]; if (file) { selectedFile.value = file; imagePreview.value = URL.createObjectURL(file) } }
const handleSaveProfile = async () => { 
  if (editForm.value.password && editForm.value.password.length > 0) {
      isLoading.value = true; const sent = await store.requestPasswordChangeOTP(editForm.value.email); isLoading.value = false;
      if (sent) { showOtpModal.value = true; showAlert(`Code sent to ${editForm.value.email}`, 'success'); nextTick(() => otpInputs.value[0]?.focus()) } 
      else { showAlert("Failed to send code.", "error") }
      return; 
  }
  await submitProfileUpdate()
}
const submitProfileUpdate = async () => {
    isLoading.value = true; await new Promise(r => setTimeout(r, 800)); 
    const formData = new FormData(); formData.append('name', editForm.value.name); formData.append('email', editForm.value.email); formData.append('phone', editForm.value.phone); 
    if (selectedFile.value) formData.append('image', selectedFile.value); 
    const success = await store.updateProfile(formData); isLoading.value = false;
    if (success) { showAlert("Profile Updated!", "success"); isEditing.value = false; selectedFile.value = null; } 
    else { showAlert("Update Failed.", "error") }
}
const handleOtpInput = (index, event) => { const val = event.target.value; if (val.length > 1) { const chars = val.split(''); otpDigits.value[index] = chars[0]; if (index < 5) { otpDigits.value[index + 1] = chars[1]; otpInputs.value[index + 1].focus() } return } if (!/^\d*$/.test(val)) { otpDigits.value[index] = ''; return } if (val && index < 5) otpInputs.value[index + 1].focus() }
const handleOtpBackspace = (index, event) => { if (!otpDigits.value[index] && index > 0) otpInputs.value[index - 1].focus() }
const verifyPasswordOtp = async () => {
    if (otpString.value.length !== 6) return; otpLoading.value = true; otpError.value = '';
    const success = await store.verifyPasswordChange(editForm.value.email, otpString.value, editForm.value.password);
    if (success) { await submitProfileUpdate(); showOtpModal.value = false; editForm.value.password = ''; otpDigits.value = ['', '', '', '', '', '']; showAlert("Password Updated!", "success"); } 
    else { otpError.value = "Invalid Code"; otpDigits.value = ['', '', '', '', '', '']; otpInputs.value[0]?.focus() }
    otpLoading.value = false
}
const handleLogout = () => { store.logoutUser(); router.push('/login') }
const handleReorder = (items) => { store.reOrder(items); selectedOrder.value = null; router.push('/checkout') }
const promptCancel = (orderId) => { orderToCancel.value = orderId; showCancelModal.value = true }
const confirmCancel = () => { if (orderToCancel.value) { store.updateOrderStatus(orderToCancel.value, { deliveryStatus: 'Cancelled' }); showCancelModal.value = false; orderToCancel.value = null; selectedOrder.value = null; showAlert("Order Cancelled", "success") } }
const points = computed(() => store.loyaltyPoints); const pointsTowardsNext = computed(() => points.value % 100); const pointsNeeded = computed(() => 100 - pointsTowardsNext.value); const progressWidth = computed(() => (pointsTowardsNext.value === 0 && points.value > 0 ? '100%' : pointsTowardsNext.value + '%'))
const getDeliveryStatusClass = (status) => { if (status === 'Pending') return 'bg-yellow-100 text-yellow-700 border-yellow-200'; if (status === 'Preparing') return 'bg-blue-100 text-blue-700 border-blue-200'; if (status === 'Ready') return 'bg-purple-100 text-purple-700 border-purple-200'; if (status === 'Completed') return 'bg-green-100 text-green-700 border-green-200'; if (status === 'Cancelled') return 'bg-red-100 text-red-700 border-red-200'; return 'bg-gray-100 text-gray-700' }
const getPaymentStatusClass = (status) => { return status === 'Paid' ? 'text-green-600 bg-green-50 border-green-200' : 'text-orange-600 bg-orange-50 border-orange-200' }
const canCancel = (status) => status === 'Pending'
const displayPrice = (amount) => Number(amount) === 0 ? 'FREE' : `$${Number(amount).toFixed(2)}`
</script>

<template>
  <div class="min-h-screen bg-[#FDFBF7] pb-24 lg:pb-12 pt-6 px-4 font-sans animate-fade-in relative selection:bg-coffee-100">
    
    <transition name="fade">
      <div v-if="isLoading" class="fixed inset-0 z-[100] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
        <div class="w-12 h-12 border-4 border-gray-100 border-t-coffee-600 rounded-full animate-spin"></div>
      </div>
    </transition>

    <transition name="slide-down">
      <div v-if="alertState.show" class="fixed top-4 left-0 right-0 flex justify-center z-[110] px-4 pointer-events-none">
        <div :class="['px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 text-sm font-bold backdrop-blur-xl pointer-events-auto transform transition-all', 
          alertState.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-600 text-white']">
          <component :is="alertState.type === 'error' ? ExclamationTriangleIcon : CheckCircleIcon" class="w-5 h-5" />
          {{ alertState.message }}
        </div>
      </div>
    </transition>

    <div class="max-w-6xl mx-auto">
      
      <div class="flex items-center justify-between mb-6 lg:mb-8">
        <div>
          <h1 class="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Hi, {{ store.currentUser?.name.split(' ')[0] }} <span class="animate-wave inline-block origin-bottom-right">👋</span>
          </h1>
          <p class="text-sm text-gray-500 font-medium">Your Personal Dashboard</p>
        </div>
        <button @click="handleLogout" class="bg-white p-3 rounded-full shadow-sm border border-gray-100 text-gray-500 hover:text-red-500 hover:bg-red-50 transition active:scale-90">
          <ArrowRightOnRectangleIcon class="w-5 h-5" />
        </button>
      </div>

      <div class="grid lg:grid-cols-12 gap-6 lg:gap-8">
        
        <div class="lg:col-span-4 space-y-6">
          
          <div class="relative overflow-hidden rounded-[2rem] bg-gray-900 text-white p-6 shadow-xl shadow-gray-200 group transition hover:scale-[1.01]">
            <div class="absolute -right-6 -top-6 bg-gradient-to-br from-coffee-500 to-transparent w-32 h-32 rounded-full opacity-20 blur-2xl"></div>
            <div class="relative z-10">
              <div class="flex justify-between items-start mb-8">
                <div>
                  <p class="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">MEMBERSHIP</p>
                  <h3 class="text-2xl font-black bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent">Gold Tier</h3>
                </div>
                <FingerPrintIcon class="w-10 h-10 text-gray-700" />
              </div>
              <div class="mb-2">
                <div class="flex justify-between text-xs mb-2 font-medium text-gray-400">
                  <span>Points</span>
                  <span class="text-white font-bold">{{ points }} / 100</span>
                </div>
                <div class="w-full bg-gray-800 rounded-full h-2 overflow-hidden border border-gray-700">
                  <div class="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-[0_0_10px_rgba(234,179,8,0.5)] transition-all duration-1000" :style="{ width: progressWidth }"></div>
                </div>
                <div class="mt-3 flex items-center justify-between">
                   <div v-if="points >= 100" class="flex items-center gap-1.5 text-green-400 font-bold text-xs animate-pulse"><GiftIcon class="w-4 h-4" /> Free Drink Available!</div>
                   <span v-else class="text-[10px] text-gray-500">{{ pointsNeeded }} pts to reward</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white p-2 rounded-2xl flex lg:flex-col shadow-sm border border-gray-100 lg:gap-2">
            <button @click="activeTab = 'history'" :class="['flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all', activeTab === 'history' ? 'bg-coffee-50 text-coffee-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50']">
              <ShoppingBagIcon class="w-5 h-5" /> My Orders
            </button>
            <button @click="activeTab = 'settings'" :class="['flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all', activeTab === 'settings' ? 'bg-coffee-50 text-coffee-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50']">
              <Cog6ToothIcon class="w-5 h-5" /> Settings
            </button>
          </div>
        </div>

        <div class="lg:col-span-8">
          <transition name="fade-scale" mode="out-in">
            
            <div v-if="activeTab === 'history'" key="history" class="space-y-6">
              
              <div class="flex items-center gap-3">
                  <div class="relative flex-1 group">
                      <MagnifyingGlassIcon class="w-5 h-5 absolute left-4 top-3.5 text-gray-400 group-focus-within:text-coffee-600 transition"/>
                      <input v-model="searchQuery" type="text" placeholder="Search orders..." class="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-coffee-500/20 focus:border-coffee-500 outline-none text-sm font-medium shadow-sm transition">
                  </div>
                  <button @click="showFilterModal = true" class="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm text-gray-500 hover:text-coffee-600 hover:border-coffee-200 transition active:scale-95 relative">
                      <AdjustmentsHorizontalIcon class="w-5 h-5" />
                      <div v-if="dateFilter || statusFilter !== 'All'" class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  </button>
              </div>

              <div v-if="filteredOrders.length === 0" class="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-sm">
                <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300"><ShoppingBagIcon class="w-10 h-10" /></div>
                <p class="text-base font-bold text-gray-900">No orders found</p>
                <p class="text-xs text-gray-500 mt-1">Try changing filters or place a new order.</p>
                <button @click="router.push('/')" class="mt-6 px-6 py-3 bg-coffee-600 text-white rounded-xl text-xs font-bold hover:bg-coffee-700 shadow-lg shadow-coffee-200 transition">Start Ordering</button>
              </div>

              <div v-else class="space-y-8 animate-slide-up">
                <div v-for="(orders, dateGroup) in groupedOrders" :key="dateGroup">
                    <div class="flex items-center gap-4 mb-4 sticky top-2 z-10 bg-[#FDFBF7]/90 backdrop-blur-sm py-1">
                        <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <CalendarDaysIcon class="w-4 h-4"/> {{ dateGroup }}
                        </h3>
                        <div class="h-px bg-gray-200 flex-1"></div>
                    </div>
                    
                    <div class="flex flex-col gap-4">
                        <div v-for="order in orders" :key="order.id" @click="openOrderDetails(order)" class="bg-white rounded-[1.5rem] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 hover:shadow-lg hover:border-coffee-100 transition cursor-pointer group relative overflow-hidden active:scale-[0.98]">
                            
                            <div :class="['absolute top-0 left-0 w-1.5 h-full', getDeliveryStatusClass(order.deliveryStatus).replace('text-','bg-').split(' ')[0]]"></div>

                            <div class="flex justify-between items-start mb-4 pl-3">
                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="text-sm font-black text-gray-900">#{{ order.id.toString().slice(-4).toUpperCase() }}</span>
                                        <span :class="['text-[10px] font-bold px-2 py-0.5 rounded border uppercase', getDeliveryStatusClass(order.deliveryStatus)]">{{ order.deliveryStatus }}</span>
                                    </div>
                                    <p class="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                        <ClockIcon class="w-3 h-3"/> {{ new Date(order.createdAt || order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}
                                    </p>
                                </div>
                                <span class="text-lg font-black text-gray-900">{{ displayPrice(order.total) }}</span>
                            </div>

                            <div class="pl-3 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                <div v-for="(item, idx) in order.items.slice(0, 5)" :key="idx" class="relative shrink-0">
                                    <img :src="item.image" class="w-12 h-12 rounded-xl object-cover border border-gray-100 bg-gray-50 shadow-sm" @error="$event.target.src='https://cdn-icons-png.flaticon.com/512/924/924514.png'">
                                    <div v-if="item.quantity > 1" class="absolute -top-1 -right-1 bg-gray-900 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-md border border-white">{{ item.quantity }}</div>
                                </div>
                                <span v-if="order.items.length > 5" class="text-xs font-bold text-gray-400 ml-1">+{{ order.items.length - 5 }}</span>
                            </div>
                            
                            <div v-if="order.deliveryStaff" class="mt-4 pt-3 border-t border-dashed border-gray-100 pl-3 flex justify-between items-center">
                                <div class="flex items-center gap-2">
                                    <div class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                        <img v-if="getDriverInfo(order.deliveryStaff)?.image" :src="getDriverInfo(order.deliveryStaff).image" class="w-full h-full object-cover">
                                        <UserCircleIcon v-else class="w-4 h-4 text-gray-400"/>
                                    </div>
                                    <span class="text-xs font-bold text-gray-900">{{ getDriverInfo(order.deliveryStaff)?.name || 'Assigned' }}</span>
                                </div>
                                <div v-if="['Preparing', 'Ready'].includes(order.deliveryStatus)" class="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-pulse">
                                    <MapPinIcon class="w-3 h-3"/> Tracking
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
              </div>
            </div>

            <div v-else key="settings" class="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 lg:p-8">
               <div class="flex justify-between items-center mb-6">
                 <h2 class="text-lg font-bold text-gray-900">Edit Profile</h2>
                 <button @click="isEditing = !isEditing" class="text-xs font-bold text-coffee-600 bg-coffee-50 px-3 py-1.5 rounded-lg hover:bg-coffee-100 transition">
                   {{ isEditing ? 'Cancel' : 'Edit' }}
                 </button>
               </div>
               
               <div class="flex flex-col items-center mb-8">
                 <div class="relative group cursor-pointer" @click="triggerFileInput">
                   <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50 shadow-inner">
                     <img :src="imagePreview || 'https://via.placeholder.com/150'" class="w-full h-full object-cover">
                   </div>
                   <div v-if="isEditing" class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <CameraIcon class="w-6 h-6 text-white" />
                   </div>
                   <input type="file" ref="fileInput" class="hidden" @change="handleFileChange" accept="image/*">
                 </div>
                 <p v-if="isEditing" class="text-xs text-coffee-600 font-bold mt-2">Tap to change</p>
               </div>
               
               <div class="space-y-5">
                   <div class="grid md:grid-cols-2 gap-5">
                       <div class="space-y-1"><label class="text-[10px] font-bold text-gray-400 uppercase ml-1">Full Name</label><input v-model="editForm.name" :disabled="!isEditing" type="text" class="input-modern"></div>
                       <div class="space-y-1"><label class="text-[10px] font-bold text-gray-400 uppercase ml-1">Email</label><input v-model="editForm.email" :disabled="!isEditing" type="email" class="input-modern"></div>
                   </div>
                   <div class="grid md:grid-cols-2 gap-5">
                       <div class="space-y-1"><label class="text-[10px] font-bold text-gray-400 uppercase ml-1">Phone</label><input v-model="editForm.phone" :disabled="!isEditing" type="tel" class="input-modern"></div>
                       <div class="space-y-1"><label class="text-[10px] font-bold text-gray-400 uppercase ml-1">New Password</label><input v-model="editForm.password" :disabled="!isEditing" type="password" placeholder="Leave empty to keep" class="input-modern"></div>
                   </div>
                   <div v-if="isEditing" class="pt-4 flex justify-end">
                     <button @click="handleSaveProfile" class="w-full md:w-auto bg-gray-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-coffee-600 transition shadow-lg active:scale-95">Save Changes</button>
                   </div>
               </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <transition name="modal-slide">
        <div v-if="showFilterModal" class="fixed inset-0 z-[80] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="showFilterModal = false"></div>
            <div class="bg-white w-full max-w-sm sm:rounded-[2rem] rounded-t-[2.5rem] shadow-2xl relative z-10 p-8 transform transition-all scale-100">
                <div class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                <h3 class="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><FunnelIcon class="w-5 h-5"/> Filter Orders</h3>
                
                <div class="space-y-6">
                    <div>
                        <label class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">By Status</label>
                        <div class="flex flex-wrap gap-2">
                            <button v-for="status in ['All', 'Active', 'Completed', 'Cancelled']" :key="status"
                                @click="statusFilter = status"
                                :class="['px-4 py-2.5 rounded-xl text-sm font-bold border transition active:scale-95', statusFilter === status ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50']"
                            >
                                {{ status }}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">By Date</label>
                        <div class="relative">
                            <input type="date" v-model="dateFilter" class="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-coffee-500 outline-none transition">
                            <button v-if="dateFilter" @click="dateFilter = ''" class="absolute top-2.5 right-3 p-1 bg-gray-200 rounded-full text-gray-500 hover:bg-red-500 hover:text-white transition">
                                <XMarkIcon class="w-4 h-4"/>
                            </button>
                        </div>
                    </div>

                    <div class="pt-4 flex gap-3">
                        <button @click="statusFilter='All'; dateFilter=''; showFilterModal=false" class="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition active:scale-95">Reset</button>
                        <button @click="showFilterModal=false" class="flex-1 py-4 bg-coffee-600 text-white font-bold rounded-2xl hover:bg-coffee-700 shadow-lg shadow-coffee-200 transition active:scale-95">Apply Filters</button>
                    </div>
                </div>
            </div>
        </div>
    </transition>

    <transition name="modal-slide">
      <div v-if="selectedOrder" class="fixed inset-0 z-50 flex items-end lg:items-center justify-center lg:p-4">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" @click="closeOrderDetails"></div>
        <div class="bg-[#F8FAFC] w-full lg:max-w-2xl lg:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
          
          <div class="p-6 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-20">
            <div>
              <h3 class="text-xl font-black text-gray-900">Order Details</h3>
              <p class="text-xs text-gray-500 font-bold uppercase tracking-wide">#{{ selectedOrder.id.toString().slice(-4).toUpperCase() }}</p>
            </div>
            <button @click="closeOrderDetails" class="p-2.5 bg-gray-50 rounded-full hover:bg-gray-100 transition active:scale-90"><XMarkIcon class="w-5 h-5 text-gray-500" /></button>
          </div>

          <div class="p-6 overflow-y-auto space-y-6 custom-scrollbar">
            
            <div class="flex gap-2">
              <span :class="['px-4 py-2 rounded-xl text-xs font-black border', getPaymentStatusClass(selectedOrder.paymentStatus)]">{{ selectedOrder.paymentStatus }}</span>
              <span :class="['px-4 py-2 rounded-xl text-xs font-black border', getDeliveryStatusClass(selectedOrder.deliveryStatus)]">{{ selectedOrder.deliveryStatus }}</span>
            </div>

            <div v-if="selectedOrder.deliveryStaff && getDriverInfo(selectedOrder.deliveryStaff)" class="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
                <div class="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                <div class="flex justify-between items-start mb-4 pl-2">
                    <div class="flex items-center gap-4">
                        <img :src="getDriverInfo(selectedOrder.deliveryStaff).image" class="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-sm" @error="$event.target.src='https://cdn-icons-png.flaticon.com/512/1995/1995515.png'">
                        <div>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">DRIVER</p>
                            <p class="text-lg font-black text-gray-900 leading-tight">{{ getDriverInfo(selectedOrder.deliveryStaff).name }}</p>
                            <div class="flex items-center gap-1 text-xs font-bold text-yellow-500 mt-0.5">
                                <StarSolid class="w-3.5 h-3.5"/> {{ getDriverInfo(selectedOrder.deliveryStaff).rating.toFixed(1) }}
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 flex flex-col items-center">
                        <span class="text-xl">{{ getDriverInfo(selectedOrder.deliveryStaff).vehicleType === 'Car' ? '🚗' : '🛵' }}</span>
                        <span class="text-[9px] font-bold text-gray-400 uppercase">{{ getDriverInfo(selectedOrder.deliveryStaff).vehicleType }}</span>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-2 pl-2">
                    <button @click="openPhone(getDriverInfo(selectedOrder.deliveryStaff).phone)" class="flex flex-col items-center justify-center p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition active:scale-95">
                        <PhoneIcon class="w-5 h-5 mb-1"/>
                        <span class="text-[10px] font-bold">Call</span>
                    </button>
                    <button @click="openTelegram(getDriverInfo(selectedOrder.deliveryStaff).telegramUsername)" class="flex flex-col items-center justify-center p-2.5 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 transition active:scale-95">
                        <ChatBubbleLeftRightIcon class="w-5 h-5 mb-1"/>
                        <span class="text-[10px] font-bold">Chat</span>
                    </button>
                    <button @click="openEmail(getDriverInfo(selectedOrder.deliveryStaff).email)" class="flex flex-col items-center justify-center p-2.5 bg-purple-50 text-purple-500 rounded-xl hover:bg-purple-100 transition active:scale-95">
                        <EnvelopeIcon class="w-5 h-5 mb-1"/>
                        <span class="text-[10px] font-bold">Email</span>
                    </button>
                </div>
            </div>

            <div v-if="['Preparing', 'Ready'].includes(selectedOrder.deliveryStatus)" class="w-full h-64 bg-gray-200 rounded-[2rem] overflow-hidden shadow-inner border border-gray-200 relative z-0">
                <div id="tracking-map" class="w-full h-full z-0"></div>
                <div class="absolute bottom-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-coffee-600 shadow-lg flex items-center gap-2 border border-white/50">
                   <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Live Tracking
                </div>
            </div>
            
            <div class="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
              <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Ordered Items</h4>
              <div class="space-y-4">
                <div v-for="item in selectedOrder.items" :key="item.id" class="flex justify-between items-start">
                  <div class="flex gap-4">
                    <img :src="item.image" class="w-14 h-14 rounded-2xl object-cover shadow-sm bg-gray-50 border border-gray-100 shrink-0">
                    <div>
                      <p class="font-bold text-gray-900 text-sm flex items-center gap-2">
                        {{ item.name }}
                        <span v-if="(item.price * item.quantity) === 0" class="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">FREE</span>
                      </p>
                      <p class="text-xs text-gray-500 mb-1">Qty: {{ item.quantity }}</p>
                      <div v-if="item.options" class="flex flex-wrap gap-1 mt-1">
                        <span v-if="item.options.size" class="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{{ item.options.size }}</span>
                        <span v-if="item.options.sugar" class="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{{ item.options.sugar }}</span>
                      </div>
                    </div>
                  </div>
                  <p class="font-black text-sm text-gray-900 shrink-0">{{ displayPrice(item.price * item.quantity) }}</p>
                </div>
              </div>
              <div class="flex justify-between items-center pt-4 mt-4 border-t border-dashed border-gray-200">
                <span class="text-sm font-bold text-gray-500">Total Paid</span>
                <span class="text-2xl font-black text-gray-900">{{ displayPrice(selectedOrder.total) }}</span>
              </div>
            </div>
          </div>
          
          <div class="p-6 border-t border-gray-100 flex gap-3 bg-white lg:rounded-b-[2.5rem] pb-8 lg:pb-6">
            <button @click="handleReorder(selectedOrder.items)" class="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-coffee-600 transition flex justify-center items-center gap-2 shadow-lg shadow-gray-200 active:scale-95">
              <ArrowPathIcon class="w-4 h-4" /> Re-Order
            </button>
            <button v-if="canCancel(selectedOrder.deliveryStatus)" @click="promptCancel(selectedOrder.id)" class="flex-1 bg-white text-red-500 border border-red-100 py-4 rounded-2xl font-bold text-sm hover:bg-red-50 transition active:scale-95">
              Cancel Order
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="modal-slide">
      <div v-if="showOtpModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="showOtpModal = false"></div>
        <div class="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl relative z-10 p-8 transform transition-all scale-100 border border-white/40">
           <div class="w-14 h-14 bg-coffee-50 text-coffee-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-coffee-100"><LockClosedIcon class="w-7 h-7" /></div>
           <h3 class="text-xl font-black text-center text-gray-900 mb-1">Verify Change</h3>
           <p class="text-center text-gray-500 text-xs mb-6 px-4">Enter the code sent to <b class="text-gray-800">{{ editForm.email }}</b></p>
           <div class="flex justify-between gap-2 mb-6">
              <input v-for="(digit, index) in 6" :key="index" v-model="otpDigits[index]" :ref="el => { if (el) otpInputs[index] = el }" type="text" maxlength="1" class="w-10 h-12 border-2 border-gray-200 rounded-xl text-center text-xl font-bold text-gray-900 focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/20 outline-none transition-all bg-gray-50 focus:bg-white caret-transparent" @input="handleOtpInput(index, $event)" @paste="handleOtpPaste" @keydown.backspace="handleOtpBackspace(index, $event)">
           </div>
           <p v-if="otpError" class="text-red-500 text-xs font-bold text-center mb-4">{{ otpError }}</p>
           <div class="grid grid-cols-2 gap-3">
             <button @click="showOtpModal = false" class="py-3 px-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition text-sm">Cancel</button>
             <button @click="verifyPasswordOtp" :disabled="otpLoading" class="py-3 px-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-coffee-600 shadow-md transition-all disabled:opacity-50 flex justify-center items-center gap-2 text-sm">{{ otpLoading ? 'Verifying' : 'Confirm' }}</button>
           </div>
        </div>
      </div>
    </transition>

    <transition name="modal-slide">
      <div v-if="showCancelModal" class="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <div @click="showCancelModal=false" class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div class="bg-white w-full max-w-xs rounded-3xl p-6 relative z-10 text-center shadow-2xl">
          <div class="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><ExclamationTriangleIcon class="w-6 h-6" /></div>
          <h3 class="font-bold text-lg text-gray-900 mb-2">Cancel Order?</h3>
          <p class="text-xs text-gray-500 mb-6">Are you sure? This cannot be undone.</p>
          <div class="grid grid-cols-2 gap-3">
            <button @click="showCancelModal=false" class="bg-gray-100 py-3 rounded-xl text-sm font-bold text-gray-700">No</button>
            <button @click="confirmCancel" class="bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700">Yes, Cancel</button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
.input-modern { @apply w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none transition focus:border-coffee-500 focus:bg-white disabled:opacity-60 disabled:bg-gray-100 text-sm font-medium text-gray-900; }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* Transitions */
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-100%); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.modal-slide-enter-active, .modal-slide-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-slide-enter-from { opacity: 0; transform: translateY(100%); }
.modal-slide-leave-to { opacity: 0; transform: translateY(100%); }

@media (min-width: 1024px) {
  .modal-slide-enter-from { opacity: 0; transform: scale(0.95); }
  .modal-slide-leave-to { opacity: 0; transform: scale(0.95); }
}

.fade-scale-enter-active, .fade-scale-leave-active { transition: all 0.3s ease; }
.fade-scale-enter-from { opacity: 0; transform: scale(0.98); }
.fade-scale-leave-to { opacity: 0; transform: scale(0.98); }

.animate-slide-up { animation: slideUp 0.5s ease-out; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

@keyframes wave { 0% { transform: rotate(0deg); } 20% { transform: rotate(15deg); } 40% { transform: rotate(-10deg); } 60% { transform: rotate(5deg); } 100% { transform: rotate(0deg); } }
.animate-wave { animation: wave 2s infinite ease-in-out; }
</style>