<script setup>
import { computed } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();
const router = useRouter();

const userData = localStorage.getItem('user');
const parsedUser = userData ? JSON.parse(userData) : null;

const accountRoute = computed(() =>
    parsedUser && parsedUser.fname ? '/users/profile' : '/users/signIn'
);

const accountLabel = computed(() =>
    parsedUser && parsedUser.fname ? parsedUser.fname : 'Увійти'
);

function logout() {
    userStore.clearUser();
    localStorage.removeItem('user');
    router.push('/users/signIn');
}
</script>

<template>
    <header>
        <RouterLink to="/" class="logo">Lotify</RouterLink>

        <div class="profile">
            <RouterLink :to="accountRoute">{{ accountLabel }}</RouterLink>
            <button
                v-if="parsedUser && parsedUser.fname"
                @click="logout"
                class="logout-btn"
            >
                Вийти
            </button>
        </div>
    </header>
</template>

<style scoped>
@import '../styles/homePage.css';
</style>
