<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMainStore } from '@/stores/mainStore'
import { 
  LockClosedIcon, 
  EnvelopeIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ArrowLongLeftIcon 
} from '@heroicons/vue/24/outline'

const store = useMainStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMsg = ref('')
const isLoading = ref(false)

const handleAdminLogin = () => {
  errorMsg.value = ''
  isLoading.value = true
  
  setTimeout(() => {
    const success = store.loginAdmin(email.value, password.value)
    
    if (success) {
      router.push('/admin/dashboard')
    } else {
      errorMsg.value = 'Access Denied. Check your credentials.'
      store.logoutAdmin()
    }
    
    isLoading.value = false
  }, 1000)
}
</script>

<template>
  <div class="min-h-screen flex bg-white font-sans">
    
    <div class="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden">
      <img 
        src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=1600" 
        class="absolute inset-0 w-full h-full object-cover opacity-60"
        alt="Coffee Background"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
      
      <div class="relative z-10 w-full flex flex-col justify-between p-16">
        <div>
          <span class="text-coffee-400 font-bold tracking-[0.2em] uppercase text-sm">Internal Portal</span>
          <h1 class="text-5xl font-extrabold text-white mt-4 tracking-tight">CAFÉX <br>Admin Access</h1>
        </div>
        
        <div>
          <blockquote class="text-xl text-gray-300 font-light italic">
            "Quality controls, inventory management, and customer insights—all in one place."
          </blockquote>
          <p class="text-gray-500 mt-4 text-sm">© 2026 CAFÉX Inc. Secure System.</p>
        </div>
      </div>
    </div>

    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50/50">
      <div class="max-w-md w-full animate-fade-in-up">
        
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-coffee-600 text-white shadow-lg shadow-coffee-200 mb-6">
            <LockClosedIcon class="w-8 h-8" />
          </div>
          <h2 class="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p class="text-gray-500 mt-2">Please enter your admin credentials.</p>
        </div>

        <transition name="shake">
          <div v-if="errorMsg" class="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3">
            <span class="bg-red-100 p-1 rounded-full">✕</span>
            {{ errorMsg }}
          </div>
        </transition>

        <form @submit.prevent="handleAdminLogin" class="space-y-6">
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <EnvelopeIcon class="h-5 w-5 text-gray-400 group-focus-within:text-coffee-600 transition-colors" />
              </div>
              <input 
                v-model="email" 
                type="email" 
                required 
                class="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-coffee-500/10 focus:border-coffee-500 outline-none transition-all duration-300"
                placeholder="admin@cafex.com"
              >
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <LockClosedIcon class="h-5 w-5 text-gray-400 group-focus-within:text-coffee-600 transition-colors" />
              </div>
              <input 
                v-model="password" 
                :type="showPassword ? 'text' : 'password'" 
                required 
                class="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-coffee-500/10 focus:border-coffee-500 outline-none transition-all duration-300"
                placeholder="••••••••"
              >
              <button type="button" @click="showPassword = !showPassword" class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer">
                <EyeIcon v-if="!showPassword" class="h-5 w-5" />
                <EyeSlashIcon v-else class="h-5 w-5" />
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between text-sm">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" class="rounded text-coffee-600 focus:ring-coffee-500 border-gray-300">
              <span class="text-gray-600">Remember me</span>
            </label>
            <a href="#" class="text-coffee-600 font-bold hover:underline">Forgot password?</a>
          </div>

          <button 
            :disabled="isLoading" 
            class="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 focus:ring-4 focus:ring-gray-300 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-gray-200"
          >
            <span v-if="isLoading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </span>
            <span v-else>Access Dashboard</span>
          </button>
        </form>
        
        <div class="mt-8 text-center">
          <router-link to="/" class="inline-flex items-center text-sm font-medium text-gray-400 hover:text-coffee-600 transition-colors">
            <ArrowLongLeftIcon class="w-5 h-5 mr-2" /> Back to Main Website
          </router-link>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes fadeInUp {
  to { opacity: 1; transform: translateY(0); }
}

/* Shake Animation for Errors */
.shake-enter-active {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
</style>