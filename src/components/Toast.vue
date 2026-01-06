<script setup>
import { useMainStore } from '@/stores/mainStore'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/solid'

const store = useMainStore()
</script>

<template>
  <transition name="toast-slide">
    <div v-if="store.toast.show" class="fixed top-24 right-5 z-50 flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full">
      <div v-if="store.toast.type === 'success'" class="text-green-500">
        <CheckCircleIcon class="w-6 h-6" />
      </div>
      <div v-else class="text-red-500">
        <XCircleIcon class="w-6 h-6" />
      </div>
      
      <div class="flex-1">
        <h4 class="font-bold text-gray-900 text-sm">{{ store.toast.type === 'success' ? 'Success' : 'Error' }}</h4>
        <p class="text-gray-500 text-xs">{{ store.toast.message }}</p>
      </div>
      
      <button @click="store.toast.show = false" class="text-gray-400 hover:text-gray-600">✕</button>
    </div>
  </transition>
</template>

<style scoped>
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateX(50px) scale(0.9); }
</style>