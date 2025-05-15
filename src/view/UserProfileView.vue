// src/view/UserProfileView.vue
<template>
  <div class="user-profile-page">
    <div class="container">
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <h2 class="title">Мої лоти</h2>
      <div id="lots-container">
        <div v-if="isLoadingLots" class="loading-placeholder">
          <p>Завантаження ваших лотів...</p>
        </div>
        <div v-else-if="lots && lots.length > 0">
          <div v-for="lot in lots" :key="lot.id" class="lot">
            <h3>{{ lot.title }}</h3>
            <img v-if="lot.image" :src="lot.image" :alt="lot.title" class="lot-image-preview">
            <p class="desc">{{ lot.description }}</p>
            <br>
            <p><strong>Початкова ціна:</strong> {{ lot.start_price }} ₴</p>
            <p><strong>Поточна ціна:</strong> {{ lot.current_price }} ₴</p>
            <br>
            <p><strong>Дата початку:</strong> {{ formatDate(lot.start_time) }}</p>
            <p><strong>Дата завершення:</strong> {{ formatDate(lot.end_time) }}</p>
            <br>
            <p class="status-paragraph"><strong>Статус:</strong>
              <select class="status-select" v-model="lot.status" @change="updateLotStatus(lot)">
                <option :value="true">Активний</option>
                <option :value="false">Неактивний</option>
              </select>
              <span class="status-indicator" :class="{ active: lot.status, inactive: !lot.status }"></span>
            </p>
            <div class="lot-actions">
              <button class="edit-lot-button" :disabled="lot.status" @click="editLot(lot)">Редагувати</button>
              <button class="delete-lot-button" @click="deleteLot(lot.id)">Видалити</button>
            </div>
          </div>
        </div>
        <div v-else>
          <p>У вас ще немає створених лотів. Час створити перший!</p>
        </div>
      </div>

      <div class="create-lot-section">
        <h2>Створити новий лот</h2>
        <form @submit.prevent="handleCreateLot">
          <div class="form-group">
            <label for="newLotTitle">Назва лоту:</label>
            <input type="text" id="newLotTitle" v-model="newLot.title" required>
          </div>
          <div class="form-group">
            <label for="newLotDescription">Опис:</label>
            <textarea id="newLotDescription" v-model="newLot.description" required></textarea>
          </div>
          <div class="form-group">
            <label for="newLotStartPrice">Початкова ціна (₴):</label>
            <input type="number" id="newLotStartPrice" v-model.number="newLot.startPrice" min="1" required>
          </div>
          <div class="form-group">
            <label for="newLotStartTime">Дата початку:</label>
            <input type="date" id="newLotStartTime" v-model="newLot.startTime" :min="getTodayDate()" required>
          </div>
          <div class="form-group">
            <label for="newLotEndTime">Дата завершення:</label>
            <input type="date" id="newLotEndTime" v-model="newLot.endTime" :min="newLot.startTime || getTodayDate()" required>
          </div>
          <div class="form-group">
            <label for="newLotStatus">Статус:</label>
            <select id="newLotStatus" v-model="newLot.status">
              <option value="true">Активний</option>
              <option value="false">Неактивний</option>
            </select>
          </div>
          <div class="form-group">
            <label for="newLotImage">URL зображення (необов'язково):</label>
            <input type="text" id="newLotImage" v-model="newLot.image" placeholder="https://example.com/image.jpg">
          </div>
          <button type="submit" class="button create-button" :disabled="isCreatingLot">
            {{ isCreatingLot ? 'Створення...' : 'Створити лот' }}
          </button>
          <div v-if="createLotError" class="error-message form-error">{{ createLotError }}</div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
// import { useRouter } from 'vue-router'; // Розкоментуйте, якщо потрібен router

const userStore = useUserStore();
// const router = useRouter(); // Розкоментуйте, якщо потрібен router

const lots = ref([]);
const error = ref(null);
const isLoadingLots = ref(true);
const isCreatingLot = ref(false);
const createLotError = ref(null);

const newLot = ref({
  title: '',
  description: '',
  startPrice: null,
  startTime: getTodayDate(),
  endTime: getTomorrowDate(),
  status: 'true', // Залишаємо як рядок для узгодженості з <option value="true">
  image: ''
});

function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

const apiBaseUrl = 'http://localhost:3000';

async function fetchUserLots() {
  isLoadingLots.value = true;
  error.value = null;
  if (!userStore.userId) {
    error.value = 'Будь ласка, увійдіть, щоб переглянути ваші лоти.';
    isLoadingLots.value = false;
    return;
  }
  try {
    const response = await fetch(`${apiBaseUrl}/lots/user/${userStore.userId}`, {
        method: 'GET',
        credentials: 'include'
    });
    if (!response.ok) {
      let errorMessage = `Помилка ${response.status} при завантаженні лотів`;
      try { const errorData = await response.json(); errorMessage = errorData.message || errorData.error || errorMessage; } catch (e) { /* ігнор */ }
      throw new Error(errorMessage);
    }
    const fetchedData = await response.json();
    if (Array.isArray(fetchedData)) {
        lots.value = fetchedData.map(lot => ({
        ...lot,
        status: typeof lot.status === 'string' ? lot.status.toLowerCase() === 'true' : Boolean(lot.status)
        })).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (fetchedData && typeof fetchedData === 'object' && Array.isArray(fetchedData.data)) {
        lots.value = fetchedData.data.map(lot => ({
        ...lot,
        status: typeof lot.status === 'string' ? lot.status.toLowerCase() === 'true' : Boolean(lot.status)
        })).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else {
        throw new Error('Некоректний формат даних лотів від сервера.');
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoadingLots.value = false;
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try { return new Date(dateString).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch (e) { console.error("Invalid date string:", dateString, e); return 'Невірна дата'; }
}

async function updateLotStatus(lotToUpdate) {
  error.value = null;
  const newStatusForBackend = lotToUpdate.status;
  const originalStatusVisual = !lotToUpdate.status;
  try {
    const response = await fetch(`${apiBaseUrl}/lots/${lotToUpdate.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newStatus: String(newStatusForBackend) }),
      credentials: 'include'
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Помилка оновлення статусу' }));
      throw new Error(errorData.message || 'Помилка оновлення статусу');
    }
  } catch (err) {
    error.value = err.message;
    alert(`Помилка оновлення статусу: ${err.message}`);
    const lotInArray = lots.value.find(l => l.id === lotToUpdate.id);
    if (lotInArray) lotInArray.status = originalStatusVisual;
  }
}

async function deleteLot(lotId) {
  if (confirm('Ви впевнені, що хочете видалити цей лот?')) {
    error.value = null;
    try {
      const response = await fetch(`${apiBaseUrl}/lots/${lotId}`, { method: 'DELETE', credentials: 'include' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Помилка видалення лоту' }));
        throw new Error(errorData.message || 'Помилка видалення лоту');
      }
      lots.value = lots.value.filter(lot => lot.id !== lotId);
    } catch (err) {
      error.value = err.message;
      alert(`Помилка видалення лоту: ${err.message}`);
    }
  }
}

async function handleCreateLot() {
  createLotError.value = null;
  error.value = null;

  if (!userStore.userId) {
    createLotError.value = "Необхідно авторизуватися для створення лоту.";
    alert(createLotError.value);
    return;
  }
  if (!newLot.value.title.trim()) {
    createLotError.value = 'Назва лоту є обов\'язковою.'; alert(createLotError.value); return;
  }
  if (!newLot.value.description.trim()) {
    createLotError.value = 'Опис лоту є обов\'язковим.'; alert(createLotError.value); return;
  }
  if (newLot.value.startPrice === null || isNaN(parseFloat(newLot.value.startPrice)) || parseFloat(newLot.value.startPrice) <= 0) {
    createLotError.value = 'Початкова ціна має бути числом більшим за нуль.'; alert(createLotError.value); return;
  }
  if (!newLot.value.startTime) {
    createLotError.value = 'Дата початку є обов\'язковою.'; alert(createLotError.value); return;
  }
  if (!newLot.value.endTime) {
    createLotError.value = 'Дата завершення є обов\'язковою.'; alert(createLotError.value); return;
  }
  if (new Date(newLot.value.endTime) <= new Date(newLot.value.startTime)) {
    createLotError.value = 'Дата завершення має бути пізнішою за дату початку.'; alert(createLotError.value); return;
  }

  isCreatingLot.value = true;

  const payload = {
    userId: userStore.userId, // Це поле використовується бекендом для визначення user_id
    title: newLot.value.title.trim(),
    description: newLot.value.description.trim(),
    // --- ЗМІНЮЄМО НАЗВИ ПОЛІВ НА CAMELCASE, щоб відповідати деструктуризації в контролері ---
    startPrice: parseFloat(newLot.value.startPrice),   // Було start_price
    // current_price: parseFloat(newLot.value.startPrice), // Бекенд сам встановить current_price = startPrice
    status: newLot.value.status, // Це буде рядок "true" або "false"
    startTime: newLot.value.startTime,    // Було start_time
    endTime: newLot.value.endTime,      // Було end_time
    image: newLot.value.image ? newLot.value.image.trim() : null
  };
  // Поле current_price зазвичай встановлюється на бекенді рівним startPrice при створенні,
  // тому його можна не надсилати з фронтенду, якщо бекенд це робить.
  // Якщо бекенд очікує current_price, то:
  // payload.currentPrice = parseFloat(newLot.value.startPrice);

  console.log("[UserProfileView] Дані для створення лоту (payload, оновлено для бекенду):", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(`${apiBaseUrl}/lots/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Помилка ${response.status}. Не вдалося розпарсити відповідь сервера.` }));
      throw new Error(errorData.message || errorData.error || `Помилка створення лоту (статус ${response.status})`);
    }

    const createdLot = await response.json();
    lots.value.unshift({
      ...createdLot,
      status: typeof createdLot.status === 'string' ? createdLot.status.toLowerCase() === 'true' : Boolean(createdLot.status)
    });
    newLot.value = { title: '', description: '', startPrice: null, startTime: getTodayDate(), endTime: getTomorrowDate(), status: 'true', image: '' };
  } catch (err) {
    console.error('[UserProfileView] Помилка створення лоту (в catch блоці):', err);
    createLotError.value = err.message;
  } finally {
    isCreatingLot.value = false;
  }
}

function editLot(lot) {
  alert(`Редагування лоту: ${lot.title} (ID: ${lot.id}) - функціонал ще не реалізовано`);
}

onMounted(() => {
  if (userStore.userId) {
    fetchUserLots();
  } else {
    error.value = 'Будь ласка, увійдіть, щоб переглянути ваші лоти.';
    isLoadingLots.value = false;
  }
});
</script>

<style scoped>
/* Ваші стилі залишаються тут */
.user-profile-page {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
}

.container {
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px;
  background-color: #fdfdfd;
  border-radius: 8px;
}

.loading-placeholder p {
    text-align: center;
    font-size: 1.2em;
    color: #666;
    padding: 30px;
}

.error-message {
  color: #d8000c;
  background-color: #ffdddd;
  border: 1px solid #d8000c;
  padding: 10px 15px;
  margin-bottom: 20px;
  border-radius: 5px;
  text-align: center;
}
.error-message.form-error {
  margin-top: 15px;
  text-align: left;
}

.title {
  font-size: 2rem;
  margin-bottom: 25px;
  color: navy;
  font-weight: 600;
  text-align: center;
  padding-bottom: 10px;
  border-bottom: 2px solid navy;
  display: inline-block;
  position: relative;
  left: 50%;
  transform: translateX(-50%);
}

#lots-container {
  margin-bottom: 40px;
}

#lots-container .lot {
  border: 1px solid #e0e0e0;
  padding: 20px;
  margin-bottom: 25px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  transition: box-shadow 0.3s ease;
}
#lots-container .lot:hover {
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}


.lot img.lot-image-preview {
  max-width: 100%;
  height: auto;
  max-height: 250px;
  object-fit: contain;
  border-radius: 4px;
  margin-bottom: 15px;
  display: block;
  margin-left: auto;
  margin-right: auto;
  border: 1px solid #eee;
}

.lot h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.75rem;
  color: #004a99;
  font-weight: 600;
}

.lot p {
  margin-bottom: .6rem;
  line-height: 1.65;
  color: #454545;
}
.lot p strong {
  color: navy;
  font-weight: 600;
}

.lot .desc {
  color: #555;
  margin-bottom: 1rem;
}

.status-paragraph {
  display: flex;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 10px;
}

.status-select {
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.95rem;
  margin-left: 8px;
  border: 1px solid #ced4da;
  background-color: #fff;
  color: #495057;
  cursor: pointer;
}

.status-indicator {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin-left: 12px;
  vertical-align: middle;
}

.status-indicator.active {
  background-color: #28a745;
  box-shadow: 0 0 5px #28a745;
}

.status-indicator.inactive {
  background-color: #dc3545;
  box-shadow: 0 0 5px #dc3545;
}

.lot-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

.lot-actions button {
  padding: 10px 18px;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 5px;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease, transform 0.1s ease;
}
.lot-actions button:active {
  transform: scale(0.97);
}

.edit-lot-button {
  background-color: #ffc107;
  color: #212529;
}
.edit-lot-button:hover:not(:disabled) {
  background-color: #e0a800;
}
.edit-lot-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #6c757d;
}

.delete-lot-button {
  background-color: #dc3545;
  color: white;
}
.delete-lot-button:hover {
  background-color: #c82333;
}

.create-lot-section {
  margin-top: 40px;
  padding: 30px;
  border: 1px solid #d1d9e6;
  border-radius: 10px;
  background-color: #f8f9fc;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
}

.create-lot-section h2 {
  margin-top: 0;
  margin-bottom: 25px;
  text-align: center;
  color: navy;
  font-size: 1.8rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: .6rem;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.form-group input[type='text'],
.form-group input[type='number'],
.form-group input[type='date'],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  color: #495057;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-group textarea {
    min-height: 100px;
    resize: vertical;
}


.button.create-button {
  color: #fff;
  background-color: #0069d9;
  border-color: #0062cc;
  padding: 12px 20px;
  font-size: 1.1rem;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.2s ease;
}
.button.create-button:hover:not(:disabled) {
  background-color: #005cbf;
  border-color: #0056b3;
}

.button.create-button:disabled {
  background-color: #5a6268;
  border-color: #545b62;
  cursor: not-allowed;
  opacity: 0.65;
}
</style>