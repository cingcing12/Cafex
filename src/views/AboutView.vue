<script setup>
import { ref, computed } from 'vue'
import { useMainStore } from '@/stores/mainStore'
import { StarIcon } from '@heroicons/vue/24/solid'
import { 
  UserGroupIcon, 
  MapPinIcon, 
  TrophyIcon 
} from '@heroicons/vue/24/outline'

const store = useMainStore()
const userRating = ref(0)
const userComment = ref('')

const averageStoreRating = computed(() => store.getAverageRating(store.storeReviews))

const submitStoreReview = () => {
  if (userRating.value === 0) return alert('Please select a star rating')
  store.addStoreReview(userRating.value, userComment.value)
  userRating.value = 0
  userComment.value = ''
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    
    <div class="relative h-[500px] flex items-center justify-center overflow-hidden bg-fixed bg-center bg-cover" 
         style="background-image: url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600');">
      
      <div class="absolute inset-0 bg-black/60"></div>
      
      <div class="relative z-10 text-center text-white px-4 animate-fade-in-up">
        <span class="text-coffee-400 font-bold tracking-[0.3em] uppercase mb-4 block text-sm">Since 2024</span>
        <h1 class="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">Brewing Passion</h1>
        <p class="text-xl text-gray-200 max-w-2xl mx-auto font-light leading-relaxed">
          More than just coffee. It's an experience, a community, and a lifestyle crafted for the bold.
        </p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-20">
      <div class="grid md:grid-cols-2 gap-16 items-center">
        
        <div class="space-y-6">
          <h2 class="text-4xl font-bold text-gray-900 leading-tight">
            Our Journey from <br><span class="text-coffee-600">Bean to Cup</span>
          </h2>
          <div class="w-20 h-1 bg-coffee-500 rounded-full"></div>
          
          <p class="text-gray-600 leading-relaxed text-lg">
            Founded in 2024, <span class="font-bold text-gray-800">CAFÉX</span> started with a simple mission: to serve the perfect cup. We source our beans directly from sustainable farms and roast them in small batches to ensure maximum flavor profile.
          </p>
          <p class="text-gray-600 leading-relaxed text-lg">
            We believe in <strong>"Quality over Quantity"</strong>. Every barista is a master of their craft, ensuring that your latte art is as beautiful as the coffee tastes.
          </p>
          
          <div class="grid grid-cols-3 gap-4 mt-8">
            <div class="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <TrophyIcon class="w-8 h-8 mx-auto text-coffee-500 mb-2" />
              <div class="text-2xl font-bold text-gray-900">15k+</div>
              <div class="text-xs text-gray-500 uppercase font-bold tracking-wide mt-1">Served</div>
            </div>
            <div class="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <StarIcon class="w-8 h-8 mx-auto text-yellow-400 mb-2" />
              <div class="text-2xl font-bold text-gray-900">4.9</div>
              <div class="text-xs text-gray-500 uppercase font-bold tracking-wide mt-1">Rating</div>
            </div>
            <div class="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <MapPinIcon class="w-8 h-8 mx-auto text-coffee-500 mb-2" />
              <div class="text-2xl font-bold text-gray-900">5+</div>
              <div class="text-xs text-gray-500 uppercase font-bold tracking-wide mt-1">Shops</div>
            </div>
          </div>
        </div>

        <div class="relative">
          <img src="https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800" class="rounded-3xl shadow-2xl relative z-10 transform hover:scale-[1.02] transition duration-500">
          <div class="absolute -inset-4 bg-coffee-200 rounded-3xl blur-2xl opacity-30 -z-10"></div>
        </div>
      </div>
    </div>

    <div class="bg-white py-20 border-t border-gray-100">
      <div class="max-w-4xl mx-auto px-4">
        
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900">Community Love</h2>
          <div class="flex items-center justify-center gap-3 mt-4">
            <span class="text-5xl font-extrabold text-coffee-600">{{ averageStoreRating }}</span>
            <div class="text-left">
              <div class="flex text-yellow-400 mb-1">
                <StarIcon v-for="i in 5" :key="i" class="w-5 h-5" :class="i <= Math.round(averageStoreRating) ? 'text-yellow-400' : 'text-gray-300'" />
              </div>
              <span class="text-sm text-gray-500 font-medium">{{ store.storeReviews.length }} happy customers</span>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 p-8 rounded-3xl shadow-inner mb-12 border border-gray-100">
          <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UserGroupIcon class="w-5 h-5 text-coffee-600" /> 
            Leave a Review
          </h3>
          
          <div class="flex gap-2 mb-4 cursor-pointer">
            <StarIcon 
              v-for="i in 5" :key="i" 
              @click="userRating = i"
              :class="['w-8 h-8 transition transform hover:scale-110', i <= userRating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200']" 
            />
          </div>
          
          <div class="relative">
            <textarea v-model="userComment" rows="3" placeholder="Tell us about your experience..." class="w-full border-0 bg-white rounded-xl p-4 shadow-sm focus:ring-2 ring-coffee-500 outline-none resize-none text-gray-700"></textarea>
            <button @click="submitStoreReview" class="absolute bottom-3 right-3 bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-coffee-600 transition shadow-lg">
              Post
            </button>
          </div>
        </div>

        <div class="space-y-6">
          <div v-for="review in store.storeReviews.slice().reverse()" :key="review.id" class="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition flex gap-5">
            <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-coffee-400 to-coffee-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
              {{ review.user.charAt(0) }}
            </div>
            <div class="flex-1">
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-bold text-gray-900 text-lg">{{ review.user }}</h4>
                  <span class="text-xs text-gray-400 font-medium">{{ review.date }}</span>
                </div>
                <div class="flex text-yellow-400 bg-yellow-50 px-2 py-1 rounded-lg">
                   <StarIcon v-for="i in 5" :key="i" class="w-4 h-4" :class="i <= review.rating ? 'text-yellow-400' : 'text-gray-300'" />
                </div>
              </div>
              <p class="text-gray-600 mt-3 leading-relaxed">"{{ review.comment }}"</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 1s ease-out forwards;
  opacity: 0;
  transform: translateY(30px);
}

@keyframes fadeInUp {
  to { opacity: 1; transform: translateY(0); }
}
</style>