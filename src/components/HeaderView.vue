<script setup>
import { computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();

const accountRoute = computed(() =>
    userStore.fname ? '/users/profile' : '/users/signIn'
);

const accountLabel = computed(() => (userStore.fname ? 'Профіль' : 'Увійти'));

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) return;

    fetch(`/api/lots/search/?q=${encodeURIComponent(searchTerm)}`)
        .then((response) => response.json())
        .then((data) => {
            console.log('Результати пошуку:', data);
            alert(`Знайдено ${data.results.length} результатів`);
        })
        .catch((error) => {
            console.error('Помилка пошуку:', error);
            alert('Сталася помилка при пошуку');
        });
}

onMounted(() => {
    const searchButton = document.getElementById('searchButton');
    searchButton.addEventListener('click', performSearch);

    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
});
</script>

<template>
    <header>
        <RouterLink to="/" class="logo">Lotify</RouterLink>
        <div class="search-bar">
            <input type="search" id="searchInput" placeholder="Пошук..." />
            <button id="searchButton">Пошук</button>
        </div>
        <div class="profile">
            <RouterLink :to="accountRoute">{{ accountLabel }}</RouterLink>
        </div>
    </header>
</template>

<style scoped>
@import '../styles/homePage.css';
</style>
