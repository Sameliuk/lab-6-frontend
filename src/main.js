import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import { useUserStore } from '@/stores/userStore';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

const userStore = useUserStore();
userStore.loadUserFromLocalStorage();

app.mount('#app');
