<script setup>
import router from '@/router';
import { reactive } from 'vue';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();
userStore.clearUser();

const currentUser = reactive({
    password: '',
    fname: '',
    sname: '',
});

const handleSubmit = async (event) => {
    event.preventDefault();

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
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('user', JSON.stringify(data));
            userStore.setUser({
                userId: data.user.id,
                fname: data.user.fname,
                sname: data.user.sname,
                lots: data.user.lots,
            });
            router.push('/users/profile');
        } else {
            const errorData = await res.json();
            console.error('An error occurred during registration:', errorData);
        }
    } catch (error) {
        console.error('Error sending request:', error);
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
