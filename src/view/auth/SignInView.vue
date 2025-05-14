<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router'; // Імпортуємо useRouter
import { useUserStore } from '@/stores/userStore';

const router = useRouter(); // Ініціалізуємо роутер
const userStore = useUserStore();

// userStore.clearUser(); // Зазвичай clearUser викликається при виході або при першому завантаженні компонента, якщо це потрібно

const form = ref({
    fname: '',
    password: '',
});
const errors = ref([]);

async function login(e) {
    e.preventDefault();
    errors.value = []; // Очищаємо попередні помилки

    // Клієнтська валідація
    if (!form.value.fname) {
        errors.value.push("Ім'я є обов'язковим");
    }
    if (!form.value.password) {
        errors.value.push('Пароль є обов’язковим');
    }
    if (errors.value.length > 0) return;

    try {
        const res = await fetch('http://localhost:3000/users/signIn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify(form.value),
            credentials: 'include' // <--- ДОДАНО ЦЕЙ РЯДОК
        });

        if (res.ok) { // Статус 200-299
            const data = await res.json();
            if (data.user) { // Перевіряємо, чи є об'єкт user у відповіді
                localStorage.setItem('user', JSON.stringify(data.user)); // Зберігаємо об'єкт користувача
                userStore.setUser(data.user); // Передаємо об'єкт data.user (який має поле id, fname і т.д.)
                router.push('/users/profile');
            } else {
                // Якщо res.ok, але data.user немає (малоймовірно з вашим бекендом)
                errors.value.push('Не вдалося отримати дані користувача з відповіді сервера.');
            }
        } else { // Якщо статус не ОК (наприклад, 401, 500)
            let errorMsg = 'Неправильні дані для входу'; // Повідомлення за замовчуванням
            try {
                const errorData = await res.json();
                // Бекенд для 401 повертає { error: "..." }
                errorMsg = errorData.error || errorData.message || errorMsg;
            } catch (parseError) {
                // Якщо тіло відповіді не JSON або порожнє
                console.error('Помилка розбору JSON відповіді помилки (вхід):', parseError);
                errorMsg = `Помилка сервера: ${res.status} ${res.statusText}`;
            }
            errors.value.push(errorMsg);
        }
    } catch (error) {
        console.error('Помилка з\'єднання або запиту (вхід):', error);
        errors.value.push('Помилка з\'єднання з сервером. Спробуйте пізніше.');
    }
}
</script>

<template>
    <div class="auth-container">
        <h2>Авторизація</h2>
        <div v-if="errors.length" class="error-message">
            <ul>
                <li v-for="(error, index) in errors" :key="index">
                    {{ error }}
                </li>
            </ul>
        </div>

        <form @submit="login">
            <div class="form-group">
                <label for="fname">Ім'я:</label>
                <input
                    v-model="form.fname"
                    type="text"
                    id="fname"
                    name="fname"
                    placeholder="Введіть ім'я"
                    required
                />
            </div>
            <div class="form-group">
                <label for="password">Пароль:</label>
                <input
                    v-model="form.password"
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Введіть пароль"
                    required
                />
            </div>
            <button type="submit" class="btn-primary">Увійти</button>
        </form>

        <p>
            Ще не зареєстровані?
            <RouterLink to="/users/signUp">Створити акаунт</RouterLink>
        </p>
    </div>
</template>

<style scoped>
@import '@/styles/authPage.css';

.error-message {
    color: red;
    margin-bottom: 10px;
}
</style>
