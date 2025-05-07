import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import SignInView from '@/views/auth/SignInView.vue';
import SignUpView from '@/views/auth/SignUpView.vue';
import UserProfileView from '@/views/UserProfileView.vue';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
        },
        {
            path: '/users/signIn',
            name: 'signIn',
            component: SignInView,
        },
        {
            path: '/users/signUp',
            name: 'signUp',
            component: SignUpView,
        },
        {
            path: '/users/profile',
            name: 'profile',
            component: UserProfileView,
        },
    ],
});

export default router;
