<script setup>
import { ref } from 'vue'; 
import { reactive } from 'vue'; 
import { useRouter } from 'vue-router'; 
import { useUserStore } from '@/stores/userStore';

const router = useRouter(); 
const userStore = useUserStore();

const currentUser = reactive({ 
    password: '',
    fname: '',
    sname: '',
});

const registrationErrors = ref([]);

const handleSubmit = async (event) => {
    event.preventDefault();
    registrationErrors.value = []; 

    try {
        const res = await fetch('http://localhost:3000/users/signUp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({
                fname: currentUser.fname,
                sname: currentUser.sname,
                password: currentUser.password,
            }),
            credentials: 'include' 
        });

        if (res.ok) { 
            const data = await res.json(); 
            if (data.user) { 
                localStorage.setItem('user', JSON.stringify(data.user)); 
                userStore.setUser(data.user); 
                router.push('/users/profile');
            } else {

                registrationErrors.value.push('Не вдалося отримати дані користувача після реєстрації.');
                console.error('An error occurred during registration: No user data in response', data);
            }
        } else { 
            let errorMsg = 'Помилка під час реєстрації';
            try {
                const errorData = await res.json();
                errorMsg = errorData.error || errorData.message || errorMsg;
            } catch (parseError) {
                console.error('Помилка розбору JSON відповіді помилки (реєстрація):', parseError);
                errorMsg = `Помилка сервера: ${res.status} ${res.statusText}`;
            }
            registrationErrors.value.push(errorMsg);
            console.error('An error occurred during registration:', errorMsg);

        }
    } catch (error) {
        console.error('Error sending request (signUp):', error);
        registrationErrors.value.push('Помилка з\'єднання з сервером при реєстрації.');
    }
};
</script>

<template>
    <div class="auth-container">
        <h2>Реєстрація</h2>

        <form @submit="handleSubmit">
            <div class="form-group">
                <label for="fname">Ім'я:</label>
                <input
                    type="text"
                    id="fname"
                    v-model="currentUser.fname"
                    placeholder="Введіть ім'я"
                    required
                />
            </div>
            <div class="form-group">
                <label for="sname">Прізвище:</label>
                <input
                    type="text"
                    id="sname"
                    v-model="currentUser.sname"
                    placeholder="Введіть прізвище"
                    required
                />
            </div>
            <div class="form-group">
                <label for="password">Пароль:</label>
                <input
                    type="password"
                    id="password"
                    v-model="currentUser.password"
                    placeholder="Введіть пароль"
                    required
                />
            </div>
            <button type="submit" class="btn-primary">Зареєструватися</button>
        </form>

        <p>Вже маєте акаунт? <a href="/users/signIn">Увійти</a></p>
    </div>
</template>

<style scoped>
@import '@/styles/authPage.css';
</style>