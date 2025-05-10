import { defineStore } from 'pinia';

export const useUserStore = defineStore('userStore', {
    state: () => ({
        userId: null,
        fname: '',
        sname: '',
        lots: [],
    }),
    actions: {
        setUser(user) {
            this.userId = user.userId;
            this.fname = user.fname;
            this.sname = user.sname;
            this.lots = user.lots;
        },
        clearUser() {
            this.userId = null;
            this.fname = '';
            this.sname = '';
            this.lots = [];
        },
    },
});
