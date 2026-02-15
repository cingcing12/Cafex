<script setup>
import { ref, computed } from 'vue'
import { useMainStore } from '@/stores/mainStore'
import { BellIcon } from '@heroicons/vue/24/outline'
import { BellIcon as BellSolid, XMarkIcon, StarIcon, TruckIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/solid'

const store = useMainStore()
const isOpen = ref(false)

const toggle = () => isOpen.value = !isOpen.value

// Sort: Newest First
const sortedNotifications = computed(() => {
    return [...store.notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

const handleNotificationClick = (note) => {
  console.log("🔔 Notification Clicked:", note);

  if (note.type === 'rating') {
    // 1. Extract Data safely
    const payload = note.data || {};

    // 2. Validate Data
    if (!payload.staffId) {
        console.error("❌ Notification missing 'staffId'. Cannot open rating.", note);
        store.showToast("Error: This notification is missing driver data.", "error");
        return;
    }

    // 3. Dispatch Event to Modal
    console.log("✅ Dispatching 'open-rating-modal' with:", payload);
    window.dispatchEvent(new CustomEvent('open-rating-modal', { detail: payload }));
    
    // 4. Mark Read & Close
    store.markNotificationRead(note.id);
    isOpen.value = false;
  } else {
    // For normal alerts, just mark read
    store.markNotificationRead(note.id);
  }
}

// Icons & Colors
const getIcon = (type) => {
    if (type === 'rating') return StarIcon;
    if (type === 'delivery') return TruckIcon;
    if (type === 'alert') return ExclamationTriangleIcon;
    return BellSolid;
}

const getIconColor = (type) => {
    if (type === 'rating') return 'text-yellow-500 bg-yellow-100';
    if (type === 'delivery') return 'text-blue-500 bg-blue-100';
    if (type === 'alert') return 'text-red-500 bg-red-100';
    return 'text-gray-500 bg-gray-100';
}
</script>

<template>
  <div class="relative">
    <button @click="toggle" class="relative p-2 rounded-full hover:bg-gray-100 transition focus:outline-none">
      <BellIcon class="w-6 h-6 text-gray-600" />
      <transition name="scale">
        <span v-if="store.unreadCount > 0" class="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm ring-2 ring-white animate-pulse">
            {{ store.unreadCount }}
        </span>
      </transition>
    </button>

    <transition name="dropdown">
      <div v-if="isOpen" class="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden origin-top-right">
        
        <div class="px-5 py-4 border-b border-gray-100 bg-white flex justify-between items-center">
          <h3 class="text-sm font-black text-gray-900 tracking-tight">Notifications</h3>
          <button @click="isOpen = false" class="text-gray-400 hover:text-gray-600 transition"><XMarkIcon class="w-5 h-5"/></button>
        </div>

        <div class="max-h-[24rem] overflow-y-auto custom-scrollbar">
          <div v-if="sortedNotifications.length === 0" class="p-10 text-center flex flex-col items-center">
            <BellIcon class="w-10 h-10 text-gray-200 mb-2" />
            <p class="text-gray-400 text-xs font-bold uppercase tracking-wider">No notifications</p>
          </div>
          
          <div v-else>
            <div 
              v-for="note in sortedNotifications" 
              :key="note.id" 
              @click="handleNotificationClick(note)"
              :class="['p-4 border-b border-gray-50 cursor-pointer transition hover:bg-gray-50 flex gap-4', !note.isRead ? 'bg-blue-50/30' : 'bg-white']"
            >
              <div :class="['w-10 h-10 rounded-full flex items-center justify-center shrink-0', getIconColor(note.type)]">
                <component :is="getIcon(note.type)" class="w-5 h-5" />
              </div>

              <div class="flex-1">
                <div class="flex justify-between items-start mb-1">
                    <h4 class="text-sm font-bold text-gray-900 leading-tight">{{ note.title }}</h4>
                    <span v-if="!note.isRead" class="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5"></span>
                </div>
                <p class="text-xs text-gray-500 leading-relaxed mb-1">{{ note.message }}</p>
                <span class="text-[10px] text-gray-400 font-medium">{{ new Date(note.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
                
                <div v-if="note.type === 'rating'" class="mt-2">
                    <span class="text-[10px] font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg uppercase tracking-wide hover:bg-yellow-100 transition shadow-sm inline-flex items-center gap-1">
                        <StarIcon class="w-3 h-3"/> Rate Driver
                    </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="sortedNotifications.length > 0" class="bg-gray-50 p-2 text-center border-t border-gray-100">
            <button @click="store.notifications.forEach(n => store.markNotificationRead(n.id))" class="text-xs font-bold text-blue-600 hover:text-blue-700 transition">Mark all as read</button>
        </div>
      </div>
    </transition>

    <div v-if="isOpen" @click="isOpen = false" class="fixed inset-0 z-40 bg-transparent cursor-default"></div>
  </div>
</template>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: scale(0.95) translateY(-10px); }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
.scale-enter-active, .scale-leave-active { transition: transform 0.2s; }
.scale-enter-from, .scale-leave-to { transform: scale(0); }
</style>