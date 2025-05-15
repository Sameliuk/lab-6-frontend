<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router'; 
import { useUserStore } from '@/stores/userStore';

const router = useRouter(); 
const userStore = useUserStore();

const form = ref({
    fname: '',
    password: '',
});
const errors = ref([]);

async function login(e) {
    e.preventDefault();
    errors.value = []; 

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
            credentials: 'include' 
        });

        if (res.ok) { 
            const data = await res.json();
            if (data.user) { 
                localStorage.setItem('user', JSON.stringify(data.user)); 
                userStore.setUser(data.user); 
                router.push('/users/profile');
            } else {

                errors.value.push('Не вдалося отримати дані користувача з відповіді сервера.');
            }
        } else { 
            let errorMsg = 'Неправильні дані для входу'; 
            try {
                const errorData = await res.json();

                errorMsg = errorData.error || errorData.message || errorMsg;
            } catch (parseError) {

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