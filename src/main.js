import './style.css'
import { setupCounter } from './counter.js'
import { init } from './components/Win98TaskbarManager.js'
import { initDesktop } from './components/Win98DesktopManager.js'

console.log('azOS initialized')
initDesktop();
init();
setupCounter(document.querySelector('#counter'))
