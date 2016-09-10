import Vue from './weex-runtime'
import renderer from 'weex/runtime/config'

const {
  instances,
  modules,
  components
} = renderer

let activeId = {}

export function init (cfg) {
  renderer.Document = cfg.Document
  renderer.Element = cfg.Element
  renderer.Comment = cfg.Comment
  renderer.sendTasks = cfg.sendTasks
}

export function createInstance (
  instanceId, appCode, config /* {bundleUrl, debug} */, data) {
  activeId = instanceId
  instances[instanceId] = {
    instanceId, config, data,
    document: new renderer.Document(instanceId, config.bundleUrl),
    callbacks: [],
    callbackId: 1
  }

  const start = new Function(
    'Vue',
    '__weex_require_module__',
    'setTimeout',
    'setInterval',
    'clearTimeout',
    'clearInterval',
    appCode)
  const subVue = Vue.extend({});
  ['util', 'set', 'del', 'nextTick', 'use'].forEach(name => {
    subVue[name] = Vue[name]
  })

  const moduleGetter = genModuleGetter(instanceId)
  const timerAPIs = getInstanceTimer(instanceId, moduleGetter)
  start(
    subVue, moduleGetter,
    timerAPIs.setTimeout,
    timerAPIs.setInterval,
    timerAPIs.clearTimeout,
    timerAPIs.clearInterval)
  renderer.sendTasks(instanceId + '', [{ module: 'dom', method: 'createFinish', args: [] }], -1)
}

export function destroyInstance (instanceId) {
  const instance = instances[instanceId] || {}
  if (instance.app instanceof Vue) {
    instance.app.$destroy()
  }
  delete instances[instanceId]
}

export function refreshInstance (instanceId, data) {
  const instance = instances[instanceId] || {}
  if (!instance.app instanceof Vue) {
    return new Error(`refreshInstance: instance ${instanceId} not found!`)
  }
  for (const key in data) {
    Vue.set(instance.app, key, data[key])
  }
  renderer.sendTasks(instanceId + '', [{ module: 'dom', method: 'refreshFinish', args: [] }], -1)
}

export function getRoot (instanceId) {
  const instance = instances[instanceId] || {}
  if (!instance.app instanceof Vue) {
    return new Error(`getRoot: instance ${instanceId} not found!`)
  }
  return instance.app.$el.toJSON()
}

export function receiveTasks (instanceId, tasks) {
  const instance = instances[instanceId] || {}
  if (!instance.app instanceof Vue) {
    return new Error(`receiveTasks: instance ${instanceId} not found!`)
  }
  const { callbacks, document } = instance
  tasks.forEach(task => {
    if (task.method === 'fireEvent') {
      const [nodeId, type, e, domChanges] = task.args
      const el = document.getRef(nodeId)
      document.fireEvent(el, type, e, domChanges)
    }
    if (task.method === 'callback') {
      const [callbackId, data, ifKeepAlive] = task.args
      const callback = callbacks[callbackId]
      if (typeof callback === 'function') {
        callback(data)
        if (typeof ifKeepAlive === 'undefined' || ifKeepAlive === false) {
          callbacks[callbackId] = undefined
        }
      }
    }
  })

  renderer.sendTasks(instanceId + '', [{ module: 'dom', method: 'updateFinish', args: [] }], -1)
}

export function registerModules (newModules) {
  for (const name in newModules) {
    if (!modules[name]) {
      modules[name] = {}
    }
    newModules[name].forEach(method => {
      if (typeof method === 'string') {
        modules[name][method] = true
      }
      else {
        modules[name][method.name] = method.args
      }
    })
  }
}

export function registerComponents (newComponents) {
  const config = Vue.config
  const newConfig = {}
  if (Array.isArray(newComponents)) {
    newComponents.forEach(component => {
      if (!component) {
        return
      }
      if (typeof component === 'string') {
        components[component] = true
        newConfig[component] = true
      } else if (typeof component === 'object' && typeof component.type === 'string') {
        components[component.type] = component
        newConfig[component.type] = true
      }
    })
    const oldIsReservedTag = config.isReservedTag
    config.isReservedTag = name => {
      return newConfig[name] || oldIsReservedTag(name)
    }
  }
}

Vue.mixin({
  beforeCreate () {
    const options = this.$options
    const parentOptions = (options.parent && options.parent.$options) || {}

    // root vm
    if (options.el) {

      // record instance info
      const instance = instances[activeId] || {}
      this.$instanceId = activeId
      options.instanceId = activeId
      this.$document = instance.document

      // set external data of instance
      const dataOption = options.data
      const internalData = (typeof dataOption === 'function' ? dataOption() : dataOption) || {}
      options.data = Object.assign(internalData, instance.data)

      // record instance by id
      instance.app = this

      activeId = undefined
    }
    else {
      this.$instanceId = options.instanceId = parentOptions.instanceId
    }
  }
})

Vue.prototype.$getConfig = function () {
  const instance = instances[this.$instanceId] || {}
  if (instance.app instanceof Vue) {
    return instance.config
  }
}

function genModuleGetter (instanceId) {
  const instance = instances[instanceId]
  return function (name) {
    const nativeModule = modules[name] || []
    const output = {}
    for (const methodName in nativeModule) {
      const defaultArgs = nativeModule[methodName]
      output[methodName] = (...args) => {
        let finalArgs = args.map(value => {
          return normalize(value, instance)
        })
        renderer.sendTasks(instanceId + '', [{ module: name, method: methodName, args: finalArgs }], -1)
      }
    }
    return output
  }
}

function getInstanceTimer (instanceId, moduleGetter) {
  const instance = instances[instanceId]
  const timer = moduleGetter('timer')
  const timerAPIs = {
    setTimeout: (...args) => {
      const handler = function () {
        args[0](...args.slice(2))
      }
      timer.setTimeout(handler, args[1])
      return instance.callbackId.toString()
    },
    setInterval: (...args) => {
      const handler = function () {
        args[0](...args.slice(2))
      }
      timer.setInterval(handler, args[1])
      return instance.callbackId.toString()
    },
    clearTimeout: (n) => {
      timer.clearTimeout(n)
    },
    clearInterval: (n) => {
      timer.clearInterval(n)
    }
  }
  return timerAPIs
}

function normalize (v, instance) {
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
      if (v instanceof renderer.Element) {
        return v.ref
      }
      return v
    case 'function':
      instance.callbacks[++instance.callbackId] = v
      return instance.callbackId.toString()
    default:
      return JSON.stringify(v)
  }
}

function typof (v) {
  const s = Object.prototype.toString.call(v)
  return s.substring(8, s.length - 1).toLowerCase()
}
