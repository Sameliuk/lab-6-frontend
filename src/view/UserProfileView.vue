<template>
  <div class="user-profile-page">
    <div class="container">
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <h2 class="title">Мої лоти</h2>
      <div id="lots-container">
        <div v-if="isLoadingLots">
          <p>Завантаження лотів...</p>
        </div>
        <div v-else-if="lots && lots.length > 0">
          <div v-for="lot in lots" :key="lot.id" class="lot">
            <h3>{{ lot.title }}</h3>
            <p class="desc">{{ lot.description }}</p>
            <br>
            <p>Початкова ціна: {{ lot.start_price }} ₴</p>
            <p>Поточна ціна: {{ lot.current_price }} ₴</p>
            <br>
            <p>Дата початку: {{ formatDate(lot.start_time) }}</p>
            <p>Дата завершення: {{ formatDate(lot.end_time) }}</p>
            <br>
            <p>Статус:
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
          <p>У вас ще немає створених лотів.</p>
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
            <label for="newLotStartPrice">Початкова ціна:</label>
            <input type="number" id="newLotStartPrice" v-model.number="newLot.startPrice" min="1" required>
          </div>
          <div class="form-group">
            <label for="newLotStartTime">Дата початку:</label>
            <input type="date" id="newLotStartTime" v-model="newLot.startTime" required>
          </div>
          <div class="form-group">
            <label for="newLotEndTime">Дата завершення:</label>
            <input type="date" id="newLotEndTime" v-model="newLot.endTime" required>
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
            <input type="text" id="newLotImage" v-model="newLot.image">
          </div>
          <button type="submit" class="button" :disabled="isCreatingLot">
            {{ isCreatingLot ? 'Створення...' : 'Створити лот' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();

const lots = ref([]);
const error = ref(null); 
const isLoadingLots = ref(true);
const isCreatingLot = ref(false);

const newLot = ref({
  title: '',
  description: '',
  startPrice: null, 
  startTime: getTodayDate(),
  endTime: getTomorrowDate(),
  status: true, 
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
  console.log('[UserProfileView] Спроба завантажити лоти, userStore.userId:', userStore.userId);
  if (!userStore.userId) {
    console.warn("[UserProfileView] UserID зі стору не доступний для завантаження лотів.");
    error.value = 'Будь ласка, увійдіть, щоб переглянути ваші лоти.';
    isLoadingLots.value = false;
    return;
  }
  try {
    const response = await fetch(`${apiBaseUrl}/lots`, { 
        method: 'GET',
        credentials: 'include' 
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Помилка ${response.status} при завантаженні лотів (сервер не повернув JSON)` }));
      throw new Error(errorData.message || `Помилка ${response.status} при завантаженні лотів`);
    }
    const fetchedObject = await response.json();

    console.log('[UserProfileView] Відповідь від /lots (об\'єкт з бекенду):', fetchedObject);

    if (fetchedObject && typeof fetchedObject === 'object' && Array.isArray(fetchedObject.data)) {
      lots.value = fetchedObject.data.map(lot => ({
        ...lot,
        status: typeof lot.status === 'string' ? lot.status.toLowerCase() === 'true' : Boolean(lot.status)
      }));
      console.log('[UserProfileView] Лоти успішно завантажені та оброблені:', lots.value);
    } else {
      console.error('[UserProfileView] Отримана відповідь не містить очікуваного масиву лотів у властивості "data":', fetchedObject);
      throw new Error('Некоректний формат даних лотів від сервера.');
    }
  } catch (err) {
    console.error('[UserProfileView] Помилка завантаження лотів (в catch блоці):', err);
    error.value = err.message;
  } finally {
    isLoadingLots.value = false;
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch (e) {
    console.error("[UserProfileView] Некоректний рядок дати для formatDate:", dateString, e);
    return 'Невірна дата';
  }
}

async function updateLotStatus(lotToUpdate) {
  error.value = null;
  const newStatusForBackend = lotToUpdate.status; 

  console.log(`[UserProfileView] Спроба оновити статус для лоту ID ${lotToUpdate.id} на: ${newStatusForBackend}`);
  try {
    const response = await fetch(`${apiBaseUrl}/lots/${lotToUpdate.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newStatus: String(newStatusForBackend) }), 
      credentials: 'include' 
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Помилка оновлення статусу (сервер не повернув JSON)' }));
      throw new Error(errorData.message || 'Помилка оновлення статусу');
    }
    console.log(`[UserProfileView] Статус для лоту ID ${lotToUpdate.id} успішно оновлено на бекенді.`);

  } catch (err) {
    console.error('[UserProfileView] Помилка оновлення статусу:', err);
    error.value = err.message;
    alert(`Помилка оновлення статусу: ${err.message}`);

    const lotInArray = lots.value.find(l => l.id === lotToUpdate.id);
    if (lotInArray) {
      lotInArray.status = !newStatusForBackend; 
    }
  }
}

async function deleteLot(lotId) {
  if (confirm('Ви впевнені, що хочете видалити цей лот?')) {
    error.value = null;
    console.log(`[UserProfileView] Спроба видалити лот ID ${lotId}`);
    try {
      const response = await fetch(`${apiBaseUrl}/lots/${lotId}`, {
        method: 'DELETE',
        credentials: 'include' 
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Помилка видалення лоту (сервер не повернув JSON)' }));
        throw new Error(errorData.message || 'Помилка видалення лоту');
      }
      lots.value = lots.value.filter(lot => lot.id !== lotId);
      console.log(`[UserProfileView] Лот ID ${lotId} успішно видалено.`);
    } catch (err) {
      console.error('[UserProfileView] Помилка видалення лоту:', err);
      error.value = err.message;
      alert(`Помилка видалення лоту: ${err.message}`);
    }
  }
}

async function handleCreateLot() {
  console.log('[UserProfileView] Спроба створити новий лот. Поточний userStore.userId:', userStore.userId);
  if (!userStore.userId) {
    error.value = "Необхідно авторизуватися для створення лоту.";
    alert(error.value);
    return;
  }

  if (!newLot.value.title.trim()) {
    alert('Назва лоту є обов\'язковою.'); return;
  }
  if (!newLot.value.description.trim()) {
    alert('Опис лоту є обов\'язковим.'); return;
  }
  if (newLot.value.startPrice === null || isNaN(parseFloat(newLot.value.startPrice)) || parseFloat(newLot.value.startPrice) <= 0) {
    alert('Початкова ціна має бути числом більшим за нуль.'); return;
  }
  if (!newLot.value.startTime) {
    alert('Дата початку є обов\'язковою.'); return;
  }
  if (!newLot.value.endTime) {
    alert('Дата завершення є обов\'язковою.'); return;
  }
  if (new Date(newLot.value.endTime) <= new Date(newLot.value.startTime)) {
    alert('Дата завершення має бути пізнішою за дату початку.'); return;
  }

  isCreatingLot.value = true;
  error.value = null;

  const payload = {
    userId: userStore.userId,
    title: newLot.value.title.trim(),
    description: newLot.value.description.trim(),
    startPrice: parseFloat(newLot.value.startPrice),    
    currentPrice: parseFloat(newLot.value.startPrice),  
    status: newLot.value.status, 
    startTime: newLot.value.startTime,                   
    endTime: newLot.value.endTime,                     
    image: newLot.value.image || null
  };

  console.log("[UserProfileView] Дані для створення лоту (payload):", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(`${apiBaseUrl}/lots/create`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include' 
    });

    if (!response.ok) { 
      const errorData = await response.json().catch(() => ({ 
        error: `Помилка створення лоту. Статус: ${response.status}. Сервер не повернув JSON.` 
      }));

      throw new Error(errorData.message || errorData.error || `Невідома помилка створення лоту (статус ${response.status})`);
    }

    const createdLot = await response.json(); 
    console.log("[UserProfileView] Лот успішно створено на бекенді:", createdLot);

    lots.value.unshift({
        ...createdLot,
        status: typeof createdLot.status === 'string' ? createdLot.status.toLowerCase() === 'true' : Boolean(createdLot.status)
    });

    newLot.value = {
      title: '',
      description: '',
      startPrice: null,
      startTime: getTodayDate(),
      endTime: getTomorrowDate(),
      status: true,
      image: ''
    };
  } catch (err) {
    console.error('[UserProfileView] Помилка створення лоту (в catch блоці):', err);
    error.value = err.message; 
    alert(`Помилка створення лоту: ${err.message}`); 
  } finally {
    isCreatingLot.value = false;
  }
}

function editLot(lot) {
  alert(`Редагування лоту: ${lot.title} (ID: ${lot.id}) - функціонал ще не реалізовано`);

}

onMounted(() => {
  console.log('[UserProfileView] Компонент змонтовано, поточний userStore.userId:', userStore.userId);
  if (userStore.userId) {
    fetchUserLots();
  } else {
    console.warn('[UserProfileView] Користувач не авторизований при завантаженні профілю. Лоти не завантажено.');
    error.value = 'Будь ласка, увійдіть, щоб переглянути ваші лоти.';
    isLoadingLots.value = false; 
  }
});
</script>

<style scoped>

body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #fffefc;
    color: navy; 
}

.container {
    max-width: 1000px; 
    margin: 20px auto; 
    padding: 20px;
}

.create-lot-section {
    background: #f8f9fa; 
    border: 1px solid #dee2e6; 
    padding: 25px;
    border-radius: 10px;
    margin: 30px 0;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08); 
}

#lots-container {
    display: flex;
    flex-wrap: wrap;
    
    
    
}

.lot {
    background-color: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 20px;
    min-width: 1000px;
    margin: 10px 0; 
    width: calc(33.333% - 20px); 
    
    box-sizing: border-box;
    
    display: flex;
    flex-direction: column;
    transition: 0.35s;
}

.title {
    font-size: 28px; 
    margin-bottom: 25px; 
    color: navy;
    font-weight: bold;
    text-align: center;
}

.lot:hover {
    transform: translateY(-5px); 
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); 
}

.lot .lot-image-container { 
    width: 100%;
    
    overflow: hidden;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.lot .lot-image-container img {
    max-width: 100%;
    max-height: 180px; 
    object-fit: cover; 
    border-radius: 4px;
}

.lot h3 {
    font-size: 1.25rem; 
    color: #343a40; 
    margin-top: 0;
    margin-bottom: 10px;
}

.lot p {
    font-size: 0.95rem; 
    margin-bottom: 8px; 
    color: #5a6268; 
    line-height: 1.5;
    word-wrap: break-word;
    flex-grow: 1; 
}

.lot p.desc { 
    color: #495057;
}

.status-select {
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 0.9rem; 
    margin-right: 10px;
    border: 1px solid #ced4da;
    background-color: #fff;
    color: #495057;
}

.status-indicator {
    
    display: inline-block; 
    width: 12px;
    height: 12px;
    border-radius: 50%; 
    vertical-align: middle; 
    
}

.status-indicator.active {
    background-color: #28a745; 
}

.status-indicator.inactive {
    background-color: #dc3545; 
}

.lot-actions {
    display: flex;
    gap: 10px; 
    margin-top: 15px; 
}

.lot-actions button { 
    padding: 8px 12px;
    font-size: 0.9rem;
    border-radius: 4px;
    cursor: pointer;
    border: none;
    transition: background-color 0.2s ease, transform 0.1s ease;
}
.lot-actions button:active {
    transform: scale(0.98); 
}

.edit-lot-button {
    background-color: #28a745; 
    color: white;
}
.edit-lot-button:hover {
    background-color: #218838;
}
.edit-lot-button:disabled,
.edit-lot-button.disabled-button { 
    opacity: 0.65;
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

.form-group {
    margin-bottom: 1.25rem; 
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem; 
    font-weight: 600;
    color: #343a40; 
}

.form-group input[type='text'],
.form-group input[type='number'],
.form-group input[type='date'],
.form-group textarea,
.form-group select {
    width: 100%; 
    padding: 10px 12px;
    border: 1px solid #ced4da; 
    border-radius: 5px;
    font-size: 1rem; 
    color: #495057; 
    box-sizing: border-box; 
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input[type='text']:focus,
.form-group input[type='number']:focus,
.form-group input[type='date']:focus,
.form-group textarea:focus,
.form-group select:focus {
    outline: none;
    border-color: rgb(100, 100, 220); 
    box-shadow: 0 0 0 3px rgba(100, 100, 220, 0.25); 
}

.create-lot-section button[type="submit"] { 
    background-color: rgb(80, 80, 200); 
    color: white;
    padding: 12px 25px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s ease;
    width: 100%; 
}

.create-lot-section button[type="submit"]:hover {
    background-color: #4a4ccc; 
}

.create-lot-section button[type="submit"]:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
}

header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #ffffff; 
    padding: 15px 30px; 
    border-bottom: 1px solid #dee2e6; 
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}

a.logo {
    text-decoration: none;
    color: navy;
    display: inline-block;
}

a.logo:hover {
    color: #0000b3;
}

.logo {
    
    font-size: 2rem; 
    font-weight: bold;
}

.profile a { 
    text-decoration: none;
    font-weight: bold;
    margin-left: 15px; 
    color: navy;
    padding: 8px 12px;
    border-radius: 4px;
    transition: background-color 0.2s ease, color 0.2s ease;
}
.profile a:hover {
    background-color: #f0f0f0;
    color: #000080;
}
.profile button { 
    margin-left: 15px;
    background-color: transparent;
    color: navy;
    border: 1px solid navy;
    
}
.profile button:hover {
    background-color: navy;
    color: white;
}

.modal {
    display: none; 
    position: fixed;
    z-index: 1050; 
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6); 
    overflow-y: auto; 
    display: flex; 
    align-items: center;
    justify-content: center;
}

.modal-content {
    background-color: white;
    padding: 25px 30px;
    border-radius: 8px;
    width: auto; 
    min-width: 300px; 
    max-width: 600px; 
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    position: relative; 
    
    
}

.close-modal {
    position: absolute; 
    top: 10px;
    right: 15px;
    font-size: 1.8rem; 
    font-weight: bold;
    color: #aaa; 
    cursor: pointer;
    line-height: 1;
}

.close-modal:hover,
.close-modal:focus {
    color: #333; 
    text-decoration: none;
}

body.modal-open { 
    overflow: hidden;
}

</style>