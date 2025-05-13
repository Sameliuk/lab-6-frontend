<script setup>
import { computed } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();
const router = useRouter();

const accountRoute = computed(() =>
    userStore.fname ? '/users/profile' : '/users/signIn'
);

const accountLabel = computed(() =>
    userStore.fname ? userStore.fname : 'Увійти'
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
            <button v-if="userStore.fname" @click="logout" class="logout-btn">
                Вийти
            </button>
        </div>
    </header>
</template>

<style scoped>
@import '../styles/homePage.css';
</style>
