import { defineStore } from 'pinia';

export const useUserStore = defineStore('userStore', {
    state: () => ({
        userId: null, 
        fname: '',
        sname: '',
        lots: [],
    }),
    getters: {
        isLoggedIn: (state) => state.userId !== null,
        currentUserId: (state) => state.userId,
        currentUserFname: (state) => state.fname,
    },
    actions: {
        setUser(userData) { 
            if (userData && userData.id) { 
                this.userId = userData.id;       
                this.fname = userData.fname || ''; 
                this.sname = userData.sname || '';
                this.lots = userData.lots || [];   
                console.log('User set in store:', this.$state);
            } else {
                console.warn('setUser_ACTION: Спроба встановити невалідні дані користувача:', userData);
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
        },
        loadUserFromLocalStorage() {
            const userJSON = localStorage.getItem('user');
            if (userJSON) {
                try {
                    const parsedUserData = JSON.parse(userJSON);
                    if (parsedUserData && parsedUserData.id) { 
                        this.setUser(parsedUserData); 
                        console.log('User loaded from localStorage and set in store');
                    } else {
                        console.warn('Дані користувача в LocalStorage не містять id, очищення...');
                        this.clearUser(); 
                    }
                } catch (error) {
                    console.error('Помилка розбору JSON або встановлення користувача з LocalStorage:', error);
                    this.clearUser(); 
                }
            }
        },
    },
});