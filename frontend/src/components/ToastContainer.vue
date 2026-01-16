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
  if (type === 'success') return 'bg-emerald-50 text-emerald-800 border-emerald-100'
  if (type === 'error') return 'bg-rose-50 text-rose-800 border-rose-100'
  if (type === 'warning') return 'bg-amber-50 text-amber-800 border-amber-100'
  return 'bg-blue-50 text-blue-800 border-blue-100' // info
}

const getIconColor = (type) => {
  if (type === 'success') return 'text-emerald-500'
  if (type === 'error') return 'text-rose-500'
  if (type === 'warning') return 'text-amber-500'
  return 'text-blue-500'
}
</script>

<template>
  <div class="fixed top-24 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
    <transition-group name="toast">
      <div 
        v-for="toast in store.toasts" 
        :key="toast.id"
        :class="['pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg shadow-gray-200/50 backdrop-blur-md min-w-[300px] max-w-sm transition-all', getStyles(toast.type)]"
      >
        <component :is="getIcon(toast.type)" :class="['w-6 h-6 shrink-0 mt-0.5', getIconColor(toast.type)]" />
        
        <div class="flex-1 pt-0.5">
          <h4 class="text-sm font-bold capitalize">{{ toast.type }}</h4>
          <p class="text-xs opacity-90 mt-0.5 leading-relaxed">{{ toast.message }}</p>
        </div>

        <button @click="store.removeToast(toast.id)" class="opacity-50 hover:opacity-100 transition-opacity">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(50px) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(50px);
}
</style>