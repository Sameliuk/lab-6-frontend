<script>
export default {
    data() {
        return {
            searchQuery: '',
            lots: [],
            activeLots: [],
        };
    },
    created() {
        this.fetchAllLots();
    },
    methods: {
        async fetchAllLots() {
            try {
                const response = await fetch('http://localhost:3000/lots');
                if (!response.ok) throw new Error('Помилка отримання лотів');
                const data = await response.json();
                this.lots = Array.isArray(data.data) ? data.data : data;
                this.activeLots = this.lots.filter((lot) => lot.status);
            } catch (error) {
                alert('Помилка при завантаженні лотів.');
            }
        },
        async performSearch() {
            if (!this.searchQuery.trim()) {
                this.fetchAllLots();
                return;
            }
            try {
                const response = await fetch(
                    'http://localhost:3000/lots/search',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: this.searchQuery }),
                    }
                );
                if (!response.ok) throw new Error('Помилка пошуку');
                const data = await response.json();
                this.lots = Array.isArray(data) ? data : data.data;
                this.activeLots = Array.isArray(data)
                    ? data.filter((lot) => lot.status)
                    : data.data.filter((lot) => lot.status);
            } catch (error) {
                alert('Помилка при виконанні пошуку. Спробуйте пізніше.');
            }
        },
        clearSearch() {
            this.searchQuery = '';
            this.fetchAllLots();
        },
    },
};
</script>

<template>
    <div>
        <header>
            <div class="search-bar">
                <input
                    type="search"
                    v-model="searchQuery"
                    placeholder="Пошук..."
                    @keypress.enter="performSearch"
                />
                <button @click="performSearch">Пошук</button>
            </div>
        </header>
        <main>
            <div v-if="activeLots.length">
                <h2 v-if="searchQuery">
                    Результати пошуку: "{{ searchQuery }}"
                </h2>
                <a v-if="searchQuery" @click="clearSearch">Скасувати пошук</a>
                <div class="lots">
                    <div v-for="lot in activeLots" :key="lot.id" class="lot">
                        <img
                            :src="lot.image || '/images/placeholder.jpg'"
                            :alt="lot.title"
                        />
                        <h3>{{ lot.title }}</h3>
                        <p class="desc">{{ lot.description }}</p>
                        <div class="price">
                            <p>Початкова ціна: {{ lot.start_price }}</p>
                            <p>Ціна: {{ lot.current_price }}</p>
                        </div>
                        <a class="more" :href="`/lots/${lot.id}`"
                            >Дізнатись більше</a
                        >
                    </div>
                </div>
            </div>
            <p v-else>На даний момент немає доступних лотів.</p>
        </main>
    </div>
</template>

<style scoped>
@import '@/styles/homePage.css';
</style>
