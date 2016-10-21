import * as Vue from '../../../dist/weex.common.js'
import { DEFAULT_ENV, Runtime, Instance } from 'weex-vdom-tester'
import { config } from 'weex-js-framework/src/runtime'

import {
  createInstance,
  syncPromise,
  checkRefresh
} from '../helpers/index'

let sendTasksHandler = () => {}
const { Document, Element, Comment } = config
function sendTasks () {
  sendTasksHandler.apply(null, arguments)
}

describe('framework APIs', () => {
  let runtime

  beforeEach(() => {
    Vue.init({ Document, Element, Comment, sendTasks })
    runtime = new Runtime(Vue)
    sendTasksHandler = function () {
      runtime.target.callNative(...arguments)
    }
  })

  afterEach(() => {
    Vue.reset()
  })

  it('createInstance', () => {
    const instance = new Instance(runtime)
    Vue.createInstance(instance.id, `
      new Vue({
        render: function (createElement) {
          return createElement('div', {}, [
            createElement('text', { attrs: { value: 'Hello' }}, [])
          ])
        },
        el: "body"
      })
    `)
    expect(instance.getRealRoot()).toEqual({
      type: 'div',
      children: [{ type: 'text', attr: { value: 'Hello' }}]
    })
  })

  it('createInstance with config', () => {
    const instance = new Instance(runtime)
    Vue.createInstance(instance.id, `
      new Vue({
        render: function (createElement) {
          return createElement('div', {}, [
            createElement('text', { attrs: { value: JSON.stringify(this.$getConfig()) }}, [])
          ])
        },
        el: "body"
      })
    `, { bundleUrl: 'http://example.com/', a: 1, b: 2 })
    expect(instance.getRealRoot()).toEqual({
      type: 'div',
      children: [{ type: 'text', attr: { value: '{"bundleUrl":"http://example.com/","a":1,"b":2}' }}]
    })
  })

  it('createInstance with external data', () => {
    const instance = new Instance(runtime)
    Vue.createInstance(instance.id, `
      new Vue({
        data: {
          a: 1,
          b: 2
        },
        render: function (createElement) {
          return createElement('div', {}, [
            createElement('text', { attrs: { value: this.a + '-' + this.b }}, [])
          ])
        },
        el: "body"
      })
    `, undefined, { a: 111 })
    expect(instance.getRealRoot()).toEqual({
      type: 'div',
      children: [{ type: 'text', attr: { value: '111-2' }}]
    })
  })

  it('destroyInstance', (done) => {
    const instance = new Instance(runtime)
    Vue.createInstance(instance.id, `
      new Vue({
        data: {
          x: 'Hello'
        },
        render: function (createElement) {
          return createElement('div', {}, [
            createElement('text', { attrs: { value: this.x }}, [])
          ])
        },
        el: "body"
      })
    `)
    expect(instance.getRealRoot()).toEqual({
      type: 'div',
      children: [{ type: 'text', attr: { value: 'Hello' }}]
    })

    syncPromise([
      checkRefresh(instance, { x: 'World' }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [{ type: 'text', attr: { value: 'World' }}]
        })
        Vue.destroyInstance(instance.id)
      }),
      checkRefresh(instance, { x: 'Weex' }, result => {
        expect(result).toEqual({
          type: 'div',
          children: [{ type: 'text', attr: { value: 'World' }}]
        })
        done()
      })
    ])
  })

  it('refreshInstance', (done) => {
    const instance = new Instance(runtime)
    Vue.createInstance(instance.id, `
      new Vue({
        data: {
          x: 'Hello'
        },
        render: function (createElement) {
          return createElement('div', {}, [
            createElement('text', { attrs: { value: this.x }}, [])
          ])
        },
        el: "body"
      })
    `)
    expect(instance.getRealRoot()).toEqual({
      type: 'div',
      children: [{ type: 'text', attr: { value: 'Hello' }}]
    })

    Vue.refreshInstance(instance.id, { x: 'World' })
    setTimeout(() => {
      expect(instance.getRealRoot()).toEqual({
        type: 'div',
        children: [{ type: 'text', attr: { value: 'World' }}]
      })

      Vue.destroyInstance(instance.id)
      const result = Vue.refreshInstance(instance.id, { x: 'Weex' })
      expect(result instanceof Error).toBe(true)
      expect(result).toMatch(/refreshInstance/)
      expect(result).toMatch(/not found/)

      setTimeout(() => {
        expect(instance.getRealRoot()).toEqual({
          type: 'div',
          children: [{ type: 'text', attr: { value: 'World' }}]
        })
        done()
      })
    })
  })

  it('getRoot', () => {
    const instance = new Instance(runtime)
    Vue.createInstance(instance.id, `
      new Vue({
        data: {
          x: 'Hello'
        },
        render: function (createElement) {
          return createElement('div', {}, [
            createElement('text', { attrs: { value: this.x }}, [])
          ])
        },
        el: "body"
      })
    `)

    let root = Vue.getRoot(instance.id)
    expect(root.ref).toEqual('_root')
    expect(root.type).toEqual('div')
    expect(root.children.length).toEqual(1)
    expect(root.children[0].type).toEqual('text')
    expect(root.children[0].attr).toEqual({ value: 'Hello' })
    Vue.destroyInstance(instance.id)

    root = Vue.getRoot(instance.id)
    expect(root instanceof Error).toBe(true)
    expect(root).toMatch(/getRoot/)
    expect(root).toMatch(/not found/)
  })

  it('reveiveTasks: fireEvent', () => {
    // todo
    // 1. createInstance
    // 2. fireEvent
    // 3. receive result
  })

  it('reveiveTasks: callback', () => {
    // todo
    // 1. createInstance
    // 2. call a native module API with callback
    // 3. invoke the callback
    // 4. receive result
  })

  it('registerModules', () => {
    Vue.registerModules({
      foo: ['a', 'b', 'c'],
      bar: [
        { name: 'a', args: ['string'] },
        { name: 'b', args: ['number'] },
        { name: 'c', args: ['string', 'number'] }
      ]
    })
    // todo
    // 1. create instance
    // 2. call native module APIs
    // 3. check callNative history
  })

  it('registerComponents', () => {
    // todo
    // 0. registration
    // 1. create instance
    // 2. catch error or warn
  })

  it('Vue.$getConfig', () => {
    const instance = new Instance(runtime)
    instance.$create(`
      new Vue({
        render: function (createElement) {
          return createElement('div', {}, [
            createElement('text', { attrs: { value: JSON.stringify(this.$getConfig()) }}, [])
          ])
        },
        el: "body"
      })
    `)
    expect(JSON.parse(instance.getRealRoot().children[0].attr.value)).toEqual({ env: DEFAULT_ENV })

    const instance2 = new Instance(runtime)
    instance2.$create(`
      new Vue({
        render: function (createElement) {
          return createElement('div', {}, [
            createElement('text', { attrs: { value: JSON.stringify(this.$getConfig()) }}, [])
          ])
        },
        el: "body"
      })
    `, { a: 1, b: 2 })
    expect(JSON.parse(instance2.getRealRoot().children[0].attr.value)).toEqual({ a: 1, b: 2, env: DEFAULT_ENV })
  })

  it('Timer', () => {
    // todo
    // 1. create instance with timer
    // 2. get one timer
    // 3. destroy instance
    // 4. no more timer received
  })

  it('send function param', () => {
    // todo
    // 0. registration
    // 1. create instance
    // 2. call API with function
    // 3. check callNative history
    // 4. callback
    // 5. receive result
  })

  it('send Element param', () => {
    // todo
    // 0. registration
    // 1. create instance
    // 2. call API with Element
    // 3. check callNative history
  })
})
