<script setup>
import { ref } from 'vue'
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  ChevronDownIcon, 
  PaperAirplaneIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/outline'

// Form State
const form = ref({
  name: '',
  email: '',
  message: ''
})
const isSending = ref(false)
const showSuccessModal = ref(false)
const toast = ref({ show: false, message: '' })

// FAQ Data
const faqs = ref([
  { 
    q: "Do you offer Vegan options?", 
    a: "Yes! We have Almond, Oat, and Soy milk available for all our coffee and tea drinks.", 
    open: false 
  },
  { 
    q: "Can I book a table for a meeting?", 
    a: "We operate on a first-come, first-served basis. However, for groups larger than 6, please give us a call to reserve the community table.", 
    open: false 
  },
  { 
    q: "Is there free Wi-Fi?", 
    a: "Absolutely. We offer high-speed fiber internet free for all customers. Just ask a barista for the password!", 
    open: false 
  },
  { 
    q: "Do you do delivery?", 
    a: "Yes, we are available on major delivery apps, or you can order for pickup directly through this website.", 
    open: false 
  },
])

const toggleFaq = (index) => {
  faqs.value[index].open = !faqs.value[index].open
}

const triggerToast = (msg) => {
  toast.value.message = msg
  toast.value.show = true
  setTimeout(() => { toast.value.show = false }, 3000)
}

const handleSubmit = () => {
  if(!form.value.name || !form.value.email) {
    return triggerToast('Please fill in required fields')
  }
  
  isSending.value = true
  
  // Simulate API call
  setTimeout(() => {
    isSending.value = false
    showSuccessModal.value = true
    form.value = { name: '', email: '', message: '' }
  }, 1500)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans relative overflow-x-hidden">
    
    <div class="relative h-[400px] flex items-center justify-center overflow-hidden bg-fixed bg-center bg-cover" 
         style="background-image: url('https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=1600');">
      <div class="absolute inset-0 bg-black/60"></div>
      
      <div class="relative z-10 text-center text-white px-4 animate-fade-in-up">
        <h1 class="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">Get in Touch</h1>
        <p class="text-xl text-gray-200 max-w-2xl mx-auto font-light">
          Have a question or just want to say hello? We'd love to hear from you.
        </p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-16 -mt-20 relative z-20">
      <div class="grid lg:grid-cols-3 gap-8">
        
        <div class="space-y-6 animate-fade-in-up" style="animation-delay: 0.1s;">
          <div class="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
            <div class="w-14 h-14 bg-coffee-50 rounded-full flex items-center justify-center text-coffee-600 shadow-sm">
              <PhoneIcon class="w-6 h-6" />
            </div>
            <div>
              <h3 class="font-bold text-gray-900 text-lg">Phone</h3>
              <p class="text-gray-500 text-sm font-medium">+855 12 345 678</p>
            </div>
          </div>

          <div class="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
            <div class="w-14 h-14 bg-coffee-50 rounded-full flex items-center justify-center text-coffee-600 shadow-sm">
              <EnvelopeIcon class="w-6 h-6" />
            </div>
            <div>
              <h3 class="font-bold text-gray-900 text-lg">Email</h3>
              <p class="text-gray-500 text-sm font-medium">caféX@gmail.com</p>
            </div>
          </div>

          <div class="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
            <div class="w-14 h-14 bg-coffee-50 rounded-full flex items-center justify-center text-coffee-600 shadow-sm">
              <MapPinIcon class="w-6 h-6" />
            </div>
            <div>
              <h3 class="font-bold text-gray-900 text-lg">Main Branch</h3>
              <p class="text-gray-500 text-sm font-medium">#123, Street 2004, Phnom Penh</p>
            </div>
          </div>

          <div class="bg-gray-200 rounded-2xl h-64 w-full overflow-hidden shadow-lg relative group border-4 border-white">
            <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-700">
            <div class="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition">
              <span class="bg-white text-gray-900 px-6 py-2 rounded-full text-sm font-bold shadow-xl flex items-center gap-2 transform group-hover:scale-110 transition-transform">
                <MapPinIcon class="w-4 h-4 text-red-500" /> View on Google Maps
              </span>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 animate-fade-in-up" style="animation-delay: 0.2s;">
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Send us a Message</h2>
          <p class="text-gray-500 mb-8">Fill out the form below and we'll get back to you shortly.</p>
          
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2 ml-1">Your Name</label>
                <input v-model="form.name" type="text" class="w-full px-5 py-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 outline-none transition-all duration-300" placeholder="John Doe">
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2 ml-1">Email Address</label>
                <input v-model="form.email" type="email" class="w-full px-5 py-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 outline-none transition-all duration-300" placeholder="john@example.com">
              </div>
            </div>

            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2 ml-1">Message</label>
              <textarea v-model="form.message" rows="5" class="w-full px-5 py-4 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 outline-none transition-all duration-300 resize-none" placeholder="How can we help you?"></textarea>
            </div>

            <div class="pt-2">
              <button :disabled="isSending" class="w-full bg-coffee-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-coffee-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-coffee-200 disabled:opacity-70 disabled:cursor-not-allowed">
                <span v-if="isSending" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                <span v-else>Send Message</span>
                <PaperAirplaneIcon v-if="!isSending" class="w-5 h-5 -rotate-45 mt-[-2px]" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="mt-24 max-w-3xl mx-auto">
        <h2 class="text-3xl font-bold text-center text-gray-900 mb-10">Frequently Asked Questions</h2>
        <div class="space-y-4">
          <div v-for="(faq, index) in faqs" :key="index" class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md" :class="faq.open ? 'ring-2 ring-coffee-100' : ''">
            <button @click="toggleFaq(index)" class="w-full flex justify-between items-center p-6 text-left">
              <span class="font-bold text-gray-900 text-lg">{{ faq.q }}</span>
              <span class="bg-gray-100 rounded-full p-2 transition-transform duration-300" :class="faq.open ? 'rotate-180 bg-coffee-100 text-coffee-600' : 'text-gray-400'">
                 <ChevronDownIcon class="w-5 h-5" />
              </span>
            </button>
            <div class="overflow-hidden transition-all duration-300 ease-in-out" :style="{ maxHeight: faq.open ? '200px' : '0px', opacity: faq.open ? '1' : '0' }">
              <div class="p-6 pt-0 text-gray-600 leading-relaxed">{{ faq.a }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <transition name="toast">
      <div v-if="toast.show" class="fixed top-6 right-6 z-[110] flex items-center gap-3 bg-white border-l-4 border-red-500 px-6 py-4 rounded-2xl shadow-2xl">
        <ExclamationCircleIcon class="w-6 h-6 text-red-500" />
        <span class="font-bold text-gray-900">{{ toast.message }}</span>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showSuccessModal" class="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-md" @click="showSuccessModal = false"></div>
        <div class="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center relative z-10 shadow-2xl animate-zoom-in border border-white/20">
          <button @click="showSuccessModal = false" class="absolute top-6 right-6 text-gray-300 hover:text-gray-900 transition-colors">
            <XMarkIcon class="w-6 h-6" />
          </button>
          <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-50 relative">
            <CheckCircleIcon class="w-12 h-12 text-green-600 animate-bounce-slow" />
            <div class="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white animate-ping"></div>
          </div>
          <h3 class="text-3xl font-black text-gray-900 mb-3 tracking-tight">Sent!</h3>
          <p class="text-gray-500 mb-8 leading-relaxed">
            Your message is on its way. We'll get back to you within <span class="text-coffee-600 font-bold">24 hours</span>.
          </p>
          <button @click="showSuccessModal = false" class="w-full py-4 rounded-2xl font-bold text-white bg-gray-900 hover:bg-coffee-600 shadow-xl shadow-gray-200 transition-all transform hover:-translate-y-1 active:scale-95">
            Done
          </button>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
/* Modal Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Toast Transitions */
.toast-enter-active { animation: toast-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.toast-leave-active { animation: toast-in 0.4s reverse ease-in; }

@keyframes toast-in {
  from { transform: translateX(100%) scale(0.9); opacity: 0; }
  to { transform: translateX(0) scale(1); opacity: 1; }
}

/* Animations */
.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
  opacity: 0;
  transform: translateY(30px);
}

@keyframes fadeInUp {
  to { opacity: 1; transform: translateY(0); }
}

.animate-zoom-in { 
  animation: zoomIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
}

@keyframes zoomIn { 
  from { opacity: 0; transform: scale(0.8) translateY(30px); } 
  to { opacity: 1; transform: scale(1) translateY(0); } 
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(-8%); }
  50% { transform: translateY(0); }
}
.animate-bounce-slow { animation: bounce-slow 2s infinite; }

/* Theme Colors */
.bg-coffee-50 { background-color: #fdfaf7; }
.bg-coffee-600 { background-color: #6F4E37; }
.text-coffee-600 { color: #6F4E37; }
.focus\:border-coffee-500:focus { border-color: #6F4E37; }
.focus\:ring-coffee-500\/10:focus { --tw-ring-color: rgba(111, 78, 55, 0.1); }
</style>