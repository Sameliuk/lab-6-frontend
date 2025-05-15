<template>
  <div>
    <main>
      <div class="container">
        <div v-if="isLoading" class="loading-message">
          <p>Завантаження даних лоту...</p>
        </div>

        <div v-else-if="error" class="error-message">
          <p>Виникла помилка: {{ error }}</p>
        </div>

        <div v-else-if="lotData && lotData.lot">
          <h1 class="lot-title">{{ lotData.lot.title }}</h1>
          <p class="lot-description">{{ lotData.lot.description }}</p>

          <div class="lot-info">
            <div>
              <p>
                <strong>Ставок:</strong>
                <span id="bidCount">{{ lotData.offerCount }}</span>
              </p>
              <p>
                <strong>Поточна ціна:</strong>
                <span class="price">
                  {{ formattedCurrentPrice }} грн
                </span>
              </p>
            </div>
            <div>
              <p>
                <strong>Дата початку:</strong> {{ formatDate(lotData.lot.start_time) }}
              </p>
              <p>
                <strong>Дата завершення:</strong> {{ formatDate(lotData.lot.end_time) }}
              </p>
            </div>
          </div>

          <div class="lot-image">
            <img
              :src="lotData.lot.image && lotData.lot.image.trim() !== '' ? lotData.lot.image : '/images/placeholder.jpg'"
              :alt="lotData.lot.title"
            />
            </div>

          <div class="lot-bid" v-if="lotData.lot.status && userStore.isLoggedIn">
            <p class="current-price">
              Поточна ціна: {{ formattedCurrentPrice }} грн
            </p>
            <div class="bid-controls">
              <button class="btn minus" @click="decrementBidAmount" :disabled="bidAmount <= minBidAmount">-</button>
              <input
                type="number"
                :min="minBidAmount"
                v-model.number="bidAmount"
              />
              <button class="btn plus" @click="incrementBidAmount">+</button>
            </div>
            <button
              class="btn bid-btn"
              @click="handlePlaceBid"
              :disabled="isPlacingBid || bidAmount <= currentLotPrice || !lotData.lot.status"
            >
              {{ isPlacingBid ? 'Обробка...' : 'Зробити ставку' }}
            </button>
            <p v-if="bidError" class="error-message" style="text-align: center; margin-top: 10px;">{{ bidError }}</p>
          </div>
          <div v-else-if="!lotData.lot.status && lotData.lot" class="lot-inactive-message"> <p>Цей лот неактивний або завершений. Ставки не приймаються.</p>
          </div>
          <div v-else-if="!userStore.isLoggedIn && lotData.lot && lotData.lot.status" class="lot-login-required-message"> <p><router-link :to="{ name: 'signIn', query: { redirect: route.fullPath } }">Увійдіть</router-link>, щоб зробити ставку.</p>
          </div>

        </div>
        <div v-else-if="!isLoading && !error">
          <p>Лот не знайдено або дані відсутні.</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const lotData = ref(null);
const isLoading = ref(true);
const error = ref(null);
const bidAmount = ref(0);
const isPlacingBid = ref(false);
const bidError = ref(null);

const apiBaseUrl = 'http://localhost:3000';

function formatDate(dateString) {
  if (!dateString) return 'Невідома дата';
  try {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch (e) {
    console.error("[LotView] Некоректний рядок дати для formatDate:", dateString, e);
    return 'Невірна дата';
  }
}

const currentLotPrice = computed(() => {
    if (lotData.value && lotData.value.lot) {
        const lot = lotData.value.lot;
        if (lot.current_price && !isNaN(parseFloat(lot.current_price))) {
            return parseFloat(lot.current_price);
        }
        if (lot.start_price && !isNaN(parseFloat(lot.start_price))) {
            return parseFloat(lot.start_price);
        }
    }
    return 0;
});

const formattedCurrentPrice = computed(() => {
    return currentLotPrice.value.toFixed(2);
});

const minBidAmount = computed(() => {
    if (currentLotPrice.value > 0) {
        return currentLotPrice.value + 1; // Мінімальний крок ставки - 1 грн
    }
    return 1; // Якщо ціна 0, мінімальна ставка 1 грн
});

async function fetchLotDetails() {
    const lotId = route.params.id;
    if (!lotId) {
        error.value = 'ID лоту не вказано в URL.';
        isLoading.value = false;
        console.error('[LotView] ID лоту відсутній в параметрах маршруту.');
        return;
    }

    isLoading.value = true;
    error.value = null;
    console.log(`[LotView] Запит деталей для лоту ID: ${lotId}`);
    try {
        const response = await fetch(`${apiBaseUrl}/lots/${lotId}`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) {
            let errorMsg = `Помилка ${response.status} при завантаженні даних лоту.`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorData.message || errorMsg;
            } catch (e) { /* Залишаємо errorMsg як є, якщо відповідь не JSON */ }
            throw new Error(errorMsg);
        }
        const dataFromServer = await response.json();
        if (dataFromServer && dataFromServer.lot) { // Перевіряємо, чи є об'єкт lot
            lotData.value = dataFromServer;
            if (dataFromServer.lot) { // Встановлюємо початкову суму ставки
                bidAmount.value = minBidAmount.value;
            }
            console.log('[LotView] Дані лоту успішно завантажено:', lotData.value);
        } else {
            console.error('[LotView] Отримані дані не містять очікуваного об\'єкта "lot":', dataFromServer);
            throw new Error('Некоректний формат даних лоту від сервера.');
        }
    } catch (err) {
        console.error('[LotView] Помилка при завантаженні деталей лоту:', err);
        error.value = err.message;
        lotData.value = null; // Очищаємо дані лоту у разі помилки
    } finally {
        isLoading.value = false;
    }
}

function incrementBidAmount() {
    bidAmount.value += 1;
}

function decrementBidAmount() {
    if (bidAmount.value > minBidAmount.value) {
        bidAmount.value -= 1;
    } else {
      bidAmount.value = minBidAmount.value;
    }
}

async function handlePlaceBid() {
    if (!userStore.isLoggedIn) { // Використовуємо getter isLoggedIn
        bidError.value = "Будь ласка, увійдіть, щоб зробити ставку.";
        router.push({ name: 'signIn', query: { redirect: route.fullPath } });
        return;
    }
    if (!lotData.value || !lotData.value.lot || !lotData.value.lot.status) {
        bidError.value = "Неможливо зробити ставку: лот неактивний або дані відсутні.";
        return;
    }

    if (bidAmount.value <= currentLotPrice.value) {
        bidError.value = `Ваша ставка має бути більшою за поточну ціну (${formattedCurrentPrice.value} грн).`;
        return;
    }

    isPlacingBid.value = true;
    bidError.value = null;
    const lotId = lotData.value.lot.id;

    console.log(`[LotView] Спроба зробити ставку: ${bidAmount.value} для лоту ID: ${lotId}, користувач ID: ${userStore.currentUserId}`);

    try {
        const response = await fetch(`${apiBaseUrl}/offers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lot_id: lotId,
                user_id: userStore.currentUserId,
                offer_price: bidAmount.value,
            }),
            credentials: 'include'
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.error || responseData.message || `Помилка ${response.status} при створенні ставки.`);
        }

        console.log('[LotView] Ставку успішно зроблено:', responseData);
        alert('Вашу ставку успішно прийнято!');
        await fetchLotDetails(); // Оновлюємо дані лоту
        // bidAmount.value = minBidAmount.value; // Оновлюємо поле вводу ставки до нового мінімуму

    } catch (err) {
        console.error('[LotView] Помилка під час створення ставки:', err);
        bidError.value = err.message;
    } finally {
        isPlacingBid.value = false;
    }
}

onMounted(() => {
    console.log('[LotView] Компонент змонтовано. Параметри маршруту:', route.params);
    fetchLotDetails();
});
</script>

<style scoped>
.container {
    max-width: 900px;
    margin: 20px auto;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fffefc; 
    padding: 15px 30px;
    border-bottom: 1px solid #e0e0e0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}

header .logo {
    text-decoration: none;
    color: navy;
    font-size: 2rem; 
    font-weight: bold;
}
header .logo:hover {
    color: #0000b3;
}

header .search-bar {
    display: flex;
    flex-grow: 0.4; 
    max-width: 400px; 
}
header .search-bar input[type="search"] {
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px 0 0 4px;
    border-right: none;
    font-size: 1rem;
    width: 100%;
    box-sizing: border-box;
}
header .search-bar input[type="search"]:focus {
    outline: none;
    border-color: rgb(120, 120, 233);
    box-shadow: 0 0 0 2px rgba(120, 120, 233, 0.2);
}
header .search-bar button {
    padding: 8px 15px;
    background-color: navy;
    color: white;
    border: 1px solid navy;
    border-radius: 0 4px 4px 0;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s ease;
}
header .search-bar button:hover {
    background-color: #0000b3;
}

header .profile {
    display: flex;
    align-items: center;
}
header .profile a, header .profile button {
    text-decoration: none;
    font-weight: bold;
    margin-left: 20px;
    color: navy;
    padding: 8px 12px;
    border-radius: 4px;
    transition: background-color 0.2s ease, color 0.2s ease;
    font-size: 0.95rem;
    white-space: nowrap; 
}
header .profile a:hover {
    background-color: #f0f0f0;
    color: #000080;
}
header .profile button {
    background-color: transparent;
    border: 1px solid navy;
    cursor: pointer;
}
header .profile button:hover {
    background-color: navy;
    color: white;
}


.loading-message, .lot-inactive-message, .lot-login-required-message {
    text-align: center;
    padding: 30px 20px;
    font-size: 1.2em;
    color: #555;
}
.error-message { 
    text-align: center;
    padding: 15px;
    font-size: 1.1em;
    color: #721c24; 
    background-color: #f8d7da; 
    border: 1px solid #f5c6cb; 
    border-radius: 5px;
    margin: 15px 0;
}


.lot-title {
    font-size: 2.2rem; 
    color: navy;
    margin-top: 0; 
    margin-bottom: 15px;
    text-align: center;
    font-weight: bold;
}

.lot-description {
    font-size: 1.1rem;
    color: #495057; 
    line-height: 1.7; 
    text-align: left; 
}

.lot-info {
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
    gap: 20px; 
    background-color: #f8f9fa;
    padding: 20px;
    border-radius: 8px; 
    margin-bottom: 30px;
    font-size: 1rem;
    border: 1px solid #e9ecef;
}
.lot-info p {
    margin: 8px 0; 
    color: #343a40;
}
.lot-info strong {
    color: navy;
    margin-right: 8px;
}
.lot-info .price {
    font-weight: bold;
    color: #28a745; 
    font-size: 1.1em;
}

.lot-image {
    text-align: center;
    margin-bottom: 30px;
    background-color: #f8f9fa;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}
.lot-image img {
    max-width: 100%;
    max-height: 500px; 
    border-radius: 6px; 
    object-fit: contain; 
}

.lot-bid {
    background-color: #e9ecef;
    padding: 25px;
    border-radius: 8px;
    text-align: center;
    margin-top: 30px; 
}
.lot-bid .current-price {
    font-size: 1.6rem;
    font-weight: bold;
    color: navy;
    margin-bottom: 20px;
}
.bid-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 25px;
    gap: 10px; 
}
.bid-controls input[type="number"] {
    width: 140px; 
    padding: 12px; 
    text-align: center;
    font-size: 1.25rem;
    border: 1px solid #ced4da;
    border-radius: 5px;
    -moz-appearance: textfield;
}
.bid-controls input[type="number"]::-webkit-outer-spin-button,
.bid-controls input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
.bid-controls .btn { 
    padding: 12px 18px;
    font-size: 1.25rem;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    min-width: 45px;
    line-height: 1;
    transition: background-color 0.2s ease;
}
.bid-controls .btn:hover {
    background-color: #5a6268;
}
.bid-btn { 
    background-color: #007bff;
    color: white;
    padding: 12px 35px; 
    font-size: 1.2rem;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    text-transform: uppercase; 
    font-weight: bold;
}
.bid-btn:hover {
    background-color: #0056b3;
}
.bid-btn:disabled {
    background-color: #adb5bd; 
    cursor: not-allowed;
}

</style>