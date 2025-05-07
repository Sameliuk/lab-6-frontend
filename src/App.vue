<script>
import HeaderView from './components/HeaderView.vue';

export default {
    name: 'App',
    components: {
        HeaderView,
    },
};
</script>

<template>
    <div id="app">
        <HeaderView />
        <main>
            <router-view />
        </main>
    </div>
</template>
