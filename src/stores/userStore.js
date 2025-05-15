import { defineStore } from 'pinia';

// Create a simple event bus for auth state changes
export const authEventBus = {
    listeners: {},
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
};

export const useUserStore = defineStore('userStore', {
    state: () => ({
        userId: null, // Буде зберігати значення user.id
        fname: '',
        sname: '',
        lots: [],
        // Можна додати isLoggedIn: false, і керувати ним
    }),
    // Getters можуть бути корисні, наприклад, для перевірки, чи користувач залогінений
    getters: {
        isLoggedIn: (state) => state.userId !== null,
        currentUserId: (state) => state.userId,
        currentUserFname: (state) => state.fname,
    },
    actions: {
        setUser(userData) { // userData очікується як { id: ..., fname: ..., sname: ..., lots: ... }
            if (userData && userData.id) { // Перевіряємо, чи є userData та userData.id
                this.userId = userData.id;       // <--- ВИПРАВЛЕНО: використовуємо userData.id
                this.fname = userData.fname || ''; // Додамо || '' для уникнення undefined, якщо поля немає
                this.sname = userData.sname || '';
                this.lots = userData.lots || [];   // Якщо lots можуть бути відсутні
                console.log('User set in store:', this.$state);
                
                // Emit auth state change event
                authEventBus.emit('auth-change', { isLoggedIn: true, userData });
            } else {
                console.warn('setUser_ACTION: Спроба встановити невалідні дані користувача:', userData);
                // Можливо, тут варто викликати clearUser, якщо дані невалідні
                // this.clearUser();
            }
        },
        clearUser() {
            this.userId = null;
            this.fname = '';
            this.sname = '';
            this.lots = [];
            localStorage.removeItem('user');
            console.log('User cleared from store and localStorage');
            
            // Emit auth state change event
            authEventBus.emit('auth-change', { isLoggedIn: false });
        },
        loadUserFromLocalStorage() {
            const userJSON = localStorage.getItem('user');
            if (userJSON) {
                try {
                    const parsedUserData = JSON.parse(userJSON);
                    // Тепер parsedUserData - це об'єкт { id: ..., fname: ... }
                    // який ми зберегли з SignInView або SignUpView
                    if (parsedUserData && parsedUserData.id) { // <--- ВИПРАВЛЕНО: перевіряємо parsedUserData.id
                        this.setUser(parsedUserData); // Передаємо об'єкт користувача в setUser
                        console.log('User loaded from localStorage and set in store');
                    } else {
                        // Це може статися, якщо в localStorage збережено щось не те, або об'єкт без id
                        console.warn('Дані користувача в LocalStorage не містять id, очищення...');
                        this.clearUser(); // Очищаємо, якщо дані некоректні
                    }
                } catch (error) {
                    console.error('Помилка розбору JSON або встановлення користувача з LocalStorage:', error);
                    this.clearUser(); // Очищаємо у разі помилки розбору
                }
            }
        },
    },
});