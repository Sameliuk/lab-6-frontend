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

const apiBaseUrl = ''; 

async function fetchUserLots() {
  isLoadingLots.value = true;
  error.value = null;
  if (!userStore.userId) {

    console.warn("UserID from store is not available for fetching lots.");
    error.value = 'Будь ласка, увійдіть, щоб переглянути ваші лоти.';
    isLoadingLots.value = false;

    return;
  }
  try {

    const response = await fetch(`${apiBaseUrl}/lots`); 
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Помилка ${response.status} при завантаженні лотів` }));
      throw new Error(errorData.message || `Помилка ${response.status} при завантаженні лотів`);
    }
    const fetchedLots = await response.json();
    lots.value = fetchedLots.map(lot => ({
      ...lot,
      status: typeof lot.status === 'string' ? lot.status.toLowerCase() === 'true' : Boolean(lot.status)
    }));
  } catch (err) {
    console.error('Помилка завантаження лотів:', err);
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
    console.error("Invalid date string:", dateString, e);
    return 'Невірна дата';
  }
}

async function updateLotStatus(lotToUpdate) {
  error.value = null;
  const originalStatus = !lotToUpdate.status; 

  try {
    const response = await fetch(`${apiBaseUrl}/lots/${lotToUpdate.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newStatus: String(lotToUpdate.status) }) 
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Помилка оновлення статусу' }));
      throw new Error(errorData.message || 'Помилка оновлення статусу');
    }

  } catch (err) {
    console.error('Помилка оновлення статусу:', err);
    error.value = err.message;
    alert(err.message);
    const lotInArray = lots.value.find(l => l.id === lotToUpdate.id);
    if (lotInArray) {
      lotInArray.status = originalStatus; 
    }
  }
}

async function deleteLot(lotId) {
  if (confirm('Ви впевнені, що хочете видалити цей лот?')) {
    error.value = null;
    try {
      const response = await fetch(`${apiBaseUrl}/lots/${lotId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Помилка видалення лоту' }));
        throw new Error(errorData.message || 'Помилка видалення лоту');
      }
      lots.value = lots.value.filter(lot => lot.id !== lotId);
    } catch (err) {
      console.error('Помилка видалення лоту:', err);
      error.value = err.message;
      alert(err.message);
    }
  }
}

async function handleCreateLot() {
  if (!userStore.userId) {
    error.value = "Необхідно авторизуватися для створення лоту.";
    alert(error.value);
    return;
  }
  isCreatingLot.value = true;
  error.value = null;

  const payload = {
    userId: userStore.userId,
    title: newLot.value.title,
    description: newLot.value.description,
    start_price: parseFloat(newLot.value.startPrice), 
    status: String(newLot.value.status),              
    start_time: newLot.value.startTime,               
    end_time: newLot.value.endTime,                   
    image: newLot.value.image || null
  };

  console.log("Дані для створення лоту:", payload);

  try {
    const response = await fetch(`${apiBaseUrl}/lots/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Помилка створення лоту' }));
      throw new Error(errorData.error || 'Невідома помилка створення лоту');
    }

    const createdLot = await response.json();
    lots.value.unshift({ 
        ...createdLot,
        status: String(createdLot.status).toLowerCase() === 'true'
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
    console.error('Помилка створення лоту:', err);
    error.value = err.message; 
    alert(err.message);
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
    console.warn('Користувач не авторизований. Лоти не завантажено.');
    error.value = 'Будь ласка, увійдіть, щоб переглянути ваші лоти.';
    isLoadingLots.value = false;

  }
});

</script>

<style scoped>

.user-profile-page {
  font-family: Arial, sans-serif;
}

.container {
  max-width: 960px;
  margin: 20px auto; 
  padding: 0 15px;
}

.error-message {
  color: #721c24;
  background-color: #f8d7da;
  border-color: #f5c6cb;
  padding: .75rem 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: .25rem;
}

.title {
  margin-bottom: 20px;
  font-size: 1.75rem;
  text-align: center; 
}

#lots-container .lot {
  border: 1px solid #ddd;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 5px;
  background-color: #fff;
}

.lot h3 {
  margin-top: 0;
  margin-bottom: .5rem;
  font-size: 1.5rem;
}

.lot p {
  margin-bottom: .5rem;
  line-height: 1.6;
}
.lot .desc {
    color: #555;
}

.status-select {
  padding: .375rem .75rem;
  font-size: 1rem;
  line-height: 1.5;
  color: #495057;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid #ced4da;
  border-radius: .25rem;
  transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
}

.status-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-left: 8px;
  vertical-align: middle;
}

.status-indicator.active {
  background-color: #28a745; 
}

.status-indicator.inactive {
  background-color: #dc3545; 
}

.lot-actions {
  margin-top: 15px;
}

.lot-actions button {
  margin-right: 10px;
  padding: .375rem .75rem;
  font-size: 1rem;
  border-radius: .25rem;
  cursor: pointer;
  border: 1px solid transparent;
}

.edit-lot-button {
  color: #212529;
  background-color: #ffc107;
  border-color: #ffc107;
}

.edit-lot-button:disabled,
.edit-lot-button.disabled-button {
  color: #6c757d;
  background-color: #e9ecef;
  border-color: #ced4da;
  cursor: not-allowed;
}

.delete-lot-button {
  color: #fff;
  background-color: #dc3545;
  border-color: #dc3545;
}

.create-lot-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.create-lot-section h2 {
  margin-bottom: 20px;
  text-align: center; 
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: inline-block; 
  margin-bottom: .5rem;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group input[type="date"],
.form-group textarea,
.form-group select {
  display: block;
  width: 100%;
  padding: .375rem .75rem;
  font-size: 1rem;
  line-height: 1.5;
  color: #495057;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid #ced4da;
  border-radius: .25rem;
  box-sizing: border-box;
}

.button {
  color: #fff;
  background-color: #007bff;
  border-color: #007bff;
  padding: .5rem 1rem;
  font-size: 1.25rem;
  line-height: 1.5;
  border-radius: .3rem;
  cursor: pointer;
  width: 100%; 
}
.button:disabled {
  background-color: #6c757d;
  border-color: #6c757d;
  cursor: not-allowed;
}
</style>