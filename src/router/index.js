import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../view/HomeView.vue';
import SignInView from '../view/auth/SignInView.vue';
import SignUpView from '../view/auth/SignUpView.vue';
import UserProfileView from '../view/UserProfileView.vue';
import LotView from '../view/LotView.vue';
import { authEventBus } from '@/stores/userStore';

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
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
            meta: { requiresGuest: true }
        },
        {
            path: '/users/signUp',
            name: 'signUp',
            component: SignUpView,
            meta: { requiresGuest: true }
        },
        {
            path: '/users/profile',
            name: 'profile',
            component: UserProfileView,
            meta: { requiresAuth: true }
        },
        { 
            path: '/lots/:id',
            name: 'lotView',
            component: LotView,
            props: true,
        },
    ],
});

// Navigation guard to check auth status
router.beforeEach((to, from, next) => {
    const userData = localStorage.getItem('user');
    const isLoggedIn = userData ? JSON.parse(userData) : null;
    
    // Redirect to login if trying to access a restricted page without being logged in
    if (to.meta.requiresAuth && !isLoggedIn) {
        next('/users/signIn');
    } 
    // Redirect to home if trying to access login/signup while logged in
    else if (to.meta.requiresGuest && isLoggedIn) {
        next('/users/profile');
    } 
    // Proceed as normal
    else {
        next();
    }
});

// Listen for auth state changes and redirect if needed
let isInitialLoad = true;
authEventBus.on('auth-change', ({ isLoggedIn }) => {
    // Skip the first event which happens on app load
    if (isInitialLoad) {
        isInitialLoad = false;
        return;
    }
    
    const currentRoute = router.currentRoute.value;
    
    // If logged in and on a guest-only page (login/register), redirect to profile
    if (isLoggedIn && currentRoute.meta.requiresGuest) {
        router.push('/users/profile');
    }
    // If logged out and on an auth-required page, redirect to login
    else if (!isLoggedIn && currentRoute.meta.requiresAuth) {
        router.push('/users/signIn');
    }
});

export default router;
