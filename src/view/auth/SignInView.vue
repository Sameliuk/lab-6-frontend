<script>
import router from '@/router';
import { useUserStore } from '@/stores/userStore';

export default {
    data() {
        return {
            form: {
                fname: '',
                password: '',
            },
            errors: [],
        };
    },
    methods: {
        async login(e) {
            e.preventDefault();

            localStorage.clear();

            this.errors = [];

            if (!this.form.fname) {
                this.errors.push('Ім’я обов’язкова');
            }
            if (!this.form.password) {
                this.errors.push('Пароль обов’язковий');
            }
            if (this.errors.length > 0) {
                return;
            }

            const userStore = useUserStore();
            try {
                const res = await fetch('http://localhost:3000/users/signIn', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json; charset=UTF-8',
                    },
                    body: JSON.stringify({
                        fname: this.form.fname,
                        password: this.form.password,
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
                }
                if (!res.ok) {
                    alert('Неправильні дані для входу');
                }
            } catch (error) {
                console.error('Login error:', error);
                this.errors.push(
                    'Виникла помилка. Будь ласка, спробуйте пізніше.'
                );
                this.form.fname = '';
                this.form.password = '';
            }
        },
    },
};
</script>

<template>
    <!DOCTYPE html>
    <html lang="uk">
        <head>
            <meta charset="UTF-8" />
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            />
            <title>Увійти | Lotify</title>
        </head>

        <body>
            <header>
                <a href="/" class="logo">Lotify</a>
            </header>

            <div class="auth-container">
                <h2>Авторизація</h2>
                <div
                    id="error-message"
                    class="error-message"
                    style="display: none"
                ></div>

                <form id="login-form">
                    <div class="form-group">
                        <label for="fname">Ім'я:</label>
                        <input
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
                    <a href="/users/signUp">Створити акаунт</a>
                </p>
            </div>
        </body>
    </html>
</template>

<style scoped>
@import '@/styles/authPage.css';
</style>
