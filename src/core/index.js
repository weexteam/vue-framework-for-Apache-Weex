import config from './config'
import { initGlobalAPI } from './global-api/index'
import Vue from './instance/index'

initGlobalAPI(Vue)

Object.defineProperty(Vue.prototype, '$isServer', {
  get: () => config._isServer
})

Vue.version = '0.1.0'

export default Vue
