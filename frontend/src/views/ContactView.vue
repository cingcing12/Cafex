<script setup>
import { ref } from 'vue'
import axios from 'axios' 
import { useMainStore } from '@/stores/mainStore' // 🟢 1. Import your store
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  ChevronDownIcon, 
  PaperAirplaneIcon 
} from '@heroicons/vue/24/outline'

const store = useMainStore() // 🟢 2. Initialize the store

// Form State
const form = ref({
  name: '',
  email: '',
  message: ''
})
const isSending = ref(false)
// 🔴 Removed showSuccess since we use Toasts now

// FAQ Data
const faqs = ref([
  { q: "Do you offer Vegan options?", a: "Yes! We have Almond, Oat, and Soy milk available for all our coffee and tea drinks.", open: false },
  { q: "Can I book a table for a meeting?", a: "We operate on a first-come, first-served basis. However, for groups larger than 6, please give us a call.", open: false },
  { q: "Is there free Wi-Fi?", a: "Absolutely. We offer high-speed fiber internet free for all customers.", open: false },
  { q: "Do you do delivery?", a: "Yes, we are available on major delivery apps, or you can order for pickup directly through this website.", open: false },
])

const toggleFaq = (index) => {
  faqs.value[index].open = !faqs.value[index].open
}

const handleSubmit = async () => {
  // 🟢 3. Use Toast for validation error
  if(!form.value.name || !form.value.email || !form.value.message) {
    return store.showToast('Please fill in all fields (Name, Email, and Message)', 'warning')
  }
  
  isSending.value = true
  
  try {
    await axios.post('http://localhost:5000/api/contact', form.value)
    
    // 🟢 4. Use Toast for success
    store.showToast('Message sent successfully! We will contact you soon.', 'success')
    form.value = { name: '', email: '', message: '' }
    
  } catch (error) {
    console.error("Error sending message:", error)
    // 🟢 5. Use Toast for server error
    store.showToast('Failed to send message. Please check your connection and try again.', 'error')
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    
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
              <p class="text-gray-500 text-sm font-medium">+855 10 719628</p>
            </div>
          </div>

          <div class="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
            <div class="w-14 h-14 bg-coffee-50 rounded-full flex items-center justify-center text-coffee-600 shadow-sm">
              <EnvelopeIcon class="w-6 h-6" />
            </div>
            <div>
              <h3 class="font-bold text-gray-900 text-lg">Email</h3>
              <p class="text-gray-500 text-sm font-medium">vongsokpheak4@gmail.com</p>
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
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d250151.16277564838!2d104.72537728871423!3d11.579654003814133!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3109513dc76a6be3%3A0x9c010ee85ab525bb!2sPhnom%20Penh!5e0!3m2!1sen!2skh!4v1771122796784!5m2!1sen!2skh" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
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
            <button 
              @click="toggleFaq(index)" 
              class="w-full flex justify-between items-center p-6 text-left"
            >
              <span class="font-bold text-gray-900 text-lg">{{ faq.q }}</span>
              <span class="bg-gray-100 rounded-full p-2 transition-transform duration-300" :class="faq.open ? 'rotate-180 bg-coffee-100 text-coffee-600' : 'text-gray-400'">
                 <ChevronDownIcon class="w-5 h-5" />
              </span>
            </button>
            
            <div 
              class="overflow-hidden transition-all duration-300 ease-in-out"
              :style="{ maxHeight: faq.open ? '200px' : '0px', opacity: faq.open ? '1' : '0' }"
            >
              <div class="p-6 pt-0 text-gray-600 leading-relaxed">
                {{ faq.a }}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
  opacity: 0;
  transform: translateY(30px);
}

@keyframes fadeInUp {
  to { opacity: 1; transform: translateY(0); }
}
</style>