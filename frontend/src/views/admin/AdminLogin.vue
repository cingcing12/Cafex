<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMainStore } from '@/stores/mainStore'
import { LockClosedIcon, EnvelopeIcon, EyeIcon, EyeSlashIcon, ArrowLongLeftIcon } from '@heroicons/vue/24/outline'

const store = useMainStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMsg = ref('')
const isLoading = ref(false)

const handleAdminLogin = async () => {
  errorMsg.value = ''
  isLoading.value = true
  
  try {
    console.log("Logging in as:", email.value)
    const success = await store.loginAdmin(email.value, password.value)
    
    if (success) {
      router.push('/admin/dashboard')
    } else {
      // If failed, store handled the toast, but we show local error too
      errorMsg.value = 'Login Failed. Check console or credentials.'
    }
  } catch (e) {
    console.error(e)
    errorMsg.value = 'Connection Error. Is the backend running?'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex bg-white font-sans">
    
    <div class="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden">
      <img src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=1600" class="absolute inset-0 w-full h-full object-cover opacity-60" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
      <div class="relative z-10 w-full flex flex-col justify-between p-16">
        <div>
          <span class="text-coffee-400 font-bold tracking-[0.2em] uppercase text-sm">Internal Portal</span>
          <h1 class="text-5xl font-extrabold text-white mt-4">CAFÉX <br>Admin Access</h1>
        </div>
      </div>
    </div>

    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50/50">
      <div class="max-w-md w-full animate-fade-in-up">
        
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-coffee-600 text-white shadow-lg mb-6">
            <LockClosedIcon class="w-8 h-8" />
          </div>
          <h2 class="text-3xl font-bold text-gray-900">Welcome Back</h2>
        </div>

        <transition name="shake">
          <div v-if="errorMsg" class="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex gap-3">
             <span>!</span> {{ errorMsg }}
          </div>
        </transition>

        <form @submit.prevent="handleAdminLogin" class="space-y-6">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
            <div class="relative group">
              <EnvelopeIcon class="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <input v-model="email" type="email" required class="w-full pl-12 pr-4 py-3.5 border rounded-xl" placeholder="admin@cafex.com">
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <div class="relative group">
              <LockClosedIcon class="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <input v-model="password" :type="showPassword ? 'text' : 'password'" required class="w-full pl-12 pr-12 py-3.5 border rounded-xl" placeholder="••••••••">
              <button type="button" @click="showPassword = !showPassword" class="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600">
                <EyeIcon v-if="!showPassword" class="h-5 w-5" /><EyeSlashIcon v-else class="h-5 w-5" />
              </button>
            </div>
          </div>

          <button :disabled="isLoading" class="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition">
            <span v-if="isLoading">Verifying...</span><span v-else>Access Dashboard</span>
          </button>
        </form>
        
        <div class="mt-8 text-center">
          <router-link to="/" class="inline-flex items-center text-sm font-medium text-gray-400 hover:text-coffee-600">
            <ArrowLongLeftIcon class="w-5 h-5 mr-2" /> Back to Main Website
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; opacity: 0; transform: translateY(20px); }
@keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
</style>