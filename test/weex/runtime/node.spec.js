import {
  prepareRuntime,
  resetRuntime,
  createInstance
} from '../helpers/index'

describe('node in render function', () => {
  let runtime

  beforeAll(() => {
    runtime = prepareRuntime()
  })

  afterAll(() => {
    resetRuntime()
    runtime = null
  })

  it('should be generated', () => {
    const instance = createInstance(runtime, `
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
      children: [
        { type: 'text', attr: { value: 'Hello' }}
      ]
    })
  })

  it('should be generated with all types of text', () => {
    const instance = createInstance(runtime, `
      new Vue({
        render: function (createElement) {
          return createElement('div', {}, [
            createElement('text', { attrs: { value: 'Hello' }}, []),
            'World',
            createElement('text', {}, ['Weex'])
          ])
        },
        el: "body"
      })
    `)
    expect(instance.getRealRoot()).toEqual({
      type: 'div',
      children: [
        { type: 'text', attr: { value: 'Hello' }},
        { type: 'text', attr: { value: 'World' }},
        { type: 'text', attr: { value: 'Weex' }}
      ]
    })
  })

  it('should be generated with comments', () => {
    // todo
  })

  it('should be generated with sub components', () => {
    // todo
  })

  it('should be generated with module diff', () => {
    // todo
  })

  it('should be generated with if/for diff', () => {
    // todo
  })

  it('should be generated with node structure diff', () => {
    // todo
  })

  it('should be generated with component diff', () => {
    // todo
  })
})
