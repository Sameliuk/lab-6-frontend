<script>
export default {
    data() {
        return {
            searchQuery: '',
            lots: [],
            activeLots: [],
            currentPage: 1,
            pageSize: 10, // Можна буде використовувати, якщо API підтримує &pageSize=
            totalPages: 1,
            startTime: '',
            endTime: '',
            applyFilter: false,
            isLoading: true,
            error: null,
        };
    },
    created() {
        this.fetchAllLots(); // Завантажуємо початковий список лотів
    },
    methods: {
        async fetchAllLots() { // Додамо прапорець, щоб знати, чи це пошук/фільтр
            this.isLoading = true;
            this.error = null;
            try {
                let url = `http://localhost:3000/lots?page=${this.currentPage}`;
                // Додаємо pageSize до URL, якщо ваш API це підтримує
                // url += `&pageSize=${this.pageSize}`;

                if (this.applyFilter) { // Фільтри дати застосовуються тільки якщо applyFilter true
                    if (this.startTime) {
                        const formattedStartTime = new Date(this.startTime).toISOString();
                        url += `&startTime=${formattedStartTime}`;
                    }
                    if (this.endTime) {
                        const formattedEndTime = new Date(this.endTime).toISOString();
                        url += `&endTime=${formattedEndTime}`;
                    }
                }
                // Пошуковий запит додається до URL, тільки якщо це не результат окремого POST /search
                // Або, якщо ваш GET /lots підтримує &search=, тоді цей блок можна залишити.
                // Наразі, припускаючи що пошук йде через окремий POST, цей блок не потрібен для fetchAllLots.
                // if (!isSearchOrFilter && this.searchQuery.trim()) {
                // url += `&search=${encodeURIComponent(this.searchQuery.trim())}`;
                // }


                console.log('Запит на URL (fetchAllLots):', url);
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Помилка отримання лотів: ${response.status} ${response.statusText}`);
                const data = await response.json();

                if (data && Array.isArray(data.data)) {
                    this.lots = data.data;
                    this.activeLots = this.lots.filter((lot) => lot.status);
                    this.totalPages = data.pagination?.totalPages || 1;
                    this.currentPage = data.pagination?.currentPage || 1;
                } else if (Array.isArray(data)) {
                     this.lots = data;
                     this.activeLots = this.lots.filter((lot) => lot.status);
                     // Якщо пагінація не приходить з data.pagination, встановлюємо її за замовчуванням
                     this.totalPages = data.pagination?.totalPages || Math.ceil(data.length / this.pageSize) || 1;
                     this.currentPage = data.pagination?.currentPage || 1;
                } else {
                    console.error("Неочікуваний формат даних від API (fetchAllLots):", data);
                    this.lots = [];
                    this.activeLots = [];
                    this.totalPages = 1;
                    this.currentPage = 1;
                    throw new Error("Некоректний формат даних лотів від сервера.");
                }
            } catch (error) {
                console.error('Помилка при завантаженні лотів (fetchAllLots):', error);
                this.error = error.message;
            } finally {
                this.isLoading = false;
            }
        },

        // src/view/HomeView.vue -> methods -> performSearch
async performSearch() {
    this.isLoading = true;
    this.error = null;
    if (!this.searchQuery.trim()) {
        this.currentPage = 1;
        this.fetchAllLots(true); // Показуємо всі лоти, якщо пошук порожній
        return;
    }

    try {
        // Формуємо URL з query-параметром title
        const searchUrl = `http://localhost:3000/lots/search?title=${encodeURIComponent(this.searchQuery.trim())}`;
        console.log('Запит на URL (performSearch - GET):', searchUrl);

        const response = await fetch(searchUrl, {
            method: 'GET' // Метод GET
            // Для GET запитів тіло (body) та Content-Type не потрібні і спричиняють помилку
            // headers: { 'Content-Type': 'application/json' }, <--- ВИДАЛИТИ АБО ЗАКОМЕНТУВАТИ
            // body: JSON.stringify({ title: this.searchQuery.trim() }), <--- ВИДАЛИТИ АБО ЗАКОМЕНТУВАТИ
        });

        if (!response.ok) {
            let errorMsg = 'Помилка пошуку';
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorData.message || errorMsg;
            } catch (e) { /* ігнор, якщо відповідь не JSON */ }

            if (response.status === 404) {
                this.lots = [];
                this.activeLots = [];
                this.totalPages = 0;
                this.currentPage = 1;
                // Можна встановити повідомлення для користувача, що нічого не знайдено, замість alert
                this.error = 'Лоти за вашим запитом не знайдено.'; // Встановлюємо помилку для відображення в шаблоні
                this.isLoading = false;
                return;
            }
            throw new Error(errorMsg);
        }
        const data = await response.json();

        if (Array.isArray(data)) {
            this.lots = data;
            this.activeLots = this.lots.filter((lot) => lot.status);
        } else {
            console.error("Неочікуваний формат даних від API (performSearch):", data);
            this.lots = [];
            this.activeLots = [];
             // Якщо пошук повертає дані з пагінацією, потрібно обробити data.pagination
            this.totalPages = (data && data.pagination && data.pagination.totalPages) ? data.pagination.totalPages : 1;
            this.currentPage = (data && data.pagination && data.pagination.currentPage) ? data.pagination.currentPage : 1;
        }
         // Якщо пошук не передбачає пагінацію і повертає всі результати, то:
         // this.totalPages = 1;
         // this.currentPage = 1;

    } catch (error) {
        console.error('Помилка при виконанні пошуку (performSearch):', error);
        this.error = error.message;
    } finally {
        this.isLoading = false;
    }
    },

        changePage(page) {
            if (page > 0 && page <= this.totalPages && page !== this.currentPage) {
                this.currentPage = page;
                // Якщо був активний пошуковий запит, то пагінація має працювати в контексті результатів пошуку.
                // Поточна логіка пошуку скидає пагінацію на 1. Якщо ваш POST /search підтримує пагінацію,
                // тоді changePage має викликати performSearch з параметром page.
                // Наразі, для простоти, припускаємо, що пагінація працює тільки для fetchAllLots.
                this.fetchAllLots();
            }
        },
        clearSearchAndFilters() {
            this.searchQuery = '';
            this.startTime = '';
            this.endTime = '';
            this.applyFilter = false;
            this.currentPage = 1;
            this.fetchAllLots(); // Завантажуємо всі лоти без фільтрів та пошуку
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
            this.currentPage = 1; // Скидаємо на першу сторінку при застосуванні фільтра
            this.fetchAllLots(true); // Викликаємо для оновлення з урахуванням фільтрів та скидання сторінки
        },
    },
};
</script>

<template>
    <div class="home-page-container">
        <header class="controls-header">
             <div class="filter-bar">
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
                <div class="pagination" v-if="totalPages > 1 && !searchQuery.trim()"> <button
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