import './style.css'
import { setupCounter } from './counter.js'
import { initDesktop } from './components/desktop.js'

console.log('azOS initialized')
initDesktop();
setupCounter(document.querySelector('#counter'))
