<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import UserLayout from '@/layouts/UserLayout.vue'

const route = useRoute()

// Determine which layout to show based on Route Meta
const layout = computed(() => {
  if (route.meta.layout === 'admin') return 'admin-layout' // Handled by RouterView directly
  if (route.meta.layout === 'blank') return 'blank-layout' // Just the page
  return 'user-layout' // Default
})
</script>

<template>
  <div v-if="layout === 'admin-layout'">
    <router-view />
  </div>

  <div v-else-if="layout === 'blank-layout'">
    <router-view />
  </div>

  <UserLayout v-else>
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </UserLayout>
</template>

<style>
.page-enter-active, .page-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.page-enter-from { opacity: 0; transform: translateY(10px); }
.page-leave-to { opacity: 0; transform: translateY(-10px); }
</style>