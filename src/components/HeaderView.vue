<script setup>
import { ref, computed, onMounted } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();
const router = useRouter();

const lotSearch = ref('');
const filteredLots = ref([]);

const accountRoute = computed(() =>
    userStore.fname ? '/users/profile' : '/users/signIn'
);

const accountLabel = computed(() => (userStore.fname ? 'Профіль' : 'Увійти'));

async function searchQuery() {
    const query = lotSearch.value.trim();
    if (query === '') {
        filteredLots.value = [];
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/lots/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({ title: query }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Помилка сервера');
        }

        const data = await response.json();
        filteredLots.value = data.lots || [];
        console.log('Знайдені лоти:', filteredLots.value);

        router.push({ path: '/', query: { q: query } });
    } catch (error) {
        console.error(`Помилка при пошуку лота: ${error.message}`);
        alert('Помилка при виконанні пошуку. Спробуйте пізніше.');
    }
}

onMounted(() => {
    const searchButton = document.getElementById('searchButton');
    searchButton.addEventListener('click', searchQuery);

    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchQuery();
    });
});
</script>

<template>
    <header>
        <RouterLink to="/" class="logo">Lotify</RouterLink>
        <div class="search-bar">
            <input
                v-model="lotSearch"
                type="search"
                id="searchInput"
                placeholder="Пошук..."
            />
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
