<script setup>
import { useMainStore } from '@/stores/mainStore'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  InformationCircleIcon, 
  ExclamationTriangleIcon,
  XMarkIcon 
} from '@heroicons/vue/24/outline'

const store = useMainStore()

const getIcon = (type) => {
  if (type === 'success') return CheckCircleIcon
  if (type === 'error') return XCircleIcon
  if (type === 'warning') return ExclamationTriangleIcon
  return InformationCircleIcon
}

const getStyles = (type) => {
  if (type === 'success') return 'bg-white border-l-4 border-emerald-500'
  if (type === 'error') return 'bg-white border-l-4 border-rose-500'
  if (type === 'warning') return 'bg-white border-l-4 border-amber-500'
  return 'bg-white border-l-4 border-blue-500'
}

const getIconColor = (type) => {
  if (type === 'success') return 'text-emerald-500'
  if (type === 'error') return 'text-rose-500'
  if (type === 'warning') return 'text-amber-500'
  return 'text-blue-500'
}
</script>

<template>
  <div class="fixed top-24 right-0 z-[9999] flex flex-col gap-3 pointer-events-none p-5 overflow-hidden w-full max-w-md ml-auto">
    <transition-group name="toast-slide">
      <div 
        v-for="toast in store.toasts" 
        :key="toast.id"
        :class="['pointer-events-auto flex items-center gap-4 px-5 py-4 rounded-xl shadow-2xl shadow-gray-200 border border-gray-100 relative overflow-hidden', getStyles(toast.type)]"
      >
        <div :class="['w-10 h-10 rounded-full flex items-center justify-center bg-opacity-10 shrink-0', getIconColor(toast.type).replace('text-', 'bg-')]">
            <component :is="getIcon(toast.type)" :class="['w-6 h-6', getIconColor(toast.type)]" />
        </div>
        
        <div class="flex-1">
          <h4 class="text-sm font-black text-gray-900 capitalize tracking-wide">{{ toast.type }}</h4>
          <p class="text-xs text-gray-500 font-medium leading-relaxed">{{ toast.message }}</p>
        </div>

        <button @click="store.removeToast(toast.id)" class="text-gray-300 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-slide-enter-active { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.toast-slide-leave-active { transition: all 0.3s ease-in; position: absolute; }
.toast-slide-enter-from { opacity: 0; transform: translateX(100%); }
.toast-slide-leave-to { opacity: 0; transform: translateX(100%); }
.toast-slide-move { transition: all 0.4s ease; }
</style>