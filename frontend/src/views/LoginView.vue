<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMainStore } from '@/stores/mainStore'
import { 
  EyeIcon, 
  EyeSlashIcon, 
  ArrowLeftIcon, 
  ExclamationCircleIcon, // Added Icon
  XMarkIcon // Added Icon
} from '@heroicons/vue/24/outline'

const store = useMainStore()
const router = useRouter()

// Modes: 'login', 'register', 'forgot'
const mode = ref('login')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMsg = ref('')

// Form Data
const form = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

// --- ACTIONS ---

const handleLogin = async () => {
  errorMsg.value = ''
  isLoading.value = true
  
  setTimeout(() => {
    // Use store logic
    const success = store.loginCustomer(form.email, form.password)
    
    if (success) {
      store.showToast(`Welcome back, ${store.currentUser.name}!`, 'success')
      router.push('/') 
    } else {
      errorMsg.value = 'Invalid credentials or this account is not a customer.'
      isLoading.value = false
    }
  }, 800)
}

const handleRegister = () => {
  errorMsg.value = ''
  
  // Basic Validation
  if (!form.name || !form.email || !form.password) {
    errorMsg.value = 'Please fill in all required fields.'
    return
  }
  if (form.password !== form.confirmPassword) {
    errorMsg.value = 'Passwords do not match.'
    return
  }
  if (form.password.length < 3) {
    errorMsg.value = 'Password must be at least 3 characters.'
    return
  }

  isLoading.value = true

  setTimeout(() => {
    store.register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password
    })
    
    isLoading.value = false
    // Use Store Toast for Success (Better UX)
    store.showToast('Account created! Please login.', 'success')
    
    // Auto switch to login
    setTimeout(() => {
      mode.value = 'login'
      form.password = '' 
    }, 1000)
  }, 1000)
}

const handleForgot = () => {
  if(!form.email) {
    errorMsg.value = 'Please enter your email address.'
    return
  }
  
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
    store.showToast(`Reset link sent to ${form.email}`, 'info')
    
    setTimeout(() => {
      mode.value = 'login'
    }, 2000)
  }, 1000)
}

const toggleMode = (newMode) => {
  mode.value = newMode
  errorMsg.value = ''
}
</script>

<template>
  <div class="min-h-screen flex bg-gray-50 font-sans">
    
    <div class="hidden lg:flex w-1/2 bg-gray-900 relative items-center justify-center overflow-hidden">
      <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200" class="absolute inset-0 w-full h-full object-cover opacity-50">
      <div class="relative z-10 text-center text-white p-12">
        <h1 class="text-6xl font-bold mb-6 tracking-tighter">CAFÉX</h1>
        <p class="text-xl text-gray-200">Experience the perfect blend of tradition and modernity.</p>
      </div>
    </div>

    <div class="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative">
      
      <button @click="router.push('/')" class="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-coffee-600 transition font-bold text-sm">
        <ArrowLeftIcon class="w-5 h-5" /> Back to Home
      </button>

      <div class="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        
        <div class="text-center mb-8">
          <h2 class="text-3xl font-black text-gray-900">
            {{ mode === 'login' ? 'Welcome Back' : (mode === 'register' ? 'Create Account' : 'Reset Password') }}
          </h2>
          <p class="text-gray-500 text-sm mt-2">
            {{ mode === 'login' ? 'Enter your details to access your account.' : (mode === 'register' ? 'Join us for exclusive rewards.' : 'Don\'t worry, it happens.') }}
          </p>
        </div>

        <transition name="shake">
          <div v-if="errorMsg" class="mb-6 bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex items-start gap-3">
            <ExclamationCircleIcon class="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div class="flex-1">
              <h4 class="text-sm font-bold text-red-800">Action Failed</h4>
              <p class="text-xs text-red-600 mt-0.5 leading-relaxed">{{ errorMsg }}</p>
            </div>
            <button @click="errorMsg = ''" class="text-red-400 hover:text-red-600 transition">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
        </transition>

        <form @submit.prevent class="space-y-5">
          
          <div v-if="mode === 'register'" class="animate-fade-in-up">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
            <input v-model="form.name" type="text" placeholder="John Doe" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 outline-none transition font-medium">
          </div>

          <div class="animate-fade-in-up" :style="{ animationDelay: '0.1s' }">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              {{ mode === 'login' ? 'Email or Phone' : 'Email Address' }}
            </label>
            <input v-model="form.email" type="text" placeholder="example@cafex.com" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 outline-none transition font-medium">
          </div>

          <div v-if="mode === 'register'" class="animate-fade-in-up" :style="{ animationDelay: '0.2s' }">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Phone Number</label>
            <input v-model="form.phone" type="tel" placeholder="012 345 678" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 outline-none transition font-medium">
          </div>

          <div v-if="mode !== 'forgot'" class="relative animate-fade-in-up" :style="{ animationDelay: '0.2s' }">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
            <input 
              v-model="form.password" 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="••••••••" 
              class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 outline-none transition font-medium"
            >
            <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition">
              <EyeIcon v-if="!showPassword" class="w-5 h-5" />
              <EyeSlashIcon v-else class="w-5 h-5" />
            </button>
            <div v-if="mode === 'login'" class="text-right mt-2">
              <button type="button" @click="toggleMode('forgot')" class="text-xs font-bold text-coffee-600 hover:underline">Forgot password?</button>
            </div>
          </div>

          <div v-if="mode === 'register'" class="animate-fade-in-up" :style="{ animationDelay: '0.3s' }">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Confirm Password</label>
            <input v-model="form.confirmPassword" type="password" placeholder="••••••••" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 outline-none transition font-medium">
          </div>

          <div class="pt-2 animate-fade-in-up" :style="{ animationDelay: '0.4s' }">
            <button 
              v-if="mode === 'login'"
              @click="handleLogin" 
              :disabled="isLoading"
              class="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-gray-800 transition active:scale-[0.98] flex justify-center shadow-lg shadow-gray-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span v-if="isLoading" class="loader mr-2"></span>
              {{ isLoading ? 'Signing In...' : 'Sign In' }}
            </button>

            <button 
              v-if="mode === 'register'"
              @click="handleRegister" 
              :disabled="isLoading"
              class="w-full bg-coffee-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-coffee-700 transition active:scale-[0.98] flex justify-center shadow-lg shadow-coffee-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span v-if="isLoading" class="loader mr-2"></span>
              {{ isLoading ? 'Creating Account...' : 'Create Account' }}
            </button>

            <button 
              v-if="mode === 'forgot'"
              @click="handleForgot" 
              :disabled="isLoading"
              class="w-full bg-coffee-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-coffee-700 transition active:scale-[0.98] flex justify-center shadow-lg shadow-coffee-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {{ isLoading ? 'Sending...' : 'Send Recovery Link' }}
            </button>
          </div>
        </form>

        <div class="mt-8 text-center text-sm text-gray-600">
          <div v-if="mode === 'login'">
            New to CAFÉX? 
            <button @click="toggleMode('register')" class="font-bold text-coffee-600 hover:underline">Create an account</button>
          </div>
          <div v-if="mode === 'register'">
            Already have an account? 
            <button @click="toggleMode('login')" class="font-bold text-coffee-600 hover:underline">Sign in</button>
          </div>
          <div v-if="mode === 'forgot'">
            Remembered your password? 
            <button @click="toggleMode('login')" class="font-bold text-coffee-600 hover:underline">Back to Login</button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Loader */
.loader {
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top: 2px solid white;
  width: 20px;
  height: 20px;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Shake Animation for Alert */
.shake-enter-active {
  animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

/* Fade Up Animation */
.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(15px);
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>