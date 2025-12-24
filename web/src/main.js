import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createRouter,createWebHashHistory } from 'vue-router'
import Status from './views/Status.vue'
import Login from './views/Login.vue'
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: Login,
    },
    {
      path: '/status',
      component: Status,
    },
  ],
})

createApp(App).use(router).mount('#app')
