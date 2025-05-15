<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useUserStore, authEventBus } from '@/stores/userStore';

const userStore = useUserStore();
const router = useRouter();

// Create a reactive reference for user data
const user = ref(null);

// Function to update user data
const updateUserData = () => {
    const userData = localStorage.getItem('user');
    user.value = userData ? JSON.parse(userData) : null;
};

// Initialize user data
onMounted(() => {
    updateUserData();
    
    // Listen for auth state changes
    authEventBus.on('auth-change', () => {
        updateUserData();
    });
});

// Computed properties based on reactive user data
const accountRoute = computed(() =>
    user.value && user.value.fname ? '/users/profile' : '/users/signIn'
);

const accountLabel = computed(() =>
    user.value && user.value.fname ? user.value.fname : 'Увійти'
);

async function logout() {
    try {
        // Call the logout API endpoint
        const response = await fetch('http://localhost:3000/users/logout', {
            method: 'POST',
            credentials: 'include',
        });
        
        if (response.ok) {
            userStore.clearUser();
            router.push('/users/signIn');
        } else {
            console.error('Logout failed:', response.statusText);
            // Still clear the local state even if server logout fails
            userStore.clearUser();
            router.push('/users/signIn');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        // Still clear the local state even if server logout fails
        userStore.clearUser();
        router.push('/users/signIn');
    }
}
</script>

<template>
    <header>
        <RouterLink to="/" class="logo">Lotify</RouterLink>

        <div class="profile">
            <RouterLink :to="accountRoute">{{ accountLabel }}</RouterLink>
            <button
                v-if="user && user.fname"
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
