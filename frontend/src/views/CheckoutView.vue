<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMainStore } from '@/stores/mainStore'
import { 
  CheckBadgeIcon, 
  MapPinIcon, 
  UserIcon, 
  PhoneIcon, 
  CreditCardIcon, 
  BanknotesIcon, 
  TruckIcon,
  ShoppingBagIcon,
  ShieldCheckIcon,
  GiftIcon // Added Gift Icon for visual touch
} from '@heroicons/vue/24/outline'

const store = useMainStore()
const router = useRouter()

// Redirect if cart is empty
if (store.cart.length === 0) {
  router.push('/')
}

// State
const paymentMethod = ref('cash')
const showSuccess = ref(false)
const isProcessing = ref(false)
const saveInfo = ref(true) 
const deliveryFee = 1.50 

// User Details Form
const form = reactive({
  name: '',
  phone: '',
  address: '',
  note: ''
})

const errors = reactive({
  name: false,
  phone: false,
  address: false
})

// Pre-fill data if user is logged in
onMounted(() => {
  if (store.currentUser) {
    form.name = store.currentUser.name || ''
    form.phone = store.currentUser.phone || ''
    form.address = store.currentUser.address || ''
  }
})

// Calculations
const subtotal = computed(() => store.cart.reduce((s, i) => s + (i.price * i.quantity), 0))
const total = computed(() => subtotal.value + deliveryFee)
const formatCurrency = (val) => `$${val.toFixed(2)}`

// Actions
const validateForm = () => {
  let isValid = true
  errors.name = !form.name
  errors.phone = !form.phone
  errors.address = !form.address
  
  if (!form.name || !form.phone || !form.address) isValid = false
  return isValid
}

const handlePayment = () => {
  if (!validateForm()) {
    store.showToast('Please fill in required fields.', 'error')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  isProcessing.value = true

  setTimeout(() => {
    store.placeOrder(
      paymentMethod.value, 
      {
        name: form.name,
        phone: form.phone,
        address: form.address,
        note: form.note
      },
      saveInfo.value
    )
    
    isProcessing.value = false
    showSuccess.value = true
    
    setTimeout(() => {
      router.push('/profile')
    }, 3500)
  }, 1500)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 font-sans">
    
    <div v-if="showSuccess" class="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-md animate-fade-in">
      <div class="text-center animate-bounce-in max-w-sm w-full p-8 bg-white rounded-3xl shadow-2xl border border-gray-100">
        <div class="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
          <CheckBadgeIcon class="w-14 h-14" />
        </div>
        <h2 class="text-3xl font-extrabold text-gray-900 mb-2">Order Confirmed!</h2>
        <p class="text-gray-500 mb-8">We've received your order. Redirecting you to your profile...</p>
        <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div class="bg-green-500 h-full animate-progress"></div>
        </div>
      </div>
    </div>

    <div v-else class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
        <ShoppingBagIcon class="w-8 h-8 text-coffee-600" /> Checkout
      </h1>

      <div class="grid lg:grid-cols-3 gap-8">
        
        <div class="lg:col-span-2 space-y-6">
          
          <div class="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span class="bg-coffee-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold">1</span>
              Delivery Details
            </h2>
            
            <div class="grid md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">Full Name <span class="text-red-500">*</span></label>
                <div class="relative group">
                  <UserIcon class="w-5 h-5 text-gray-400 absolute left-4 top-3.5 group-focus-within:text-coffee-600 transition-colors" />
                  <input 
                    v-model="form.name" 
                    type="text" 
                    placeholder="Enter your name" 
                    :class="['w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border focus:bg-white focus:ring-4 outline-none transition font-medium', errors.name ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-coffee-500 focus:ring-coffee-500/10']"
                  >
                </div>
                <p v-if="errors.name" class="text-red-500 text-xs font-bold">Name is required</p>
              </div>

              <div class="space-y-2">
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">Phone Number <span class="text-red-500">*</span></label>
                <div class="relative group">
                  <PhoneIcon class="w-5 h-5 text-gray-400 absolute left-4 top-3.5 group-focus-within:text-coffee-600 transition-colors" />
                  <input 
                    v-model="form.phone" 
                    type="tel" 
                    placeholder="012 345 678" 
                    :class="['w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border focus:bg-white focus:ring-4 outline-none transition font-medium', errors.phone ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-coffee-500 focus:ring-coffee-500/10']"
                  >
                </div>
                <p v-if="errors.phone" class="text-red-500 text-xs font-bold">Phone number is required</p>
              </div>

              <div class="md:col-span-2 space-y-2">
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">Delivery Address <span class="text-red-500">*</span></label>
                <div class="relative group">
                  <MapPinIcon class="w-5 h-5 text-gray-400 absolute left-4 top-3.5 group-focus-within:text-coffee-600 transition-colors" />
                  <input 
                    v-model="form.address" 
                    type="text" 
                    placeholder="Street, Building, Apartment..." 
                    :class="['w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border focus:bg-white focus:ring-4 outline-none transition font-medium', errors.address ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-coffee-500 focus:ring-coffee-500/10']"
                  >
                </div>
                <p v-if="errors.address" class="text-red-500 text-xs font-bold">Address is required</p>
              </div>

              <div class="md:col-span-2 space-y-2">
                <label class="text-xs font-bold text-gray-500 uppercase tracking-wide">Note (Optional)</label>
                <textarea 
                  v-model="form.note" 
                  rows="2"
                  placeholder="Less sugar, extra ice, gate code, etc..." 
                  class="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 outline-none transition resize-none font-medium"
                ></textarea>
              </div>

              <div class="md:col-span-2 flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <input 
                  type="checkbox" 
                  id="saveInfo" 
                  v-model="saveInfo" 
                  class="w-5 h-5 text-coffee-600 rounded focus:ring-coffee-500 border-gray-300"
                >
                <label for="saveInfo" class="text-sm text-gray-700 font-medium cursor-pointer select-none">
                  Save this information for future orders
                </label>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span class="bg-coffee-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold">2</span>
              Payment Method
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                @click="paymentMethod = 'cash'"
                :class="['p-4 rounded-2xl border-2 flex items-center gap-4 transition-all relative overflow-hidden', 
                  paymentMethod === 'cash' ? 'border-coffee-600 bg-coffee-50/50 shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50']"
              >
                <div class="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <BanknotesIcon class="w-6 h-6" />
                </div>
                <div class="text-left">
                  <p class="font-bold text-gray-900">Cash on Delivery</p>
                  <p class="text-xs text-gray-500">Pay when you receive</p>
                </div>
                <div v-if="paymentMethod === 'cash'" class="absolute top-4 right-4 text-coffee-600">
                  <CheckBadgeIcon class="w-6 h-6" />
                </div>
              </button>

              <button 
                @click="paymentMethod = 'khqr'"
                :class="['p-4 rounded-2xl border-2 flex items-center gap-4 transition-all relative overflow-hidden', 
                  paymentMethod === 'khqr' ? 'border-red-600 bg-red-50/50 shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50']"
              >
                <div class="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                  <CreditCardIcon class="w-6 h-6" />
                </div>
                <div class="text-left">
                  <p class="font-bold text-gray-900">KHQR Payment</p>
                  <p class="text-xs text-gray-500">ABA, Acleda, Bakong</p>
                </div>
                <div v-if="paymentMethod === 'khqr'" class="absolute top-4 right-4 text-red-600">
                  <CheckBadgeIcon class="w-6 h-6" />
                </div>
              </button>
            </div>

            <transition name="expand">
              <div v-if="paymentMethod === 'khqr'" class="mt-6 bg-gray-50 p-6 rounded-2xl border border-gray-200 text-center">
                <p class="text-sm font-bold text-gray-700 mb-4">Scan to Pay ${{ total.toFixed(2) }}</p>
                <div class="bg-white p-3 inline-block rounded-2xl shadow-sm border border-gray-100">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" class="w-40 h-40 opacity-90">
                </div>
                <p class="text-xs text-gray-500 mt-4 flex items-center justify-center gap-2">
                  <ShieldCheckIcon class="w-4 h-4" /> Secure Payment
                </p>
              </div>
            </transition>
          </div>
        </div>

        <div class="lg:col-span-1">
          <div class="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
            <h3 class="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
            
            <div class="space-y-4 mb-6 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              <div v-for="item in store.cart" :key="item.id" class="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                <div class="relative shrink-0">
                  <img :src="item.image" class="w-14 h-14 rounded-lg object-cover border border-gray-100">
                  <span class="absolute -top-2 -right-2 w-5 h-5 bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">{{ item.quantity }}</span>
                </div>
                
                <div class="flex-1 min-w-0">
                  <p class="font-bold text-gray-900 text-sm truncate flex items-center gap-1">
                    {{ item.name }}
                    <GiftIcon v-if="item.price === 0" class="w-3 h-3 text-green-500" />
                  </p>
                  
                  <p :class="['text-xs', item.price === 0 ? 'text-green-600 font-bold' : 'text-gray-500']">
                    {{ item.price === 0 ? 'FREE' : formatCurrency(item.price) }}
                  </p>
                </div>
                
                <p :class="['font-bold text-sm', item.price === 0 ? 'text-green-600' : 'text-gray-900']">
                  {{ item.price * item.quantity === 0 ? 'FREE' : formatCurrency(item.price * item.quantity) }}
                </p>
              </div>
            </div>

            <div class="bg-gray-50 rounded-xl p-4 space-y-3 mb-6">
              <div class="flex justify-between text-gray-600 text-sm">
                <span>Subtotal</span>
                <span class="font-medium">{{ formatCurrency(subtotal) }}</span>
              </div>
              <div class="flex justify-between text-gray-600 text-sm">
                <span>Delivery Fee</span>
                <span class="font-medium">{{ formatCurrency(deliveryFee) }}</span>
              </div>
              <div class="flex justify-between text-xl font-black text-gray-900 mt-2 pt-3 border-t border-gray-200">
                <span>Total</span>
                <span class="text-coffee-600">{{ formatCurrency(total) }}</span>
              </div>
            </div>

            <button 
              @click="handlePayment" 
              :disabled="isProcessing"
              class="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-coffee-600 transition-all shadow-xl shadow-gray-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <TruckIcon v-if="!isProcessing" class="w-6 h-6" />
              <span v-if="isProcessing" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              {{ isProcessing ? 'Processing...' : 'Place Order' }}
            </button>
            <p class="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
              <ShieldCheckIcon class="w-4 h-4 text-green-500" /> Secure Encrypted Payment
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 4px;
}

.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.animate-bounce-in { animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
@keyframes bounceIn {
  0% { opacity: 0; transform: scale(0.3); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { transform: scale(1); }
}

.animate-progress {
  width: 0%;
  animation: progress 3.5s linear forwards;
}
@keyframes progress { to { width: 100%; } }

/* QR Expand Animation */
.expand-enter-active, .expand-leave-active { transition: all 0.4s ease-in-out; overflow: hidden; max-height: 400px; opacity: 1; }
.expand-enter-from, .expand-leave-to { max-height: 0; opacity: 0; margin-top: 0; padding: 0; }
</style>  