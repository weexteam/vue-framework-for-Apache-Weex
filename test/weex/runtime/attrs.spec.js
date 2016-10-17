import { Runtime, Instance } from 'weex-vdom-tester'
import * as Vue from '../../../dist/weex.common.js'

import { config } from 'weex-js-framework/src/runtime'

let sendTasksHandler = function () {}
config.sendTasks = config.Document.handler = function () {
  sendTasksHandler.apply(null, arguments)
}

Vue.init(config)
const runtime = new Runtime(Vue)

sendTasksHandler = function () {
  runtime.target.callNative.apply(runtime.target, arguments)
}

describe('generate attributes', () => {
  it('should be generated', () => {
    const instance = new Instance(runtime)
    instance.$create(`
      var module = { exports: {}}
      module.exports.render = function() {with(this){return _m(0)}}
      module.exports.staticRenderFns = [function(){with(this){return _h('div',[_h('text',{staticStyle:{fontSize:"100px"}},["Hello World."])])}}]
      module.exports.el = "body"
      new Vue(module.exports)
    `)
    const dom = instance.getRealRoot()
    expect(dom).toEqual({
      type: 'div',
      children: [
        { type: 'text', style: { fontSize: '100px' }, attr: { value: 'Hello World.' }}
      ]
    })
  })
})
