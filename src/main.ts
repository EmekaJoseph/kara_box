
//bootstrap@5.3.3
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import tooltipDirective from './bsTooltipDirective';

//bootstrap-icons
import 'bootstrap-icons/font/bootstrap-icons.css'

//https://aesoper101.github.io/vue3-colorpicker/?path=/docs/example-introduction--docs

import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import log from './log'

const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
    log.error('Vue error:', err, info)
}

window.addEventListener('error', (event) => {
    log.error('Uncaught error:', event.error || event.message)
})

window.addEventListener('unhandledrejection', (event) => {
    log.error('Unhandled rejection:', event.reason)
})

app.directive('tooltip', tooltipDirective);

app.use(createPinia())
app.use(router)

app.mount('#app')
