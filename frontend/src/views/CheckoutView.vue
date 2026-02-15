<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMainStore } from '@/stores/mainStore'
import QrcodeVue from 'qrcode.vue'
import { 
  ShoppingBagIcon, TruckIcon, ShieldCheckIcon, BanknotesIcon, CreditCardIcon,
  XMarkIcon, ArrowLeftIcon, ClockIcon, CheckCircleIcon, UserIcon, 
  ChatBubbleLeftRightIcon, GiftIcon, ChevronDownIcon, StarIcon
} from '@heroicons/vue/24/outline'
import { StarIcon as StarSolid } from '@heroicons/vue/24/solid'

const store = useMainStore()
const router = useRouter()

// Redirect if empty cart
if (store.cart.length === 0) router.push('/')

// --- STATE ---
const paymentMethod = ref('cash')
const isProcessing = ref(false)
const showQRModal = ref(false)
const showSuccessModal = ref(false)
const successMessage = ref('') 
const qrString = ref('')
const transactionMd5 = ref('')
const paidAmount = ref(0) 
const selectedStaffId = ref('') // Stores ID for dropdown

const timeLeft = ref('') 
let pollingInterval = null
let countdownInterval = null

const form = reactive({
  name: store.currentUser?.name || '',
  phone: store.currentUser?.phone || '',
  telegramUsername: '',
  address: '', 
  landmark: '',
})

// --- COMPUTED ---
const total = computed(() => store.cartTotalValue)
const pointsUsed = computed(() => store.pointsInCart)
const availableStaff = computed(() => store.staffList || [])

// Find the full object of the selected driver to show details if needed
const selectedDriver = computed(() => availableStaff.value.find(s => s._id === selectedStaffId.value))

const formatCurrency = (val) => `$${Number(val).toFixed(2)}`
const displayPrice = (price, isReward) => (isReward || price === 0) ? 'FREE' : formatCurrency(price)

// --- LIFECYCLE ---
onMounted(async () => {
  await store.fetchDeliveryStaff()
  
  const savedData = localStorage.getItem('cafex_manual_address');
  if (savedData) {
      const parsed = JSON.parse(savedData);
      form.address = parsed.address || '';
      form.landmark = parsed.landmark || '';
      form.telegramUsername = parsed.telegramUsername || '';
  }
})

// --- PLACE ORDER ---
const handlePlaceOrder = async () => {
  if (!form.name || !form.phone || !form.address) { 
      store.showToast('Please fill in Name, Phone, and Address', 'error'); 
      return 
  }
  
  if (!selectedStaffId.value) { 
      store.showToast('Please select a Driver', 'error'); 
      return 
  }

  localStorage.setItem('cafex_manual_address', JSON.stringify({
      address: form.address,
      landmark: form.landmark,
      telegramUsername: form.telegramUsername
  }));

  isProcessing.value = true
  paidAmount.value = total.value 

  const orderPayload = { 
      customer: {
          name: form.name,
          phone: form.phone,
          address: form.address,
          telegramUsername: form.telegramUsername,
          email: store.currentUser?.email || ""
      },
      cart: store.cart,
      totalAmount: total.value,
      isKHQR: paymentMethod.value === 'khqr',
      pointsUsed: pointsUsed.value,
      deliveryStaffId: selectedStaffId.value, 
      landmark: form.landmark
  }

  try {
    const result = await store.createOrder(paymentMethod.value, orderPayload)
    
    if (paymentMethod.value === 'cash' || paidAmount.value === 0) {
      triggerSuccess("Order Placed Successfully!")
    } else {
      if (result && result.qrString) {
        qrString.value = result.qrString
        transactionMd5.value = result.md5
        showQRModal.value = true
        startPolling()
        startCountdown(result.expirationTimestamp) 
      } else { 
        store.showToast('QR Generation Failed', 'error') 
      }
    }
  } catch (error) { 
    console.error(error);
    store.showToast('Order Failed. Please try again.', 'error') 
  } finally { 
    isProcessing.value = false 
  }
}

// --- POLLING & TIMERS ---
const startPolling = () => {
  if (pollingInterval) clearInterval(pollingInterval)
  pollingInterval = setInterval(async () => {
    const res = await store.checkPaymentStatus(transactionMd5.value)
    if (res.status === 'success') { triggerSuccess("Payment Verified Successfully!") }
  }, 3000)
}

const triggerSuccess = (msg) => { 
    successMessage.value = msg; 
    closeQR(); 
    store.cart = []; 
    store.syncCartToDB(); 
    store.fetchOrders(); 
    showSuccessModal.value = true 
}

const finishOrder = () => router.push('/profile')

const startCountdown = (expiryTime) => {
  if (countdownInterval) clearInterval(countdownInterval)
  countdownInterval = setInterval(() => {
    const now = Date.now(); 
    const distance = expiryTime - now;
    if (distance < 0) handleExpired()
    else { 
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)); 
        const seconds = Math.floor((distance % (1000 * 60)) / 1000); 
        timeLeft.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` 
    }
  }, 1000)
}

const handleExpired = () => { closeQR(); store.showToast('QR Code Expired!', 'error') }
const closeQR = () => { showQRModal.value = false; if (pollingInterval) clearInterval(pollingInterval); if (countdownInterval) clearInterval(countdownInterval) }
onUnmounted(() => closeQR())
</script>

<template>
  <div class="min-h-screen bg-[#F8F9FA] py-12 px-4 font-sans animate-fade-in pb-24">
    <div class="max-w-5xl mx-auto">
      
      <div class="flex items-center gap-4 mb-10">
        <button @click="router.back()" class="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition shadow-sm hover:shadow-md">
          <ArrowLeftIcon class="w-5 h-5 text-gray-700" />
        </button>
        <h1 class="text-4xl font-black text-gray-900 tracking-tight">Checkout</h1>
      </div>

      <div class="grid lg:grid-cols-3 gap-8">
        
        <div class="lg:col-span-2 space-y-8">
          
          <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <div class="flex items-center gap-4 mb-6">
              <div class="bg-coffee-50 p-3 rounded-2xl text-coffee-600"><TruckIcon class="w-6 h-6" /></div>
              <div>
                <h2 class="font-bold text-xl text-gray-900">Delivery Information</h2>
                <p class="text-xs text-gray-500">We will contact you if we can't find your location.</p>
              </div>
            </div>
            
            <div class="grid md:grid-cols-2 gap-6 mb-6">
              <div class="space-y-2">
                <label class="text-xs font-bold text-gray-500 uppercase ml-1">Full Name</label>
                <input v-model="form.name" type="text" class="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-50 transition text-sm font-medium">
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold text-gray-500 uppercase ml-1">Phone Number</label>
                <input v-model="form.phone" type="tel" class="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-50 transition text-sm font-medium">
              </div>
              
              <div class="md:col-span-2 space-y-2">
                <label class="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-2">
                    <ChatBubbleLeftRightIcon class="w-4 h-4 text-blue-500"/> Telegram Username (Optional)
                </label>
                <div class="relative">
                    <span class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                    <input v-model="form.telegramUsername" type="text" class="w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-50 transition text-sm font-medium" placeholder="username">
                </div>
                <p class="text-[10px] text-gray-400 ml-2">Allows the driver to chat with you easily.</p>
              </div>

              <div class="md:col-span-2 space-y-2">
                <label class="text-xs font-bold text-gray-500 uppercase ml-1">Delivery Address</label>
                <input v-model="form.address" type="text" class="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-50 transition text-sm font-medium" placeholder="House number, Street name, Sangkat, City...">
              </div>

              <div class="md:col-span-2 space-y-2">
                <label class="text-xs font-bold text-gray-500 uppercase ml-1">Landmark / Note</label>
                <textarea v-model="form.landmark" class="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-50 transition text-sm font-medium h-24 resize-none" placeholder="e.g. Near the red gate, opposite the ACLEDA Bank. Call me when arrived."></textarea>
              </div>
            </div>
          </div>

          <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <div class="flex items-center gap-4 mb-6">
              <div class="bg-blue-50 p-3 rounded-2xl text-blue-600"><UserIcon class="w-6 h-6" /></div>
              <div>
                <h2 class="font-bold text-xl text-gray-900">Choose Your Driver</h2>
                <p class="text-xs text-gray-500">Select an available delivery partner</p>
              </div>
            </div>

            <div class="relative group">
                <select v-model="selectedStaffId" class="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition text-sm font-bold appearance-none cursor-pointer text-gray-700">
                    <option value="" disabled selected>Select a driver...</option>
                    <option v-for="staff in availableStaff" :key="staff._id" :value="staff._id" :disabled="staff.status !== 'Active'" class="py-2">
                        {{ staff.name }} ({{ staff.vehicleType }}) - {{ staff.status }} {{ staff.status === 'Active' ? '🟢' : '🔴' }}
                    </option>
                </select>
                <ChevronDownIcon class="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-blue-500 transition"/>
            </div>

            <transition name="fade">
                <div v-if="selectedDriver" class="mt-4 flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <img :src="selectedDriver.image || 'https://via.placeholder.com/150'" class="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm">
                    <div>
                        <p class="font-bold text-gray-900 text-sm">{{ selectedDriver.name }}</p>
                        <div class="flex items-center gap-2 text-xs text-gray-600">
                            <span>{{ selectedDriver.vehicleType }}</span>
                            <span class="w-1 h-1 bg-gray-400 rounded-full"></span>
                            <span class="flex items-center gap-0.5 font-bold text-yellow-600"><StarSolid class="w-3 h-3"/> {{ selectedDriver.rating.toFixed(1) }}</span>
                        </div>
                    </div>
                    <div class="ml-auto text-green-600 bg-white px-3 py-1 rounded-lg text-xs font-black shadow-sm">SELECTED</div>
                </div>
            </transition>
          </div>
          
          <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
              <div class="flex items-center gap-4 mb-6">
               <div class="bg-coffee-50 p-3 rounded-2xl text-coffee-600"><ShieldCheckIcon class="w-6 h-6" /></div>
               <div>
                 <h2 class="font-bold text-xl text-gray-900">Payment Method</h2>
                 <p class="text-xs text-gray-500">Secure and encrypted transaction.</p>
               </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
               <button @click="paymentMethod = 'cash'" :class="['relative p-6 border-2 rounded-3xl flex flex-col items-center gap-3 transition-all duration-300', paymentMethod === 'cash' ? 'border-coffee-600 bg-coffee-50/30 shadow-md transform scale-[1.02]' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50']">
                 <div v-if="paymentMethod === 'cash'" class="absolute top-3 right-3 text-coffee-600"><CheckCircleIcon class="w-6 h-6" /></div>
                 <BanknotesIcon :class="['w-10 h-10', paymentMethod === 'cash' ? 'text-coffee-600' : 'text-gray-400']" />
                 <span :class="['font-bold text-sm', paymentMethod === 'cash' ? 'text-coffee-900' : 'text-gray-500']">Cash on Delivery</span>
               </button>
               <button @click="paymentMethod = 'khqr'" :class="['relative p-6 border-2 rounded-3xl flex flex-col items-center gap-3 transition-all duration-300', paymentMethod === 'khqr' ? 'border-red-500 bg-red-50/30 shadow-md transform scale-[1.02]' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50']">
                 <div v-if="paymentMethod === 'khqr'" class="absolute top-3 right-3 text-red-500"><CheckCircleIcon class="w-6 h-6" /></div>
                 <CreditCardIcon :class="['w-10 h-10', paymentMethod === 'khqr' ? 'text-red-500' : 'text-gray-400']" />
                 <span :class="['font-bold text-sm', paymentMethod === 'khqr' ? 'text-red-900' : 'text-gray-500']">KHQR Scan</span>
               </button>
              </div>
          </div>
        </div>

        <div class="h-fit lg:sticky lg:top-6">
          <div class="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100/50">
            <h2 class="font-black text-xl text-gray-900 mb-8 flex items-center gap-3"><ShoppingBagIcon class="w-6 h-6 text-gray-400" /> Order Summary</h2>
            
            <div class="space-y-5 mb-8 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              <div v-for="item in store.cart" :key="item.id" class="flex justify-between items-center group">
                <div class="flex items-center gap-4">
                  <div class="relative">
                    <img :src="item.image" class="w-12 h-12 rounded-xl object-cover bg-gray-100 border border-gray-100">
                    <div class="absolute -top-2 -right-2 bg-gray-900 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md">{{ item.quantity }}</div>
                  </div>
                  <div>
                    <span class="text-sm font-bold text-gray-900 block leading-tight">{{ item.name }}</span>
                    <span v-if="item.isReward" class="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">REWARD</span>
                  </div>
                </div>
                <span class="font-bold text-sm" :class="item.price === 0 ? 'text-green-600' : 'text-gray-900'">{{ displayPrice(item.price * item.quantity, item.isReward) }}</span>
              </div>
            </div>

            <div class="space-y-3 py-6 border-t border-dashed border-gray-200">
              <div class="flex justify-between items-center text-sm text-gray-500"><span>Subtotal</span><span>{{ formatCurrency(total) }}</span></div>
              <div v-if="pointsUsed > 0" class="flex justify-between items-center text-sm font-bold text-amber-600 bg-amber-50 p-2 rounded-lg"><span class="flex items-center gap-1"><GiftIcon class="w-4 h-4" /> Points Redeemed</span><span>-{{ pointsUsed }} pts</span></div>
              <div class="flex justify-between items-end pt-2"><span class="text-lg font-bold text-gray-900">Total</span><span class="text-3xl font-black text-gray-900">{{ displayPrice(total, false) }}</span></div>
            </div>

            <button @click="handlePlaceOrder" :disabled="isProcessing" class="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-coffee-600 transition shadow-xl flex justify-center items-center gap-3">
              <span v-if="isProcessing" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
              {{ paymentMethod === 'khqr' ? 'Pay with QR' : 'Place Order' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showQRModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm transition-all">
      <div class="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center relative shadow-2xl animate-pop-in border border-white/20">
        <button @click="closeQR" class="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition transform hover:rotate-90"><XMarkIcon class="w-6 h-6" /></button>
        <div class="mb-6"><h2 class="text-2xl font-black text-gray-900 mb-1">Scan to Pay</h2><p class="text-gray-500 text-sm">Supports all major banking apps</p></div>
        <div class="bg-white p-6 rounded-[2rem] inline-block mb-6 border-4 border-dashed border-gray-100 shadow-inner"><qrcode-vue :value="qrString" :size="200" level="H" render-as="svg" /></div>
        <div class="flex items-center justify-center gap-2 mb-6 bg-red-50 py-2 rounded-xl mx-auto w-fit px-5"><ClockIcon class="w-5 h-5 text-red-500" /><span class="text-red-500 font-mono font-bold text-lg animate-pulse">{{ timeLeft }}</span></div>
        <div class="border-t border-gray-100 pt-6"><p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Amount Due</p><p class="text-4xl font-black text-gray-900">${{ paidAmount.toFixed(2) }}</p></div>
        <div class="mt-6 flex items-center justify-center gap-3 text-sm font-bold text-coffee-600 bg-coffee-50 py-3.5 rounded-2xl animate-pulse"><span class="animate-spin h-4 w-4 border-2 border-coffee-600 border-t-transparent rounded-full"></span> Waiting for confirmation...</div>
      </div>
    </div>

    <transition name="success-pop">
      <div v-if="showSuccessModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-white/95 backdrop-blur-xl">
        <div class="confetti-container"><div v-for="n in 20" :key="n" class="confetti"></div></div>
        <div class="bg-white rounded-[3rem] p-12 max-w-sm w-full text-center shadow-2xl border border-gray-100 transform relative overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-50 to-transparent opacity-60"></div>
          <div class="relative w-32 h-32 mx-auto mb-8">
            <div class="absolute inset-0 bg-green-100 rounded-full animate-ripple"></div>
            <div class="relative bg-green-500 rounded-full w-full h-full flex items-center justify-center shadow-xl shadow-green-200">
              <CheckCircleIcon class="w-16 h-16 text-white" />
            </div>
          </div>
          <h2 class="text-4xl font-black text-gray-900 mb-3 tracking-tight">Success!</h2>
          <p class="text-gray-500 font-medium mb-10 text-lg leading-relaxed">{{ successMessage }}</p>
          <div class="bg-gray-50 rounded-3xl p-6 mb-10 border border-gray-100 relative">
            <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Paid</p>
            <p class="text-4xl font-black text-gray-900">{{ displayPrice(paidAmount) }}</p>
          </div>
          <button @click="finishOrder" class="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-600 transition-all duration-300 shadow-xl">Track My Order</button>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
.animate-pop-in { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.success-pop-enter-active { animation: springUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes springUp { 0% { transform: scale(0.8) translateY(20px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
@keyframes ripple { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.5); opacity: 0; } }
.animate-ripple { animation: ripple 1.5s infinite ease-out; }
.confetti-container { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.confetti { position: absolute; width: 10px; height: 10px; background-color: #f00; top: -10px; animation: fall 3s linear infinite; }
.confetti:nth-child(2n) { background-color: #ffd700; left: 20%; animation-delay: 0.5s; }
.confetti:nth-child(3n) { background-color: #008000; left: 50%; animation-delay: 1.2s; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
@keyframes fall { to { transform: translateY(100vh) rotate(720deg); } }

/* FADE ANIMATION */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>