<script>
export default {
    data() {
        return {
            searchQuery: '',
            lots: [],
            activeLots: [],
            currentPage: 1,
            pageSize: 10,
            totalPages: 1,
            startTime: '',
            endTime: '',
            applyFilter: false,
        };
    },
    created() {
        this.fetchAllLots();
    },
    methods: {
        async fetchAllLots() {
            try {
                let url = `http://localhost:3000/lots?page=${this.currentPage}`;
                if (this.applyFilter) {
                    if (this.startTime) {
                        const formattedStartTime = new Date(
                            this.startTime
                        ).toISOString();
                        url += `&startTime=${formattedStartTime}`;
                    }
                    if (this.endTime) {
                        const formattedEndTime = new Date(
                            this.endTime
                        ).toISOString();
                        url += `&endTime=${formattedEndTime}`;
                    }
                }
                if (this.searchQuery.trim()) {
                    url += `&search=${encodeURIComponent(this.searchQuery)}`;
                }
                const response = await fetch(url);
                if (!response.ok) throw new Error('Помилка отримання лотів');
                const data = await response.json();
                this.lots = Array.isArray(data.data) ? data.data : data;
                this.activeLots = this.lots.filter((lot) => lot.status);
                this.totalPages = data.pagination?.totalPages || 1;
                this.currentPage = data.pagination?.currentPage || 1;
            } catch (error) {
                alert('Помилка при завантаженні лотів.');
            }
        },
        async performSearch() {
            if (!this.searchQuery.trim()) {
                this.fetchAllLots();
                return;
            }
            this.currentPage = 1;
            this.fetchAllLots();
        },
        changePage(page) {
            if (page > 0 && page <= this.totalPages) {
                this.currentPage = page;
                this.fetchAllLots();
            }
        },
        clearSearch() {
            this.searchQuery = '';
            this.startTime = '';
            this.endTime = '';
            this.applyFilter = false;
            this.currentPage = 1;
            this.fetchAllLots();
        },
        applyDateFilter() {
            if (
                this.startTime &&
                this.endTime &&
                new Date(this.startTime) > new Date(this.endTime)
            ) {
                alert('Дата початку не може бути пізніше дати кінця.');
                return;
            }

            this.applyFilter = !!(this.startTime || this.endTime);
            this.currentPage = 1;
            this.fetchAllLots();
        },
    },
};
</script>

<template>
    <div>
        <header>
            <div class="filter-bar">
                <input type="date" v-model="startTime" placeholder="Початок" />
                <input type="date" v-model="endTime" placeholder="Кінець" />
                <button @click="applyDateFilter">Фільтрувати</button>
                <button @click="clearSearch">Скинути</button>
            </div>
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
                <div class="lots">
                    <div v-for="lot in activeLots" :key="lot.id" class="lot">
                        <img
                            :src="lot.image || '/images/placeholder.jpg'"
                            :alt="lot.title"
                        />
                        <h3>{{ lot.title }}</h3>
                        <p>{{ lot.description }}</p>
                        <p>Початкова ціна: {{ lot.start_price }}</p>
                        <p>Ціна: {{ lot.current_price }}</p>
                    </div>
                </div>
                <div class="pagination">
                    <button
                        @click="changePage(currentPage - 1)"
                        :disabled="currentPage === 1"
                    >
                        Попередня
                    </button>
                    <span>{{ currentPage }} / {{ totalPages }}</span>
                    <button
                        @click="changePage(currentPage + 1)"
                        :disabled="currentPage === totalPages"
                    >
                        Наступна
                    </button>
                </div>
            </div>
            <p v-else>Немає доступних лотів.</p>
        </main>
    </div>
</template>

<style scoped>
@import '@/styles/homePage.css';
</style>
