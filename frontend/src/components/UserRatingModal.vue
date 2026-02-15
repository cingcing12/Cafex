<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useMainStore } from '@/stores/mainStore';
import api from '@/api/config';
import { StarIcon, XMarkIcon, UserCircleIcon, ShieldCheckIcon } from '@heroicons/vue/24/solid';

const store = useMainStore();
const showModal = ref(false);
const rating = ref(0);
const staffId = ref(null);
const isLoading = ref(false);

const staffDetails = ref({
    name: 'Delivery Partner',
    image: '',
    rating: 5.0
});

onMounted(() => {
    // 🟢 Listener for the event dispatched by NotificationBell
    window.addEventListener('open-rating-modal', (event) => {
        console.log("✅ Modal Event Received:", event.detail);
        if (event.detail && event.detail.staffId) {
            openModal(event.detail);
        } else {
            console.error("❌ Modal Event Missing staffId");
        }
    });
});

const openModal = async (data) => {
    staffId.value = data.staffId;
    showModal.value = true;
    
    // Fetch latest details to show nice image/name
    try {
        const res = await api.get(`/admin/staff`); 
        const found = res.data.find(s => s._id === data.staffId || s.id === data.staffId);
        
        if (found) {
            staffDetails.value = {
                name: found.name,
                image: found.image || '',
                rating: found.rating || 5.0
            };
        }
    } catch (e) { console.error(e); }
}

const submitRating = async () => {
    if (rating.value === 0) {
        store.showToast("Please select a star rating first!", "warning");
        return;
    }

    isLoading.value = true;
    try {
        await api.post('/delivery/rate', { staffId: staffId.value, stars: rating.value });
        store.showToast("Rating submitted successfully!", "success");
        showModal.value = false;
        rating.value = 0;
    } catch (e) {
        store.showToast("Failed to submit rating.", "error");
    } finally {
        isLoading.value = false;
    }
};

const handleImageError = (e) => { e.target.style.display = 'none'; }

onUnmounted(() => { window.removeEventListener('open-rating-modal', () => {}); });
</script>

<template>
    <Teleport to="body">
        <transition name="modal-fade">
            <div v-if="showModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-md">
                
                <div class="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl relative animate-bounce-up border border-white/20" @click.stop>
                    
                    <button @click="showModal = false" class="absolute top-5 right-5 p-2 bg-gray-50 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                        <XMarkIcon class="w-6 h-6"/>
                    </button>
                    
                    <h2 class="text-xl font-black text-gray-900 mb-8">Rate Your Driver</h2>
                    
                    <div class="flex flex-col items-center mb-8 relative">
                        <div class="relative mb-4 group">
                            <div class="w-28 h-28 rounded-full p-1.5 border-4 border-gray-50 bg-white shadow-xl overflow-hidden relative z-10">
                                <img v-if="staffDetails.image" :src="staffDetails.image" class="w-full h-full object-cover rounded-full" @error="handleImageError">
                                <div v-else class="w-full h-full flex items-center justify-center bg-gray-100 rounded-full text-gray-300">
                                    <UserCircleIcon class="w-20 h-20"/>
                                </div>
                            </div>
                            <div class="absolute bottom-1 right-1 z-20 bg-blue-500 text-white p-1.5 rounded-full border-4 border-white shadow-sm">
                                <ShieldCheckIcon class="w-5 h-5"/>
                            </div>
                        </div>

                        <h2 class="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">{{ staffDetails.name }}</h2>
                        <div class="flex items-center gap-1 text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full mt-2">
                            <StarIcon class="w-4 h-4 text-yellow-400" />
                            <span>{{ staffDetails.rating.toFixed(1) }} Rating</span>
                        </div>
                    </div>

                    <div class="flex justify-center gap-2 mb-8">
                        <StarIcon 
                            v-for="star in 5" :key="star" 
                            @click="rating = star"
                            :class="['w-12 h-12 cursor-pointer transition-all duration-300 transform hover:scale-125', star <= rating ? 'text-yellow-400' : 'text-gray-200']" 
                        />
                    </div>

                    <button @click="submitRating" :disabled="isLoading" class="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition shadow-xl active:scale-95 text-lg flex items-center justify-center gap-2">
                        <span v-if="isLoading" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span v-else>Submit Review</span>
                    </button>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.animate-bounce-up { animation: bounceUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes bounceUp { from { opacity: 0; transform: scale(0.8) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
</style>