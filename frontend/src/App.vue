<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMainStore } from '@/stores/mainStore'
import UserLayout from '@/layouts/UserLayout.vue'
import UserRatingModal from '@/components/UserRatingModal.vue' 
import ToastContainer from '@/components/ToastContainer.vue' // 🟢 Import Toast

const store = useMainStore()
const route = useRoute()

onMounted(() => {
  store.fetchProducts() 
})

const layout = computed(() => {
  if (route.meta.layout === 'admin') return 'admin-layout'
  if (route.meta.layout === 'blank') return 'blank-layout'
  if (route.meta.layout === 'delivery' || route.path.startsWith('/delivery')) return 'delivery-layout'
  return 'user-layout' 
})
</script>

<template>
  
  <div v-if="layout === 'admin-layout'">
    <router-view />
    <ToastContainer /> </div>

  <div v-else-if="layout === 'blank-layout'">
    <router-view />
    <ToastContainer />
  </div>

  <div v-else-if="layout === 'delivery-layout'" class="min-h-screen bg-gray-50 font-sans">
    <ToastContainer /> 
    
    <div class="flex justify-center pt-10 pb-4 animate-fade-in">
       <h1 class="text-4xl font-black text-gray-900 tracking-tight cursor-default select-none">
         Cafe<span class="text-amber-600">X</span> Delivery
       </h1>
    </div>
    
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>

  <UserLayout v-else>
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    
    <UserRatingModal /> 
    </UserLayout>

</template>

<style>
.page-enter-active, .page-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.page-enter-from { opacity: 0; transform: translateY(10px); }
.page-leave-to { opacity: 0; transform: translateY(-10px); }
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
</style>