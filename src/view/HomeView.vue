<script setup>
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();
const searchQuery = ref('');
const lots = ref([]);
const activeLots = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = ref(1);
const startTime = ref('');
const endTime = ref('');
const applyFilter = ref(false);

// Betting modal
const showBetModal = ref(false);
const selectedLot = ref(null);
const betAmount = ref(null);
const isMakingBet = ref(false);
const betError = ref('');
const betSuccess = ref('');

// Computed property to check if user is authenticated
const isAuthenticated = computed(() => !!userStore.userId);

// Computed property to check if user is owner of the current lot
const isCurrentLotOwner = computed(() => {
    if (!selectedLot.value || !userStore.userId) return false;
    return selectedLot.value.user_id === userStore.userId;
});

const fetchAllLots = async () => {
    try {
        let url = `http://localhost:3000/lots?page=${currentPage.value}&pageSize=${pageSize.value}`;
        if (applyFilter.value) {
            if (startTime.value) {
                const formattedStartTime = new Date(
                    startTime.value
                ).toISOString();
                url += `&startTime=${formattedStartTime}`;
            }
            if (endTime.value) {
                const formattedEndTime = new Date(
                    endTime.value
                ).toISOString();
                url += `&endTime=${formattedEndTime}`;
            }
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Помилка отримання лотів');
        const data = await response.json();
        lots.value = Array.isArray(data.data) ? data.data : data;
        activeLots.value = lots.value.filter((lot) => lot.status);
        totalPages.value = data.pagination?.totalPages || 1;
        currentPage.value = data.pagination?.currentPage || 1;
    } catch (error) {
        alert('Помилка при завантаженні лотів.');
    }
};

const performSearch = async () => {
    if (!searchQuery.value.trim()) {
        fetchAllLots();
        return;
    }
    try {
        const response = await fetch(
            'http://localhost:3000/lots/search',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: searchQuery.value }),
            }
        );
        if (!response.ok) throw new Error('Помилка пошуку');
        const data = await response.json();
        lots.value = Array.isArray(data) ? data : data.data;
        activeLots.value = Array.isArray(data)
            ? data.filter((lot) => lot.status)
            : data.data.filter((lot) => lot.status);

        totalPages.value = 1;
        currentPage.value = 1;

        if (activeLots.value.length === 0) {
            alert('Лоти не знайдено.');
        }
    } catch (error) {
        alert('Помилка при виконанні пошуку. Спробуйте пізніше.');
    }
};

const changePage = (page) => {
    if (page > 0 && page <= totalPages.value) {
        currentPage.value = page;
        fetchAllLots();
    }
};

const clearSearch = () => {
    searchQuery.value = '';
    startTime.value = '';
    endTime.value = '';
    applyFilter.value = false;
    currentPage.value = 1;
    fetchAllLots();
};

const applyDateFilter = () => {
    if (
        startTime.value &&
        endTime.value &&
        new Date(startTime.value) > new Date(endTime.value)
    ) {
        alert('Дата початку не може бути пізніше дати кінця.');
        return;
    }

    applyFilter.value = !!(startTime.value || endTime.value);
    currentPage.value = 1;
    fetchAllLots();
};

// Open bet modal for a lot
const openBetModal = (lot) => {
    if (!isAuthenticated.value) {
        alert('Будь ласка, увійдіть, щоб зробити ставку.');
        return;
    }
    
    selectedLot.value = lot;
    betAmount.value = lot.current_price ? parseFloat(lot.current_price) + 1 : parseFloat(lot.start_price) + 1;
    betError.value = '';
    betSuccess.value = '';
    showBetModal.value = true;
};

// Close bet modal
const closeBetModal = () => {
    showBetModal.value = false;
    selectedLot.value = null;
    betAmount.value = null;
    betError.value = '';
    betSuccess.value = '';
};

// Make a bet
const makeBet = async () => {
    if (!selectedLot.value || !isAuthenticated.value) return;
    
    betError.value = '';
    betSuccess.value = '';
    
    if (isCurrentLotOwner.value) {
        betError.value = 'Ви не можете робити ставки на власні лоти.';
        return;
    }
    
    const currentPrice = parseFloat(selectedLot.value.current_price) || parseFloat(selectedLot.value.start_price);
    
    if (betAmount.value <= currentPrice) {
        betError.value = `Ставка має бути більшою за поточну ціну (${currentPrice} ₴).`;
        return;
    }
    
    try {
        isMakingBet.value = true;
        
        const response = await fetch('http://localhost:3000/offers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lot_id: selectedLot.value.id,
                offer_price: betAmount.value
            }),
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ 
                error: `Помилка створення ставки. Статус: ${response.status}.` 
            }));
            throw new Error(errorData.error || errorData.message || 'Помилка створення ставки');
        }
        
        const result = await response.json();
        
        // Update the lot in our local state
        if (result.updatedLotDetails) {
            const index = lots.value.findIndex(lot => lot.id === result.updatedLotDetails.id);
            if (index !== -1) {
                lots.value[index].current_price = result.updatedLotDetails.current_price;
                
                // Also update in activeLots
                const activeIndex = activeLots.value.findIndex(lot => lot.id === result.updatedLotDetails.id);
                if (activeIndex !== -1) {
                    activeLots.value[activeIndex].current_price = result.updatedLotDetails.current_price;
                }
            }
        }
        
        betSuccess.value = 'Ставку успішно зроблено!';
        
        // Close modal after a delay
        setTimeout(() => {
            closeBetModal();
        }, 2000);
    } catch (err) {
        console.error('Error making bet:', err);
        betError.value = err.message;
    } finally {
        isMakingBet.value = false;
    }
};

onMounted(() => {
    fetchAllLots();
});
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
                        <p>Початкова ціна: {{ lot.start_price }} ₴</p>
                        <p>Поточна ціна: {{ lot.current_price || lot.start_price }} ₴</p>
                        
                        <button 
                            class="bet-button" 
                            @click="openBetModal(lot)"
                            :disabled="!isAuthenticated || lot.user_id === userStore.userId">
                            {{ isAuthenticated ? 'Зробити ставку' : 'Увійдіть для ставки' }}
                        </button>
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
        
        <!-- Bet Modal -->
        <div v-if="showBetModal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Зробити ставку</h3>
                    <button class="close-button" @click="closeBetModal">&times;</button>
                </div>
                
                <div v-if="selectedLot" class="modal-body">
                    <h4>{{ selectedLot.title }}</h4>
                    <p>Поточна ціна: {{ selectedLot.current_price || selectedLot.start_price }} ₴</p>
                    
                    <div v-if="betError" class="error-message">{{ betError }}</div>
                    <div v-if="betSuccess" class="success-message">{{ betSuccess }}</div>
                    
                    <div class="form-group">
                        <label for="betAmount">Ваша ставка (₴):</label>
                        <input 
                            type="number" 
                            id="betAmount" 
                            v-model.number="betAmount" 
                            :min="(parseFloat(selectedLot.current_price) || parseFloat(selectedLot.start_price)) + 1"
                            step="1"
                            required
                        >
                    </div>
                    
                    <div class="modal-actions">
                        <button 
                            class="make-bet-button" 
                            @click="makeBet" 
                            :disabled="isMakingBet || isCurrentLotOwner">
                            {{ isMakingBet ? 'Створення ставки...' : 'Зробити ставку' }}
                        </button>
                        <button class="cancel-button" @click="closeBetModal">Скасувати</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import '@/styles/homePage.css';
</style>
