import {
  compileAndStringify,
  prepareRuntime,
  resetRuntime,
  createInstance
} from '../helpers/index'

describe('generate class', () => {
  let runtime

  beforeAll(() => {
    runtime = prepareRuntime()
  })

  afterAll(() => {
    resetRuntime()
    runtime = null
  })

  it('should be generated', () => {
    const { render, staticRenderFns } = compileAndStringify(`
      <div>
        <text class="a b c">Hello World</text>
      </div>
    `)
    const instance = createInstance(runtime, `
      new Vue({
        render: ${render},
        staticRenderFns: ${staticRenderFns},
        style: {
          a: {
            fontSize: '100'
          },
          b: {
            color: '#ff0000'
          },
          c: {
            fontWeight: 'bold'
          }
        },
        el: 'body'
      })
    `)
    expect(instance.getRealRoot()).toEqual({
      type: 'div',
      children: [
        { type: 'text', style: { fontSize: '100', color: '#ff0000', fontWeight: 'bold' }, attr: { value: 'Hello World' }}
      ]
    })
  })
})
