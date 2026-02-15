<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useMainStore } from '@/stores/mainStore'
import io from 'socket.io-client'
import api from '@/api/config' 
import QrcodeVue from 'qrcode.vue'
import { 
  TruckIcon, MapPinIcon, CheckCircleIcon, BanknotesIcon, 
  UserIcon, PhoneIcon, ChatBubbleLeftRightIcon, 
  StarIcon, ArrowRightOnRectangleIcon, BellIcon, ClockIcon, 
  ArchiveBoxIcon, ArrowPathIcon, QrCodeIcon, XMarkIcon,
  CameraIcon, ShieldCheckIcon, UserCircleIcon, ExclamationTriangleIcon
} from '@heroicons/vue/24/solid'

const store = useMainStore()
const socket = io('https://tutto-joyously-alayna.ngrok-free.dev', { 
  transports: ['websocket', 'polling'], 
  extraHeaders: { "ngrok-skip-browser-warning": "true" } 
})

// --- STATE ---
const driver = ref(JSON.parse(localStorage.getItem('cafex_driver_user')) || null)
const loginForm = reactive({ phone: '', password: '' })
const isLoggingIn = ref(false)
const isLoading = ref(false)
const activeTab = ref('tasks') // 'tasks', 'history', 'profile'

// Data
const myOrders = ref([])
const activeDelivery = ref(null) 
const fileInput = ref(null)

// QR State
const showQRModal = ref(false)
const qrString = ref('')
const qrMd5 = ref('')
const qrExpiry = ref(0)
const timeLeft = ref('')
let pollingInterval = null
let countdownInterval = null

// Custom Alert State
const alertState = reactive({ show: false, type: 'success', title: '', message: '', confirmCallback: null })

// --- COMPUTED ---
const pendingOrders = computed(() => myOrders.value.filter(o => ['Pending', 'Preparing', 'Ready'].includes(o.deliveryStatus) && (!activeDelivery.value || o.id !== activeDelivery.value.id)));
const completedOrders = computed(() => myOrders.value.filter(o => o.deliveryStatus === 'Completed'));
const totalEarnings = computed(() => completedOrders.value.reduce((sum, o) => sum + (o.amount || o.total || 0), 0));
const driverStatus = computed(() => driver.value?.status || 'Active');

// --- LIFECYCLE ---
onMounted(async () => {
    if (driver.value) { 
        await refreshDashboard(); 
        socket.emit('join-driver-room', driver.value._id);
    }
    
    socket.on("order-updated", () => refreshDashboard());
    socket.on("payment-success", () => {
        if (showQRModal.value) {
            closeQR();
            showAlert('success', 'Payment Received!', 'The transaction was verified successfully.');
            refreshDashboard();
        }
    });
    socket.on("staff-status-changed", (data) => {
        if (driver.value && data.id === driver.value._id) {
            driver.value.status = data.status;
            // Also update rating if sent
            if (data.rating) driver.value.rating = data.rating;
            localStorage.setItem('cafex_driver_user', JSON.stringify(driver.value));
            refreshDashboard();
        }
    });
})

// --- CUSTOM ALERT SYSTEM ---
const showAlert = (type, title, message, onConfirm = null) => {
    alertState.type = type;
    alertState.title = title;
    alertState.message = message;
    alertState.confirmCallback = onConfirm;
    alertState.show = true;
}
const closeAlert = () => { alertState.show = false; alertState.confirmCallback = null; }
const confirmAlert = () => { if (alertState.confirmCallback) alertState.confirmCallback(); closeAlert(); }

// --- ACTIONS ---
const handleLogin = async () => {
    if (!loginForm.phone || !loginForm.password) return showAlert('error', 'Missing Info', 'Please enter both phone and password.');
    isLoggingIn.value = true;
    try {
        const res = await api.post('/delivery/login', loginForm);
        driver.value = res.data.staff;
        localStorage.setItem('cafex_driver_user', JSON.stringify(driver.value));
        await refreshDashboard();
    } catch (e) { showAlert('error', 'Login Failed', 'Invalid credentials. Please try again.'); } finally { isLoggingIn.value = false; }
}

const handleLogout = () => {
    showAlert('warning', 'Logout?', 'Are you sure you want to log out?', () => {
        driver.value = null; localStorage.removeItem('cafex_driver_user');
        activeDelivery.value = null; myOrders.value = [];
    });
}

const refreshDashboard = async () => {
    if (!driver.value) return;
    isLoading.value = true;
    
    // Fetch latest staff info (for status/image updates)
    await store.fetchDeliveryStaff();
    const freshDriver = store.staffList.find(s => s._id === driver.value._id);
    if(freshDriver) { 
        driver.value = freshDriver; 
        localStorage.setItem('cafex_driver_user', JSON.stringify(freshDriver)); 
    }

    // Fetch orders
    await store.fetchOrders();
    const allOrders = store.orders || [];
    
    // Sort and Filter
    myOrders.value = allOrders.filter(o => o.deliveryStaff === driver.value._id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Find active
    activeDelivery.value = myOrders.value.find(o => ['Pending', 'Preparing', 'Ready'].includes(o.deliveryStatus) && o.deliveryStatus !== 'Completed') || null;
    
    isLoading.value = false;
}

// --- PROFILE IMAGE UPLOAD ---
const triggerFileUpload = () => fileInput.value.click()
const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    isLoading.value = true;
    const success = await store.updateDriverProfile(driver.value._id, formData);
    if (success) {
        // Driver object updated in store, just refresh local ref
        const fresh = JSON.parse(localStorage.getItem('cafex_driver_user'));
        if (fresh) driver.value = fresh;
        showAlert('success', 'Profile Updated', 'Your profile picture has been changed.');
    }
    isLoading.value = false;
}

// --- DELIVERY LOGIC ---
const startDelivery = async (order) => { 
    activeDelivery.value = order; 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
}

const generatePaymentQR = async () => {
    if (!activeDelivery.value) return;
    isLoading.value = true;
    try {
        const res = await store.generateDriverQR(activeDelivery.value.id || activeDelivery.value._id);
        qrString.value = res.qrString;
        qrMd5.value = res.md5;
        qrExpiry.value = res.expirationTimestamp;
        showQRModal.value = true;
        startPolling();
        startCountdown();
    } catch (e) { 
        showAlert('error', 'Error', 'Failed to generate QR Code. Please check internet.'); 
    } finally { 
        isLoading.value = false; 
    }
}

const startPolling = () => {
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(async () => {
        const res = await store.checkPaymentStatus(qrMd5.value);
        if (res.status === 'success') { 
            closeQR(); 
            showAlert('success', 'Paid Successfully!', 'Payment verified via Bakong KHQR.'); 
            refreshDashboard(); 
        }
    }, 3000);
}

const startCountdown = () => {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        const dist = qrExpiry.value - Date.now();
        if (dist < 0) { closeQR(); showAlert('error', 'Expired', 'QR Code has expired. Generate a new one.'); }
        else { 
            const m = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((dist % (1000 * 60)) / 1000);
            timeLeft.value = `${m}:${s.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

const closeQR = () => { 
    showQRModal.value = false; 
    if (pollingInterval) clearInterval(pollingInterval); 
    if (countdownInterval) clearInterval(countdownInterval); 
}

const completeOrder = async () => {
    if (!activeDelivery.value) return;
    const isPaid = activeDelivery.value.paymentStatus === 'Paid';
    
    const confirmAction = async () => {
        try {
            await store.completeDelivery(activeDelivery.value.id || activeDelivery.value._id);
            activeDelivery.value = null; 
            await refreshDashboard(); 
            activeTab.value = 'history'; 
            showAlert('success', 'Great Job!', 'Delivery marked as completed. Status set to Active.');
        } catch (e) { showAlert('error', 'Error', 'Could not complete order. Try again.'); }
    };

    if (!isPaid) {
        showAlert('warning', 'Confirm Cash Payment', `Have you collected $${activeDelivery.value.amount.toFixed(2)} CASH from the customer?`, confirmAction);
    } else {
        showAlert('info', 'Complete Order?', 'Are you sure you want to finish this delivery?', confirmAction);
    }
}

const openTelegram = (u) => { 
    if (!u) return showAlert('error', 'No Username', 'Customer has not linked Telegram.'); 
    window.open(`https://t.me/${u.replace('@', '')}`, '_blank'); 
}

onUnmounted(() => { 
    socket.off("order-updated"); 
    socket.off("staff-status-changed");
    socket.disconnect(); 
    closeQR(); 
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans pb-24 text-gray-800 antialiased selection:bg-blue-100">
    
    <div v-if="!driver" class="min-h-screen flex flex-col justify-center px-8 bg-white relative overflow-hidden">
        <div class="absolute -top-20 -right-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 animate-blob"></div>
        <div class="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        
        <div class="mb-12 text-center relative z-10 animate-slide-up">
            <div class="w-32 h-32 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl shadow-blue-200 mb-8 transform hover:scale-105 transition duration-500">
                <TruckIcon class="w-16 h-16 text-white drop-shadow-md" />
            </div>
            <h1 class="text-5xl font-black text-gray-900 tracking-tighter mb-3">Driver<span class="text-blue-600">.</span></h1>
            <p class="text-gray-500 font-medium text-lg">Partner Delivery Portal</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6 relative z-10 animate-slide-up" style="animation-delay: 0.1s;">
            <div class="group">
                <div class="bg-gray-50 border-2 border-gray-100 rounded-2xl flex items-center px-4 py-1 transition-all group-focus-within:border-blue-500 group-focus-within:bg-white group-focus-within:shadow-lg group-focus-within:shadow-blue-100">
                    <PhoneIcon class="w-6 h-6 text-gray-400 group-focus-within:text-blue-500 transition mr-3" />
                    <input v-model="loginForm.phone" type="tel" class="w-full py-4 bg-transparent outline-none font-bold text-lg text-gray-800 placeholder-gray-400" placeholder="Phone Number">
                </div>
            </div>
            <div class="group">
                <div class="bg-gray-50 border-2 border-gray-100 rounded-2xl flex items-center px-4 py-1 transition-all group-focus-within:border-blue-500 group-focus-within:bg-white group-focus-within:shadow-lg group-focus-within:shadow-blue-100">
                    <ShieldCheckIcon class="w-6 h-6 text-gray-400 group-focus-within:text-blue-500 transition mr-3" />
                    <input v-model="loginForm.password" type="password" class="w-full py-4 bg-transparent outline-none font-bold text-lg text-gray-800 placeholder-gray-400" placeholder="Password">
                </div>
            </div>
            <button :disabled="isLoggingIn" class="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold text-lg shadow-xl hover:bg-black transition active:scale-95 flex justify-center items-center gap-3">
                <span v-if="isLoggingIn" class="loader"></span>
                <span v-else>Login Securely</span>
                <ArrowRightOnRectangleIcon v-if="!isLoggingIn" class="w-5 h-5 opacity-70"/>
            </button>
        </form>
    </div>

    <div v-else class="animate-fade-in">
        
        <div class="bg-white/90 backdrop-blur-md px-6 pt-12 pb-4 sticky top-0 z-30 border-b border-gray-100 transition-all">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <p class="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Welcome Back,</p>
                    <h2 class="text-3xl font-black text-gray-900 tracking-tight">{{ driver.name.split(' ')[0] }}</h2>
                </div>
                <div @click="activeTab = 'profile'" class="relative cursor-pointer hover:scale-105 transition duration-300">
                    <img :src="driver.image || 'https://cdn-icons-png.flaticon.com/512/1995/1995515.png'" class="w-14 h-14 rounded-full border-4 border-white shadow-lg object-cover bg-gray-100">
                    <div :class="['absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-colors duration-500', driverStatus === 'Active' ? 'bg-green-500' : 'bg-red-500']"></div>
                </div>
            </div>
        </div>

        <div class="p-5 pb-32">
            
            <div v-if="activeTab === 'tasks'">
                
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-gray-900 text-lg flex items-center gap-2">My Dashboard <span v-if="isLoading" class="loader !w-4 !h-4 !border-gray-300"></span></h3>
                    <button @click="refreshDashboard" class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-gray-600 hover:rotate-180 transition duration-500 active:bg-gray-100">
                        <ArrowPathIcon class="w-5 h-5"/>
                    </button>
                </div>

                <div v-if="activeDelivery" class="bg-gray-900 text-white rounded-[2.5rem] p-1 shadow-2xl shadow-blue-900/30 mb-8 relative group overflow-hidden animate-slide-up">
                    <div class="absolute inset-0 bg-gradient-to-br from-gray-800 to-black rounded-[2.5rem]"></div>
                    <div class="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/30 rounded-full blur-[80px]"></div>
                    
                    <div class="relative p-7">
                        <div class="flex justify-between items-start mb-8">
                            <div>
                                <span class="bg-green-500/20 text-green-400 text-[10px] font-bold px-3 py-1 rounded-full border border-green-500/30 uppercase tracking-wide animate-pulse">● Live Order</span>
                                <h3 class="text-3xl font-black mt-3 leading-none">{{ activeDelivery.customer.name }}</h3>
                            </div>
                            <div class="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-lg">
                                <TruckIcon class="w-8 h-8 text-blue-400"/>
                            </div>
                        </div>

                        <div class="space-y-5 mb-8">
                            <div class="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-blue-300"><PhoneIcon class="w-5 h-5"/></div>
                                <div>
                                    <p class="text-xs text-gray-400 uppercase font-bold">Contact</p>
                                    <p class="font-bold text-lg">{{ activeDelivery.customer.phone }}</p>
                                </div>
                            </div>
                            
                            <div class="flex items-start gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-red-300 shrink-0"><MapPinIcon class="w-5 h-5"/></div>
                                <div>
                                    <p class="text-xs text-gray-400 uppercase font-bold">Location</p>
                                    <p class="font-bold text-lg leading-snug">{{ activeDelivery.customer.address }}</p>
                                    <p v-if="activeDelivery.landmark" class="text-sm text-yellow-300/80 mt-1 italic">"{{ activeDelivery.landmark }}"</p>
                                </div>
                            </div>
                        </div>

                        <div class="mb-8 flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                            <div>
                                <p class="text-xs text-gray-400 font-bold uppercase">Amount Due</p>
                                <p class="text-2xl font-black">${{ activeDelivery.amount.toFixed(2) }}</p>
                            </div>
                            <div :class="['px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all', activeDelivery.paymentStatus === 'Paid' ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-red-500 text-white shadow-red-500/30']">
                                {{ activeDelivery.paymentStatus === 'Paid' ? 'PAID' : 'PENDING' }}
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <button v-if="activeDelivery.paymentStatus !== 'Paid'" @click="generatePaymentQR" class="col-span-2 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition transform active:scale-95">
                                <QrCodeIcon class="w-5 h-5" /> Generate KHQR
                            </button>
                            
                            <button @click="openTelegram(activeDelivery.customer.telegramUsername)" class="bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-bold backdrop-blur-md flex items-center justify-center gap-2 transition"><ChatBubbleLeftRightIcon class="w-5 h-5 text-blue-300" /> Chat</button>
                            <a :href="`tel:${activeDelivery.customer.phone}`" class="bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-bold backdrop-blur-md flex items-center justify-center gap-2 transition"><PhoneIcon class="w-5 h-5 text-green-300" /> Call</a>
                            
                            <button @click="completeOrder" class="col-span-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 transition transform active:scale-95 mt-2">
                                <CheckCircleIcon class="w-6 h-6" /> Mark as Delivered
                            </button>
                        </div>
                    </div>
                </div>

                <div v-if="pendingOrders.length > 0 && !activeDelivery" class="animate-slide-up" style="animation-delay: 0.1s;">
                    <h3 class="font-bold text-gray-400 uppercase text-xs mb-4 ml-1 tracking-widest">Available Tasks</h3>
                    <div v-for="order in pendingOrders" :key="order.id" class="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 mb-4 hover:shadow-lg transition-all hover:-translate-y-1 group">
                        <div class="flex justify-between items-start mb-4">
                            <div class="flex gap-4">
                                <div class="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition">
                                    <ArchiveBoxIcon class="w-6 h-6"/>
                                </div>
                                <div>
                                    <h4 class="font-bold text-gray-900 text-lg">{{ order.customer.name }}</h4>
                                    <p class="text-xs text-gray-500 font-mono mt-0.5">#{{ order.billNumber?.slice(-6) }}</p>
                                </div>
                            </div>
                            <span :class="['text-[10px] font-bold px-3 py-1.5 rounded-xl border', order.paymentMethod === 'cash' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100']">
                                {{ order.paymentMethod === 'cash' ? 'CASH' : 'PAID' }}
                            </span>
                        </div>
                        <div class="flex items-center justify-between border-t border-gray-50 pt-4 mt-2">
                            <p class="text-xs text-gray-400 font-bold uppercase">Earning</p>
                            <p class="text-xl font-black text-gray-900">${{ (order.amount || order.total).toFixed(2) }}</p>
                        </div>
                        <button @click="startDelivery(order)" class="w-full bg-gray-900 text-white mt-4 py-4 rounded-2xl font-bold text-sm hover:bg-black transition flex justify-center items-center gap-2 shadow-lg shadow-gray-200 active:scale-95">
                            Accept Task <ArrowRightOnRectangleIcon class="w-4 h-4"/>
                        </button>
                    </div>
                </div>

                <div v-if="pendingOrders.length === 0 && !activeDelivery" class="text-center py-24 opacity-60">
                    <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <TruckIcon class="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 class="text-xl font-black text-gray-900">All Caught Up!</h3>
                    <p class="text-gray-500 mt-2">You have no pending deliveries.</p>
                </div>
            </div>

            <div v-if="activeTab === 'history'" class="animate-fade-in">
                <div class="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2.5rem] p-8 text-white mb-10 shadow-xl shadow-emerald-500/20 relative overflow-hidden">
                    <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <p class="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Total Earnings</p>
                    <div class="flex justify-between items-end relative z-10">
                        <h2 class="text-5xl font-black tracking-tight">${{ totalEarnings.toFixed(2) }}</h2>
                        <div class="bg-white/20 p-3 rounded-2xl backdrop-blur-md"><BanknotesIcon class="w-8 h-8 text-white"/></div>
                    </div>
                </div>

                <div v-if="completedOrders.length > 0" class="space-y-4">
                    <h3 class="font-bold text-gray-400 uppercase text-xs mb-2 ml-1 tracking-widest">Recent Activity</h3>
                    <div v-for="order in completedOrders" :key="order.id" class="bg-white p-5 rounded-[1.5rem] border border-gray-100 flex justify-between items-center shadow-sm hover:shadow-md transition">
                        <div class="flex items-center gap-4">
                            <div class="bg-green-50 p-3.5 rounded-2xl text-green-600"><CheckCircleIcon class="w-6 h-6"/></div>
                            <div>
                                <h4 class="font-bold text-gray-900 text-sm">{{ order.customer.name }}</h4>
                                <p class="text-[10px] text-gray-400 mt-0.5">{{ new Date(order.createdAt).toLocaleDateString() }} • {{ new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</p>
                            </div>
                        </div>
                        <span class="font-black text-gray-900 text-lg">+${{ (order.amount || order.total).toFixed(2) }}</span>
                    </div>
                </div>
                
                <div v-else class="text-center py-20 text-gray-400">
                    <ArchiveBoxIcon class="w-16 h-16 mx-auto mb-4 opacity-30"/>
                    <p>No history available</p>
                </div>
            </div>

            <div v-if="activeTab === 'profile'" class="animate-fade-in">
                <div class="text-center mb-10 pt-4">
                    <div class="relative w-32 h-32 mx-auto mb-5 group cursor-pointer" @click="triggerFileUpload">
                        <img :src="driver.image || 'https://cdn-icons-png.flaticon.com/512/1995/1995515.png'" class="w-full h-full rounded-full object-cover border-4 border-white shadow-2xl shadow-blue-100 transition duration-500 group-hover:scale-105">
                        <div class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 backdrop-blur-[2px]">
                            <CameraIcon class="w-8 h-8 text-white drop-shadow-lg" />
                        </div>
                        <input type="file" ref="fileInput" @change="handleImageUpload" class="hidden" accept="image/*">
                        <div v-if="isLoading" class="absolute inset-0 bg-white/80 flex items-center justify-center rounded-full"><span class="loader border-gray-400"></span></div>
                    </div>
                    <h2 class="text-3xl font-black text-gray-900 mb-1">{{ driver.name }}</h2>
                    <div class="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Verified Partner</span>
                    </div>
                </div>

                <div class="space-y-4 bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                    <div class="flex items-center gap-4 p-2">
                        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><PhoneIcon class="w-6 h-6"/></div>
                        <div class="flex-1">
                            <p class="text-xs text-gray-400 font-bold uppercase">Phone Number</p>
                            <p class="font-bold text-gray-900">{{ driver.phone }}</p>
                        </div>
                    </div>
                    <div class="h-px bg-gray-50 w-full"></div>
                    <div class="flex items-center gap-4 p-2">
                        <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center"><UserCircleIcon class="w-6 h-6"/></div>
                        <div class="flex-1">
                            <p class="text-xs text-gray-400 font-bold uppercase">Email</p>
                            <p class="font-bold text-gray-900 truncate">{{ driver.email || 'Not Linked' }}</p>
                        </div>
                    </div>
                    <div class="h-px bg-gray-50 w-full"></div>
                    <div class="flex items-center gap-4 p-2">
                        <div class="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center"><StarIcon class="w-6 h-6"/></div>
                        <div class="flex-1">
                            <p class="text-xs text-gray-400 font-bold uppercase">Rating</p>
                            <p class="font-bold text-gray-900">{{ driver.rating }} / 5.0</p>
                        </div>
                    </div>
                    <div class="h-px bg-gray-50 w-full"></div>
                    <div class="flex items-center gap-4 p-2">
                        <div class="w-12 h-12 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center"><ShieldCheckIcon class="w-6 h-6"/></div>
                        <div class="flex-1">
                            <p class="text-xs text-gray-400 font-bold uppercase">Status</p>
                            <p class="font-bold" :class="driverStatus==='Active'?'text-green-600':'text-red-600'">{{ driverStatus }}</p>
                        </div>
                    </div>
                </div>

                <button @click="handleLogout" class="w-full mt-8 py-5 rounded-2xl text-red-600 font-black bg-red-50 hover:bg-red-100 transition flex items-center justify-center gap-3 active:scale-95">
                    <ArrowRightOnRectangleIcon class="w-6 h-6" /> LOGOUT
                </button>
            </div>

        </div>

        <div class="fixed bottom-6 left-6 right-6 bg-gray-900/90 backdrop-blur-xl text-white rounded-[2.5rem] px-8 py-4 flex justify-between items-center shadow-2xl shadow-gray-900/40 z-40 max-w-sm mx-auto transition-all">
            <button @click="activeTab = 'tasks'" :class="['nav-item', activeTab === 'tasks' ? 'text-white scale-110' : 'text-gray-500']">
                <TruckIcon class="w-7 h-7" />
                <div v-if="activeTab === 'tasks'" class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
            </button>
            <button @click="activeTab = 'history'" :class="['nav-item', activeTab === 'history' ? 'text-white scale-110' : 'text-gray-500']">
                <ClockIcon class="w-7 h-7" />
                <div v-if="activeTab === 'history'" class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
            </button>
            <button @click="activeTab = 'profile'" :class="['nav-item', activeTab === 'profile' ? 'text-white scale-110' : 'text-gray-500']">
                <UserIcon class="w-7 h-7" />
                <div v-if="activeTab === 'profile'" class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
            </button>
        </div>

    </div>

    <transition name="pop">
        <div v-if="alertState.show" class="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <div class="bg-white rounded-[2.5rem] p-8 w-full max-w-sm text-center shadow-2xl animate-bounce-in">
                <div :class="['w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg', alertState.type === 'success' ? 'bg-green-100 text-green-500' : alertState.type === 'error' ? 'bg-red-100 text-red-500' : 'bg-yellow-100 text-yellow-500']">
                    <CheckCircleIcon v-if="alertState.type === 'success'" class="w-10 h-10"/>
                    <XMarkIcon v-else-if="alertState.type === 'error'" class="w-10 h-10"/>
                    <ExclamationTriangleIcon v-else class="w-10 h-10"/>
                </div>
                <h3 class="text-2xl font-black text-gray-900 mb-2">{{ alertState.title }}</h3>
                <p class="text-gray-500 font-medium mb-8 leading-relaxed">{{ alertState.message }}</p>
                <div class="flex gap-3">
                    <button v-if="alertState.confirmCallback" @click="closeAlert" class="flex-1 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">Cancel</button>
                    <button @click="confirmAlert" :class="['flex-1 py-3.5 rounded-xl font-bold text-white shadow-lg transition transform active:scale-95', alertState.type === 'error' ? 'bg-red-500 shadow-red-200' : 'bg-gray-900 shadow-gray-200']">
                        {{ alertState.confirmCallback ? 'Confirm' : 'Okay' }}
                    </button>
                </div>
            </div>
        </div>
    </transition>

    <transition name="pop">
        <div v-if="showQRModal" class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <div class="bg-white rounded-[3rem] p-8 w-full max-w-sm text-center relative shadow-2xl shadow-blue-500/20 animate-pop-in">
                <button @click="closeQR" class="absolute top-6 right-6 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition"><XMarkIcon class="w-6 h-6" /></button>
                <h2 class="text-3xl font-black text-gray-900 mb-2">Scan to Pay</h2>
                <p class="text-gray-500 font-medium mb-8">Amount: <span class="text-gray-900 font-bold">${{ activeDelivery?.amount.toFixed(2) }}</span></p>
                
                <div class="bg-white p-4 rounded-3xl inline-block border-[3px] border-dashed border-blue-100 mb-8 relative">
                    <qrcode-vue :value="qrString" :size="220" level="H" class="rounded-xl"/>
                    <div class="absolute -bottom-3 -right-3 bg-blue-600 text-white p-2 rounded-xl shadow-lg"><QrCodeIcon class="w-6 h-6"/></div>
                </div>
                
                <div class="flex items-center justify-center gap-2 text-red-500 font-mono font-bold text-2xl mb-2">
                    <ClockIcon class="w-7 h-7" /> {{ timeLeft }}
                </div>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Waiting for confirmation...</p>
            </div>
        </div>
    </transition>

  </div>
</template>

<style scoped>
/* ANIMATIONS */
.animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }

.animate-blob { animation: blob 7s infinite; }
@keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
.animation-delay-2000 { animation-delay: 2s; }

.animate-bounce-in { animation: bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes bounceIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }

.animate-pop-in { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }

.pop-enter-active, .pop-leave-active { transition: all 0.3s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }

.nav-item { @apply relative transition-all duration-300 ease-out active:scale-90; }
.loader { @apply w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block; }
</style>