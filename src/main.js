import './assets/main.css'  
// NOTE: If your file is named 'style.css', write './style.css' instead!
// Check your src/assets folder to see the real name.

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')