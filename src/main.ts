
//bootstrap@5.3.3
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.min.js'
//@ts-ignore
// import tooltipDirective from './bsTooltipDirective.js';

//bootstrap-icons
import 'bootstrap-icons/font/bootstrap-icons.css'

//https://aesoper101.github.io/vue3-colorpicker/?path=/docs/example-introduction--docs

import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)


// app.directive('tooltip', tooltipDirective);

app.use(createPinia())
app.use(router)

app.mount('#app')
