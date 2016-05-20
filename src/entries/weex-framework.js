import VueRuntime from './weex-runtime'
import { Node } from 'weex/runtime/native'

const globalState = {}
const globalMethodConfig = {}
const globalInstance = {}
const nativeModules = {}
const nativeComponents = {}

const Vue = overrideVue(VueRuntime)

function overrideVue (Vue) {
  const _init = Vue.prototype._init
  Vue.prototype._init = function (options = {}) {
    options.init = options.init ? [wxInit].concat(options.init) : wxInit
    _init.call(this, options)
  }

  function wxInit () {
    const options = this.$options
    const parentOptions = (options.parent && options.parent.$options) || {}

    // root vm
    if (options.el) {
      const instanceId = globalState.currentInstanceId
      const config = globalState.currentInstanceConfig
      const externalData = globalState.currentInstanceData
      const methodConfig = globalState.currentInstanceMethodConfig
      delete globalState.currentInstanceId
      delete globalState.currentInstanceConfig
      delete globalState.currentInstanceData
      delete globalState.currentInstanceMethodConfig
      this.$instanceId = instanceId
      options.instanceId = instanceId
      options.globalConfig = config
      options.methodConfig = methodConfig
      const dataOption = options.data
      const data = (typeof dataOption === 'function' ? dataOption() : dataOption) || {}
      options.data = Object.assign(data, externalData)
      if (instanceId) {
        globalInstance[instanceId] = this
      }
    }

    if (!options.globalConfig && parentOptions.globalConfig) {
      options.globalConfig = parentOptions.globalConfig
    }

    if (!options.methodConfig && parentOptions.methodConfig) {
      options.methodConfig = parentOptions.methodConfig
    }
  }

  return Vue
}

global.createInstance = function createInstance (
  instanceId, appCode, config /* {bundleUrl, debug} */, data) {
  const methodConfig = { callbacks: [], events: [], uid: 1 }
  globalMethodConfig[instanceId] = methodConfig

  globalState.currentInstanceId = instanceId
  globalState.currentInstanceConfig = config
  globalState.currentInstanceData = data
  globalState.currentInstanceMethodConfig = methodConfig

  function requireNativeModule (name) {
    const nativeModule = nativeModules[name] || []
    const output = {}
    for (const methodName in nativeModule) {
      const defaultArgs = nativeModule[methodName]
      output[methodName] = (...args) => {
        const finalArgs = []
        defaultArgs.forEach((arg, index) => {
          const value = args[index]
          finalArgs[index] = normalize(value, methodConfig)
        })
        global.callNative(instanceId + '', [{ module: name, method: methodName, args: finalArgs }])
      }
    }
    return output
  }

  const start = new Function('Vue', '__weex_require_module__', appCode)
  const subVue = Vue.extend({})
  start(subVue, requireNativeModule)
  const instance = globalInstance[instanceId]
  global.callNative(instanceId + '', [{ module: 'dom', method: 'createFinish', args: [] }])
}

global.destroyInstance = function destroyInstance (instanceId) {
  const instance = globalInstance[instanceId]
  delete globalInstance[instanceId]
  delete globalMethodConfig[instanceId]
  instance.$destroy()
}

global.refreshInstance = function refreshInstance (instanceId, data) {
  const instance = globalInstance[instanceId]
  for (const key in data) {
    Vue.set(instance, key, data[key])
  }
  global.callNative(instanceId + '', [{ module: 'dom', method: 'refreshFinish', args: [] }])
}

global.getRoot = function getRoot (instanceId) {
  const instance = globalInstance[instanceId]
  return instance.$el.toJSON()
}

global.callJS = function callJS (instanceId, tasks) {
  const methodConfig = globalMethodConfig[instanceId] || {}

  tasks.forEach(task => {
    const args = task.args

    if (task.method === 'fireEvent') {
      const nodeId = args[0]
      const type = args[1]
      const e = args[2] || {}
      const node = methodConfig.events[nodeId]
      const context = node.context
      const handlers = node.handlers[type]

      e.type = type
      e.target = node.el
      e.timestamp = Date.now()

      handlers.forEach(handle => {
        handle.call(context, e)
      })
    }

    if (task.method === 'callback') {
      const callbackId = args[0]
      const data = args[1]
      const ifKeepAlive = args[2]
      const callback = methodConfig.callbacks[callbackId]

      if (typeof callback === 'function') {
        callback(data) // data is already a object, @see: lib/framework.js

        if (typeof ifKeepAlive === 'undefined' || ifKeepAlive === false) {
          methodConfig.callbacks[callbackId] = undefined
        }
      }
    }
  })
}

global.registerModules = function registerModules (modules) {
  for (const name in modules) {
    if (!nativeModules[name]) {
      nativeModules[name] = {}
    }
    modules[name].forEach(method => {
      nativeModules[name][method.name] = method.args
    })
  }
}

global.registerComponents = function registerComponents (components) {
  const config = Vue.config
  const newComponents = {}
  if (Array.isArray(components)) {
    components.forEach(component => {
      if (!component) {
        return
      }
      if (typeof component === 'string') {
        nativeComponents[component] = true
        newComponents[component] = true
      } else if (typeof component === 'object' && typeof component.type === 'string') {
        nativeComponents[component.type] = component
        newComponents[component.type] = true
      }
    })
    const oldIsReservedTag = config.isReservedTag
    config.isReservedTag = name => {
      return newComponents[name] || oldIsReservedTag(name)
    }
  }
}

function normalize (v, config) {
  const type = typof(v)

  switch (type) {
    case 'undefined':
    case 'null':
      return ''
    case 'regexp':
      return v.toString()
    case 'date':
      return v.toISOString()
    case 'number':
    case 'string':
    case 'boolean':
    case 'array':
    case 'object':
      if (v instanceof Node) {
        return v.ref
      }
      return v
    case 'function':
      config.callbacks[++config.uid] = v
      return config.uid.toString()
    default:
      return JSON.stringify(v)
  }
}

function typof (v) {
  const s = Object.prototype.toString.call(v)
  return s.substring(8, s.length - 1).toLowerCase()
}

export default Vue
