// src/view/HomeView.vue
<script>
export default {
    data() {
        return {
            searchQuery: '',
            lots: [],
            activeLots: [], // Цей масив буде містити тільки активні лоти для відображення
            currentPage: 1,
            pageSize: 10, // Це значення не використовується в поточній логіці fetch, але може бути корисним
            totalPages: 1,
            startTime: '',
            endTime: '',
            applyFilter: false,
            isLoading: true, // Додамо стан завантаження
            error: null,     // Додамо стан для помилок
        };
    },
    created() {
        this.fetchAllLots();
    },
    methods: {
        async fetchAllLots() {
            this.isLoading = true;
            this.error = null;
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
<<<<<<< HEAD
                if (this.searchQuery.trim()) {
                    url += `&search=${encodeURIComponent(this.searchQuery.trim())}`;
                }
=======
>>>>>>> 605ad20 (search)
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Помилка отримання лотів: ${response.statusText}`);
                const data = await response.json();

                // Перевіряємо структуру даних, що повертаються
                if (data && Array.isArray(data.data)) {
                    this.lots = data.data; // Зберігаємо всі лоти (активні та неактивні)
                    this.activeLots = this.lots.filter((lot) => lot.status); // Фільтруємо тільки активні для відображення
                    this.totalPages = data.pagination?.totalPages || 1;
                    this.currentPage = data.pagination?.currentPage || 1;
                } else if (Array.isArray(data)) { // Якщо API повертає просто масив лотів
                     this.lots = data;
                     this.activeLots = this.lots.filter((lot) => lot.status);
                     this.totalPages = 1; // Або логіка пагінації має бути іншою
                     this.currentPage = 1;
                } else {
                    console.error("Неочікуваний формат даних від API:", data);
                    this.lots = [];
                    this.activeLots = [];
                    this.totalPages = 1;
                    this.currentPage = 1;
                    throw new Error("Некоректний формат даних лотів від сервера.");
                }
            } catch (error) {
                console.error('Помилка при завантаженні лотів:', error);
                this.error = error.message;
                // alert('Помилка при завантаженні лотів.'); // Можна замінити на відображення this.error в шаблоні
            } finally {
                this.isLoading = false;
            }
        },
        async performSearch() {
<<<<<<< HEAD
            // Скидання на першу сторінку перед новим пошуком/фільтрацією
            this.currentPage = 1;
            this.fetchAllLots();
=======
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

                this.totalPages = 1;
                this.currentPage = 1;

                if (this.activeLots.length === 0) {
                    alert('Лоти не знайдено.');
                }
            } catch (error) {
                alert('Помилка при виконанні пошуку. Спробуйте пізніше.');
            }
>>>>>>> 605ad20 (search)
        },
        changePage(page) {
            if (page > 0 && page <= this.totalPages && page !== this.currentPage) {
                this.currentPage = page;
                this.fetchAllLots();
            }
        },
        clearSearchAndFilters() { // Перейменовано для ясності
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
            this.performSearch(); // Викликаємо performSearch для скидання сторінки та оновлення
        },
    },
};
</script>

<template>
    <div class="home-page-container"> <header class="controls-header"> <div class="filter-bar">
                <input type="date" v-model="startTime" placeholder="Початок" />
                <input type="date" v-model="endTime" placeholder="Кінець" />
                <button @click="applyDateFilter">Фільтрувати за датою</button>
            </div>
            <div class="search-bar">
                <input
                    type="search"
                    v-model="searchQuery"
                    placeholder="Пошук за назвою..."
                    @keypress.enter="performSearch"
                />
                <button @click="performSearch">Пошук</button>
            </div>
            <button @click="clearSearchAndFilters" class="clear-button">Скинути все</button>
        </header>

        <main>
            <div v-if="isLoading" class="loading-message">
                <p>Завантаження лотів...</p>
            </div>
            <div v-else-if="error" class="error-message-display">
                <p>Виникла помилка: {{ error }}</p>
                <p>Будь ласка, спробуйте оновити сторінку або спробуйте пізніше.</p>
            </div>
            <div v-else-if="activeLots.length">
                <div class="lots">
                    <router-link
                        v-for="lot in activeLots"
                        :key="lot.id"
                        :to="{ name: 'lotView', params: { id: lot.id } }"
                        class="lot-card-link"
                    >
                        <div class="lot">
                            <div class="lot-image-container">
                                <img
                                    :src="lot.image || '/images/placeholder.jpg'" 
                                    :alt="lot.title"
                                    class="lot-image"
                                />
                            </div>
                            <h3>{{ lot.title }}</h3>
                            <p class="desc">{{ lot.description }}</p>
                            <p class="price">Початкова ціна: {{ lot.start_price }} ₴</p>
                            <p class="price"><strong>Поточна ціна: {{ lot.current_price }} ₴</strong></p>
                            </div>
                    </router-link>
                </div>
                <div class="pagination" v-if="totalPages > 1">
                    <button
                        @click="changePage(currentPage - 1)"
                        :disabled="currentPage === 1"
                    >
                        Попередня
                    </button>
                    <span>Сторінка {{ currentPage }} з {{ totalPages }}</span>
                    <button
                        @click="changePage(currentPage + 1)"
                        :disabled="currentPage === totalPages"
                    >
                        Наступна
                    </button>
                </div>
            </div>
            <p v-else class="no-lots-message">Немає активних лотів, що відповідають вашому запиту.</p>
        </main>
    </div>
</template>

<style scoped>
/* Імпорт стилів залишається, але ви можете додати/змінити стилі тут */
@import '@/styles/homePage.css';

.home-page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.controls-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    margin-bottom: 25px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.filter-bar, .search-bar {
    display: flex;
    gap: 10px;
    align-items: center;
}

.filter-bar input[type="date"],
.search-bar input[type="search"] {
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.95rem;
}

.filter-bar button,
.search-bar button,
.clear-button {
    padding: 8px 15px;
    background-color: navy;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-size: 0.95rem;
}

.filter-bar button:hover,
.search-bar button:hover,
.clear-button:hover {
    background-color: #0000b3; /* Темніший navy */
}
.clear-button {
    background-color: #6c757d; /* Сірий для кнопки скидання */
}
.clear-button:hover {
    background-color: #5a6268;
}


.lots {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); /* Адаптовано для кращого вигляду */
    gap: 25px;
}

.lot-card-link {
    text-decoration: none; /* Прибираємо підкреслення для посилання-картки */
    color: inherit; /* Успадковуємо колір тексту */
    display: block; /* Щоб посилання займало всю картку */
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    border-radius: 10px; /* Для ефекту при наведенні */
}

.lot-card-link:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.lot {
    background-color: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05); /* Легка тінь */
    display: flex;
    flex-direction: column;
    height: 100%; /* Щоб всі картки були однакової висоти в рядку */
}
.lot-image-container {
    width: 100%;
    height: 200px; /* Фіксована висота для контейнера зображення */
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-bottom: 15px;
    background-color: #f0f0f0; /* Фон для випадків, коли зображення не завантажується */
    border-radius: 5px;
}

.lot-image {
    width: 100%;
    height: 100%;
    object-fit: cover; /* Зображення буде покривати контейнер, обрізаючись */
}

.lot h3 {
    margin: 10px 0;
    font-size: 1.25rem;
    color: navy;
    font-weight: 600;
}

.lot .desc {
    font-size: 0.9rem;
    color: #555;
    flex-grow: 1; /* Щоб опис розтягувався, якщо картки різної висоти */
    margin-bottom: 10px;
    line-height: 1.5;
    /* Обмеження тексту опису */
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3; /* Кількість рядків, які будуть показані */
    -webkit-box-orient: vertical;
}

.lot .price {
    margin-bottom: 5px;
    font-size: 1rem;
    color: #333;
}
.lot .price strong {
    color: #28a745; /* Зелений для поточної ціни */
}


.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 30px;
    gap: 10px;
}

.pagination button {
    padding: 8px 16px;
    background-color: navy;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.pagination button:hover:not(:disabled) {
    background-color: #0000b3;
}

.pagination button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.pagination span {
    font-size: 1rem;
    color: navy;
    margin: 0 10px;
}

.loading-message, .no-lots-message, .error-message-display {
    text-align: center;
    font-size: 1.2em;
    color: #666;
    padding: 40px 20px;
}
.error-message-display p {
    color: #d8000c;
}
.error-message-display p:first-child {
    font-weight: bold;
    margin-bottom: 10px;
}
</style>