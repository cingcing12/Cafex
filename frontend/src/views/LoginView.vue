<script setup>
import { ref, reactive, computed, nextTick, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMainStore } from '@/stores/mainStore'
import { 
  EyeIcon, EyeSlashIcon, ArrowLeftIcon, 
  SparklesIcon, ChevronRightIcon, CheckCircleIcon, 
  ExclamationCircleIcon, EnvelopeIcon, ClockIcon, KeyIcon, LockClosedIcon
} from '@heroicons/vue/24/outline'

const store = useMainStore()
const router = useRouter()

// Modes: 'login', 'register', 'otp-register', 'otp-login', 'forgot', 'otp-reset', 'new-password'
const mode = ref('login')
const showPassword = ref(false)
const isLoading = ref(false)

// Alert & Timer State
const alert = reactive({ show: false, type: 'success', msg: '' })
const resendTimer = ref(0)
let timerInterval = null

// Form Data
const form = reactive({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
const otpDigits = ref(['', '', '', '', '', ''])
const otpInputs = ref([])
const otpString = computed(() => otpDigits.value.join(''))

// --- GOOGLE INIT ---
onMounted(() => {
  const script = document.createElement('script')
  script.src = "https://accounts.google.com/gsi/client"
  script.async = true
  script.defer = true
  script.onload = () => {
    window.google.accounts.id.initialize({
      client_id: "177712810140-h5p7ld91hcbmnn6diu8nrfsfloecobhn.apps.googleusercontent.com",
      callback: handleGoogleResponse
    });
    renderGoogleButton();
  }
  document.head.appendChild(script)
})

const renderGoogleButton = () => {
  if (window.google) {
    window.google.accounts.id.renderButton(
      document.getElementById("google-btn"),
      { theme: "outline", size: "large", width: "100%", shape: "pill", text: "continue_with" }
    );
  }
}

const handleGoogleResponse = async (response) => {
  isLoading.value = true
  const result = await store.googleAuth(response.credential)
  isLoading.value = false
  
  if (result.requireOtp) {
    form.email = result.email
    mode.value = result.action === 'login' ? 'otp-login' : 'otp-register'
    startResendTimer()
    showAlert(`Code sent to ${result.email}`, 'success')
    nextTick(() => otpInputs.value[0]?.focus())
  } else {
    showAlert(result.error || "Google Login Failed")
  }
}

watch(mode, () => {
  setTimeout(() => { if(['login', 'register'].includes(mode.value)) renderGoogleButton() }, 200)
})

// --- AUTO SUBMIT OTP ---
watch(otpString, (newVal) => {
  if (newVal.length === 6 && !isLoading.value && mode.value !== 'new-password') verifyOtp()
})

// --- HELPERS ---
const showAlert = (msg, type = 'error') => {
  alert.msg = msg; alert.type = type; alert.show = true;
  setTimeout(() => { alert.show = false }, 4000)
}

const startResendTimer = () => {
  resendTimer.value = 60
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (resendTimer.value > 0) resendTimer.value--
    else clearInterval(timerInterval)
  }, 1000)
}

// 🟢 PASTE HANDLER
const handleOtpPaste = (event) => {
  event.preventDefault()
  const pasteData = event.clipboardData.getData('text')
  const numbers = pasteData.replace(/\D/g, '').split('').slice(0, 6)
  if (numbers.length > 0) {
    numbers.forEach((digit, i) => { otpDigits.value[i] = digit })
    const nextIndex = numbers.length < 6 ? numbers.length : 5
    nextTick(() => otpInputs.value[nextIndex]?.focus())
  }
}

const handleOtpInput = (index, event) => {
  const val = event.target.value
  if (val.length > 1) {
    const chars = val.split('')
    otpDigits.value[index] = chars[0]
    if (index < 5) { otpDigits.value[index + 1] = chars[1]; otpInputs.value[index + 1].focus() }
    return
  }
  if (!/^\d*$/.test(val)) { otpDigits.value[index] = ''; return }
  if (val && index < 5) otpInputs.value[index + 1].focus()
}

const handleOtpBackspace = (index, event) => {
  if (!otpDigits.value[index] && index > 0) otpInputs.value[index - 1].focus()
}

// --- ACTIONS ---
const handleLogin = async () => {
  if(!form.email || !form.password) return showAlert('Please enter email and password')
  isLoading.value = true
  await new Promise(r => setTimeout(r, 800))
  const res = await store.loginStep1(form.email, form.password)
  isLoading.value = false
  if (res.success && res.requireOtp) {
    mode.value = 'otp-login'
    startResendTimer()
    showAlert('Code sent! Please verify.', 'success')
    nextTick(() => otpInputs.value[0]?.focus())
  } else { showAlert(res.error) }
}

const handleRegister = async () => {
  if (form.password !== form.confirmPassword) return showAlert('Passwords do not match')
  if (!form.name || !form.email) return showAlert('Please fill all fields')
  isLoading.value = true
  const error = await store.sendOTP(form)
  isLoading.value = false
  if (error === true) {
    mode.value = 'otp-register'
    startResendTimer()
    showAlert('Verification code sent!', 'success')
    nextTick(() => otpInputs.value[0]?.focus())
  } else { showAlert(error) }
}

// 🟢 FORGOT PASSWORD FLOW
const handleForgotPassword = async () => {
  if(!form.email) return showAlert('Please enter your email')
  isLoading.value = true
  const res = await store.forgotPassword(form.email)
  isLoading.value = false
  if (res === true) {
    mode.value = 'otp-reset' // Step 1: Enter OTP
    startResendTimer()
    showAlert('Reset code sent!', 'success')
    nextTick(() => otpInputs.value[0]?.focus())
  } else { showAlert(res) }
}

// 🟢 NEW PASSWORD SUBMISSION
const handleSetNewPassword = async () => {
  if (form.password !== form.confirmPassword) return showAlert('Passwords do not match')
  if (!form.password) return showAlert('Enter a new password')
  
  isLoading.value = true
  // We use the otpString that is still stored in the state
  const res = await store.resetPassword(form.email, otpString.value, form.password)
  isLoading.value = false
  
  if (res === true) {
    showAlert('Password Changed! Logging in...', 'success')
    setTimeout(() => {
        switchMode('login')
    }, 1500)
  } else { showAlert(res) }
}

const handleResend = async () => {
  if (resendTimer.value > 0) return
  isLoading.value = true
  let error = true
  
  if (mode.value === 'otp-login') {
    const res = await store.loginStep1(form.email, form.password)
    error = !res.success
  } else if (mode.value === 'otp-reset') {
    const res = await store.forgotPassword(form.email)
    error = res !== true
  } else {
    const res = await store.sendOTP(form)
    error = res !== true
  }
  
  isLoading.value = false
  if (!error) {
    startResendTimer()
    showAlert('New code sent!', 'success')
    otpDigits.value = ['', '', '', '', '', '']
    otpInputs.value[0]?.focus()
  } else { showAlert('Failed to resend code.') }
}

// 🟢 UNIFIED OTP VERIFICATION
const verifyOtp = async () => {
  if (otpString.value.length !== 6) return
  
  isLoading.value = true
  await new Promise(r => setTimeout(r, 600))
  
  let success = false
  
  // 1. Login OTP
  if (mode.value === 'otp-login') {
      success = await store.verifyLoginOTP(form.email, otpString.value)
      if (success) {
          showAlert('Success! Redirecting...', 'success')
          setTimeout(() => router.push('/'), 500)
      }
  } 
  // 2. Register OTP
  else if (mode.value === 'otp-register') {
      success = await store.verifyOTPAndRegister(form.email, otpString.value)
      if (success) {
          showAlert('Success! Redirecting...', 'success')
          setTimeout(() => router.push('/'), 500)
      }
  }
  // 3. Reset Password OTP (Just verify validity first)
  else if (mode.value === 'otp-reset') {
      success = await store.verifyResetCode(form.email, otpString.value)
      if (success) {
          isLoading.value = false
          mode.value = 'new-password' // Move to next screen
          showAlert('Code Verified. Set new password.', 'success')
          return // Stop here, don't clear OTP yet
      }
  }
  
  isLoading.value = false
  
  if (!success) {
    otpDigits.value = ['', '', '', '', '', '']
    otpInputs.value[0]?.focus()
    showAlert('Invalid Code. Please try again.')
  }
}

const switchMode = (m) => {
  mode.value = m; alert.show = false; otpDigits.value = ['', '', '', '', '', '']; 
  if (m === 'login' || m === 'register') { form.password = ''; form.confirmPassword = ''; }
  if (timerInterval) clearInterval(timerInterval)
}
</script>

<template>
  <div class="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4 font-sans relative overflow-hidden">
    
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
      <div class="absolute -top-24 -right-24 w-96 h-96 bg-coffee-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div class="absolute top-1/2 -left-24 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
    </div>

    <transition name="fade">
      <div v-if="isLoading" class="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center">
        <div class="relative">
          <div class="w-16 h-16 border-4 border-gray-200 border-t-coffee-600 rounded-full animate-spin"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <SparklesIcon class="w-6 h-6 text-coffee-600 animate-pulse" />
          </div>
        </div>
        <p class="mt-4 text-coffee-800 font-bold tracking-wide animate-pulse">Processing...</p>
      </div>
    </transition>

    <transition name="slide-down">
      <div v-if="alert.show" class="absolute top-6 left-0 right-0 flex justify-center z-40 px-4">
        <div :class="['px-6 py-3 rounded-full shadow-xl flex items-center gap-3 text-sm font-bold backdrop-blur-md transition-all transform hover:scale-105', 
          alert.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-green-500/90 text-white']">
          <ExclamationCircleIcon v-if="alert.type === 'error'" class="w-5 h-5" />
          <CheckCircleIcon v-else class="w-5 h-5" />
          {{ alert.msg }}
        </div>
      </div>
    </transition>

    <div class="bg-white w-full max-w-5xl h-[750px] rounded-[3rem] shadow-2xl overflow-hidden flex relative z-10">
      
      <button @click="router.push('/')" class="absolute top-8 left-8 z-20 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition bg-white/90 backdrop-blur px-4 py-2.5 rounded-full shadow-sm hover:shadow-md border border-gray-100">
        <ArrowLeftIcon class="w-4 h-4" /> Home
      </button>

      <div class="hidden lg:block w-1/2 relative bg-gray-900">
        <img src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=1200" class="absolute inset-0 w-full h-full object-cover opacity-60">
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        <div class="relative z-10 h-full flex flex-col justify-end p-16 text-white">
          <div class="w-14 h-14 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-lg">
            <SparklesIcon class="w-8 h-8 text-white" />
          </div>
          <h1 class="text-6xl font-black mb-6 leading-[1.1] tracking-tight">The Art of <br>Coffee.</h1>
          <p class="text-lg text-gray-300 font-medium max-w-sm leading-relaxed">Join CafeX today. Earn rewards, skip the line, and savor the flavor.</p>
        </div>
      </div>

      <div class="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center relative overflow-y-auto custom-scrollbar">
        <div class="max-w-sm mx-auto w-full transition-all duration-500">
          
          <div class="mb-8 text-center lg:text-left">
            <transition name="fade" mode="out-in">
              <h2 :key="mode" class="text-4xl font-black text-gray-900 tracking-tight mb-2">
                {{ mode === 'new-password' ? 'New Password' : (mode === 'forgot' || mode === 'otp-reset' ? 'Reset Password' : (mode.includes('otp') ? 'Verification' : (mode === 'login' ? 'Welcome Back' : 'Get Started'))) }}
              </h2>
            </transition>
            <p class="text-gray-500 font-medium text-sm">
              {{ mode === 'new-password' ? 'Create a secure new password.' : (mode.includes('otp') ? `Enter code sent to ${form.email}` : (mode === 'forgot' ? 'Enter email to receive reset code' : 'Enter your details below.')) }}
            </p>
          </div>

          <div v-show="!mode.includes('otp') && !['forgot', 'new-password'].includes(mode)" class="mb-8 animate-slide-up">
            <div id="google-btn" class="w-full"></div> 
            <div class="relative flex py-4 items-center">
              <div class="flex-grow border-t border-gray-200"></div>
              <span class="flex-shrink-0 mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest">Or continue with email</span>
              <div class="flex-grow border-t border-gray-200"></div>
            </div>
          </div>

          <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="space-y-5 animate-slide-up">
            <div class="space-y-1.5"><label class="input-label">Email Address</label><input v-model="form.email" type="email" placeholder="you@example.com" class="input-modern"></div>
            <div class="space-y-1.5 relative"><label class="input-label">Password</label><input v-model="form.password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••" class="input-modern"><button type="button" @click="showPassword = !showPassword" class="absolute right-4 top-[30px] text-gray-400 hover:text-coffee-600 transition"><EyeIcon v-if="!showPassword" class="w-5 h-5"/><EyeSlashIcon v-else class="w-5 h-5"/></button></div>
            <div class="flex justify-end"><button type="button" @click="switchMode('forgot')" class="text-xs font-bold text-coffee-600 hover:underline">Forgot Password?</button></div>
            <button class="btn-primary mt-2">Sign In <ChevronRightIcon class="w-5 h-5" /></button>
          </form>

          <form v-if="mode === 'register'" @submit.prevent="handleRegister" class="space-y-4 animate-slide-up">
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1"><label class="input-label">Full Name</label><input v-model="form.name" type="text" class="input-modern"></div>
              <div class="space-y-1"><label class="input-label">Phone</label><input v-model="form.phone" type="tel" class="input-modern"></div>
            </div>
            <div class="space-y-1"><label class="input-label">Email</label><input v-model="form.email" type="email" class="input-modern"></div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1"><label class="input-label">Password</label><input v-model="form.password" type="password" class="input-modern"></div>
              <div class="space-y-1"><label class="input-label">Confirm</label><input v-model="form.confirmPassword" type="password" class="input-modern"></div>
            </div>
            <button class="btn-primary mt-4">Send Verification Code</button>
          </form>

          <form v-if="mode === 'forgot'" @submit.prevent="handleForgotPassword" class="space-y-6 animate-slide-up">
            <div class="space-y-1.5"><label class="input-label">Enter Email Address</label><input v-model="form.email" type="email" placeholder="you@example.com" class="input-modern"></div>
            <button class="btn-primary">Send Reset Code <EnvelopeIcon class="w-5 h-5"/></button>
            <div class="text-center"><button type="button" @click="switchMode('login')" class="text-sm font-bold text-gray-400 hover:text-gray-600">Back to Login</button></div>
          </form>

          <form v-if="mode.includes('otp')" @submit.prevent="verifyOtp" class="space-y-8 animate-slide-up">
            <div class="flex justify-center mb-2">
              <div class="bg-coffee-50 p-4 rounded-full text-coffee-600 border border-coffee-100 shadow-sm">
                <component :is="mode === 'otp-reset' ? KeyIcon : EnvelopeIcon" class="w-8 h-8" />
              </div>
            </div>
            <div class="flex justify-between gap-2">
              <input v-for="(digit, index) in 6" :key="index" v-model="otpDigits[index]" :ref="el => { if (el) otpInputs[index] = el }" type="text" maxlength="1" :disabled="isLoading" class="w-12 h-14 border-2 border-gray-200 rounded-xl text-center text-2xl font-black text-gray-900 focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 outline-none transition-all hover:border-gray-300 bg-white disabled:opacity-50" @input="handleOtpInput(index, $event)" @paste="handleOtpPaste" @keydown.backspace="handleOtpBackspace(index, $event)">
            </div>
            
            <button :disabled="isLoading" class="btn-primary opacity-0 pointer-events-none h-0 p-0 overflow-hidden">Verify</button>

            <div class="text-center text-xs font-bold text-gray-400">
              <div v-if="resendTimer > 0" class="flex items-center justify-center gap-1 text-gray-500"><ClockIcon class="w-4 h-4" /> Resend in {{ resendTimer }}s</div>
              <button v-else type="button" @click="handleResend" class="text-coffee-600 hover:underline">Resend Code</button>
              <div class="mt-4"><button type="button" @click="switchMode('login')" class="text-gray-400 hover:text-gray-600 underline">Cancel</button></div>
            </div>
          </form>

          <form v-if="mode === 'new-password'" @submit.prevent="handleSetNewPassword" class="space-y-6 animate-slide-up">
             <div class="flex justify-center mb-4">
               <div class="bg-green-50 p-4 rounded-full text-green-600 border border-green-100 shadow-sm"><LockClosedIcon class="w-8 h-8" /></div>
             </div>
             <div class="space-y-1.5"><label class="input-label">New Password</label><input v-model="form.password" type="password" class="input-modern" placeholder="New Password"></div>
             <div class="space-y-1.5"><label class="input-label">Confirm Password</label><input v-model="form.confirmPassword" type="password" class="input-modern" placeholder="Confirm Password"></div>
             <button class="btn-primary">Set New Password</button>
          </form>

          <div v-if="['login', 'register'].includes(mode)" class="mt-8 pt-6 border-t border-dashed border-gray-200 text-center">
            <p v-if="mode === 'login'" class="text-sm font-medium text-gray-500">New here? <button @click="switchMode('register')" class="text-gray-900 font-bold hover:underline ml-1">Create Account</button></p>
            <p v-else class="text-sm font-medium text-gray-500">Have an account? <button @click="switchMode('login')" class="text-gray-900 font-bold hover:underline ml-1">Sign In</button></p>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-label { @apply block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1; }
.input-modern { @apply w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 font-bold text-gray-900 outline-none focus:bg-white focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10 transition-all placeholder:text-gray-300; }
.btn-primary { @apply w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-base hover:bg-coffee-600 transition-all shadow-xl shadow-gray-200 hover:shadow-coffee-200 active:scale-[0.98] flex items-center justify-center gap-2; }
.custom-scrollbar::-webkit-scrollbar { width: 0px; }
.animate-blob { animation: blob 7s infinite; }
@keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
.animation-delay-2000 { animation-delay: 2s; }
.animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-100%); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>