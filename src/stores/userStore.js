import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
    state: () => ({
        userId: '',
        fname: '',
        sname: '',
    }),
    actions: {
        setUser(userData) {
            this.userId = userData.user_id;
            this.fname = userData.fname;
            this.sname = userData.sname;
        },
        clearUser() {
            this.userId = '';
            this.fname = '';
            this.sname = '';
        },
    },
});
