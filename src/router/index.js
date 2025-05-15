import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../view/HomeView.vue';
import SignInView from '../view/auth/SignInView.vue';
import SignUpView from '../view/auth/SignUpView.vue';
import UserProfileView from '../view/UserProfileView.vue';
import LotView from '../view/LotView.vue';

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
        { 
        path: '/lots/:id',
        name: 'lotView',
        component: LotView,
        props: true,
    },
    ],
});

export default router;
