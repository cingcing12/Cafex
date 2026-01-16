<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMainStore } from '@/stores/mainStore'
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline'

const store = useMainStore()
const router = useRouter()

// Modes: 'login', 'register', 'forgot'
const mode = ref('login')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

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
  
  // Simulate network delay for better UX feel
  setTimeout(() => {
    // UPDATED: Use loginCustomer to ensure only customers can login here
    const success = store.loginCustomer(form.email, form.password)
    
    if (success) {
      router.push('/') // Redirect directly to Home
    } else {
      errorMsg.value = 'Invalid credentials or this account is not a customer.'
      isLoading.value = false
    }
  }, 800)
}

const handleRegister = () => {
  errorMsg.value = ''
  successMsg.value = ''
  
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
    // Call Store Action
    store.register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password
    })
    
    isLoading.value = false
    successMsg.value = 'Account created successfully! Please login.'
    
    // Auto switch to login after 1.5s
    setTimeout(() => {
      mode.value = 'login'
      successMsg.value = ''
      form.password = '' // Clear password for security
    }, 1500)
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
    successMsg.value = `Reset link sent to ${form.email}`
    // Back to login after 3s
    setTimeout(() => {
      mode.value = 'login'
      successMsg.value = ''
    }, 3000)
  }, 1000)
}

const toggleMode = (newMode) => {
  mode.value = newMode
  errorMsg.value = ''
  successMsg.value = ''
}
</script>

<template>
  <div class="min-h-screen flex bg-gray-50">
    
    <div class="hidden lg:flex w-1/2 bg-gray-900 relative items-center justify-center overflow-hidden">
      <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200" class="absolute inset-0 w-full h-full object-cover opacity-50">
      <div class="relative z-10 text-center text-white p-12">
        <h1 class="text-6xl font-bold mb-6 tracking-tighter">CAFÉX</h1>
        <p class="text-xl text-gray-200">Experience the perfect blend of tradition and modernity.</p>
      </div>
    </div>

    <div class="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative">
      
      <button @click="router.push('/')" class="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-coffee-600 transition">
        <ArrowLeftIcon class="w-5 h-5" /> Back to Home
      </button>

      <div class="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-900">
            {{ mode === 'login' ? 'Welcome Back' : (mode === 'register' ? 'Create Account' : 'Reset Password') }}
          </h2>
          <p class="text-gray-500 text-sm mt-2">
            {{ mode === 'login' ? 'Enter your details to access your account.' : (mode === 'register' ? 'Join us for exclusive rewards.' : 'Don\'t worry, it happens.') }}
          </p>
        </div>

        <div v-if="errorMsg" class="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2 animate-shake">
          <span>⚠️</span> {{ errorMsg }}
        </div>
        <div v-if="successMsg" class="mb-4 p-3 rounded-lg bg-green-50 text-green-600 text-sm flex items-center gap-2 animate-fade-in">
          <span>✅</span> {{ successMsg }}
        </div>

        <form @submit.prevent class="space-y-5">
          
          <div v-if="mode === 'register'" class="animate-fade-in-up">
            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input v-model="form.name" type="text" placeholder="John Doe" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-coffee-500 outline-none transition">
          </div>

          <div class="animate-fade-in-up" :style="{ animationDelay: '0.1s' }">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ mode === 'login' ? 'Email or Phone' : 'Email Address' }}
            </label>
            <input v-model="form.email" type="text" placeholder="example@cafex.com" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-coffee-500 outline-none transition">
          </div>

          <div v-if="mode === 'register'" class="animate-fade-in-up" :style="{ animationDelay: '0.2s' }">
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input v-model="form.phone" type="tel" placeholder="012 345 678" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-coffee-500 outline-none transition">
          </div>

          <div v-if="mode !== 'forgot'" class="relative animate-fade-in-up" :style="{ animationDelay: '0.2s' }">
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              v-model="form.password" 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="••••••••" 
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-coffee-500 outline-none transition"
            >
            <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
              <EyeIcon v-if="!showPassword" class="w-5 h-5" />
              <EyeSlashIcon v-else class="w-5 h-5" />
            </button>
            <div v-if="mode === 'login'" class="text-right mt-1">
              <button type="button" @click="toggleMode('forgot')" class="text-xs text-coffee-600 hover:underline">Forgot password?</button>
            </div>
          </div>

          <div v-if="mode === 'register'" class="animate-fade-in-up" :style="{ animationDelay: '0.3s' }">
            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input v-model="form.confirmPassword" type="password" placeholder="••••••••" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-coffee-500 outline-none transition">
          </div>

          <div class="pt-2 animate-fade-in-up" :style="{ animationDelay: '0.4s' }">
            <button 
              v-if="mode === 'login'"
              @click="handleLogin" 
              :disabled="isLoading"
              class="w-full bg-gray-900 text-white py-3 rounded-lg font-bold text-lg hover:bg-gray-800 transition active:scale-95 flex justify-center"
            >
              <span v-if="isLoading" class="loader mr-2"></span>
              {{ isLoading ? 'Signing In...' : 'Sign In' }}
            </button>

            <button 
              v-if="mode === 'register'"
              @click="handleRegister" 
              :disabled="isLoading"
              class="w-full bg-coffee-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-coffee-700 transition active:scale-95 flex justify-center"
            >
              <span v-if="isLoading" class="loader mr-2"></span>
              {{ isLoading ? 'Creating Account...' : 'Create Account' }}
            </button>

            <button 
              v-if="mode === 'forgot'"
              @click="handleForgot" 
              :disabled="isLoading"
              class="w-full bg-coffee-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-coffee-700 transition active:scale-95 flex justify-center"
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
/* Simple CSS Loader */
.loader {
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top: 3px solid white;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Animations */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
.animate-shake {
  animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
  opacity: 0;
  transform: translateY(10px);
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>