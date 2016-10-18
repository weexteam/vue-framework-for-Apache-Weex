import * as Vue from '../../../dist/weex.common.js'
import { compile } from '../../../packages/weex-template-compiler'

import { Runtime, Instance } from 'weex-vdom-tester'
import { config } from 'weex-js-framework/src/runtime'

function parseStatic (fns) {
  return '[' + fns.map(fn => `function () { ${fn} }`).join(',') + ']'
}

describe('generate attributes', () => {
  let sendTasksHandler = function () {}
  let runtime

  beforeAll(() => {
    config.sendTasks = config.Document.handler = function () {
      sendTasksHandler.apply(null, arguments)
    }
    Vue.init(config)
    runtime = new Runtime(Vue)
    sendTasksHandler = function () {
      runtime.target.callNative.apply(runtime.target, arguments)
    }
  })

  afterAll(() => {
    Vue.reset()
  })

  it('should be generated', () => {
    const instance = new Instance(runtime)
    const { render, staticRenderFns } = compile(`
      <div>
        <text value="Hello World" style="font-size: 100"></text>
      </div>
    `)
    instance.$create(`
      new Vue({
        render: function () { ${render} },
        staticRenderFns: ${parseStatic(staticRenderFns)},
        el: 'body'
      })
    `)
    expect(instance.getRealRoot()).toEqual({
      type: 'div',
      children: [
        { type: 'text', style: { fontSize: '100' }, attr: { value: 'Hello World' }}
      ]
    })
  })

  it('should be mutated', (done) => {
    const instance = new Instance(runtime)
    const { render, staticRenderFns } = compile(`
      <div @click="foo">
        <text :value="x"></text>
      </div>
    `)
    instance.$create(`
      new Vue({
        data: {
          x: 'Hello World'
        },
        methods: {
          foo: function () {
            this.x = 'Hello Vue'
          }
        },
        render: function () { ${render} },
        staticRenderFns: ${parseStatic(staticRenderFns)},
        el: "body"
      })
    `)
    expect(instance.getRealRoot()).toEqual({
      type: 'div',
      event: ['click'],
      children: [
        { type: 'text', attr: { value: 'Hello World' }}
      ]
    })

    instance.$fireEvent(instance.doc.body.ref, 'click', {})
    setTimeout(() => {
      expect(instance.getRealRoot()).toEqual({
        type: 'div',
        event: ['click'],
        children: [
          { type: 'text', attr: { value: 'Hello Vue' }}
        ]
      })
      done()
    })
  })

  it('should be cleared', (done) => {
    const instance = new Instance(runtime)
    const { render, staticRenderFns } = compile(`
      <div @click="foo">
        <text :value="x"></text>
      </div>
    `)
    instance.$create(`
      new Vue({
        data: {
          x: 'Hello World'
        },
        methods: {
          foo: function () {
            this.x = ''
          }
        },
        render: function () { ${render} },
        staticRenderFns: ${parseStatic(staticRenderFns)},
        el: "body"
      })
    `)
    expect(instance.getRealRoot()).toEqual({
      type: 'div',
      event: ['click'],
      children: [
        { type: 'text', attr: { value: 'Hello World' }}
      ]
    })

    instance.$fireEvent(instance.doc.body.ref, 'click', {})
    setTimeout(() => {
      expect(instance.getRealRoot()).toEqual({
        type: 'div',
        event: ['click'],
        children: [
          { type: 'text', attr: { value: '' }}
        ]
      })
      done()
    })
  })
})
