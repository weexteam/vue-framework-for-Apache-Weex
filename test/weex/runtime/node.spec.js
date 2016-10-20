import {
  compileAndStringify,
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
    const instance = createInstance(runtime, `
      new Vue({
        render: function (createElement) {
          return createElement('div', {}, [
            createElement('text', { attrs: { value: 'Hello' }}, []),
            createElement('foo', { props: { x: 'Weex' }})
          ])
        },
        components: {
          foo: {
            props: {
              x: { default: 'World' }
            },
            render: function (createElement) {
              return createElement('text', { attrs: { value: this.x }}, [])
            }
          }
        },
        el: "body"
      })
    `)
    expect(instance.getRealRoot()).toEqual({
      type: 'div',
      children: [
        { type: 'text', attr: { value: 'Hello' }},
        { type: 'text', attr: { value: 'Weex' }}
      ]
    })
  })

  it('should be generated with module diff', (done) => {
    const instance = createInstance(runtime, `
      new Vue({
        data: {
          counter: 0
        },
        render: function (createElement) {
          switch (this.counter) {
            case 1:
            return createElement('div', {}, [
              createElement('text', { attrs: { value: 'Hello' }}, []),
              createElement('text', { attrs: { value: 'World' }}, [])
            ])

            case 2:
            return createElement('div', {}, [
              createElement('text', { attrs: { value: 'Hello' }}, []),
              createElement('text', { attrs: { value: 'World' }}, []),
              createElement('text', { attrs: { value: 'Weex' }}, [])
            ])

            case 3:
            return createElement('div', {}, [
              createElement('text', { attrs: { value: 'Hello' }}, []),
              createElement('text', { attrs: { value: 'Weex' }}, [])
            ])

            case 4:
            return createElement('div', {}, [
              createElement('text', { attrs: { value: 'Weex' }}, [])
            ])

            case 5:
            return createElement('div', {}, [
              createElement('text', { attrs: { value: 'Hello' }}, []),
              createElement('text', { attrs: { value: 'Weex' }}, [])
            ])

            case 6:
            return createElement('div', {}, [
              createElement('input', { attrs: { value: 'Hello' }}, []),
              createElement('text', { attrs: { value: 'Weex' }}, [])
            ])

            default:
            return createElement('div', {}, [
              createElement('text', { attrs: { value: 'Hello' }}, []),
            ])
          }
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

    instance.$refresh({ counter: 1 })
    setTimeout(() => {
      expect(instance.getRealRoot()).toEqual({
        type: 'div',
        children: [
          { type: 'text', attr: { value: 'Hello' }},
          { type: 'text', attr: { value: 'World' }}
        ]
      })

      instance.$refresh({ counter: 2 })
      setTimeout(() => {
        expect(instance.getRealRoot()).toEqual({
          type: 'div',
          children: [
            { type: 'text', attr: { value: 'Hello' }},
            { type: 'text', attr: { value: 'World' }},
            { type: 'text', attr: { value: 'Weex' }}
          ]
        })

        instance.$refresh({ counter: 3 })
        setTimeout(() => {
          expect(instance.getRealRoot()).toEqual({
            type: 'div',
            children: [
              { type: 'text', attr: { value: 'Hello' }},
              { type: 'text', attr: { value: 'Weex' }}
            ]
          })

          instance.$refresh({ counter: 4 })
          setTimeout(() => {
            expect(instance.getRealRoot()).toEqual({
              type: 'div',
              children: [
                { type: 'text', attr: { value: 'Weex' }}
              ]
            })

            instance.$refresh({ counter: 5 })
            setTimeout(() => {
              expect(instance.getRealRoot()).toEqual({
                type: 'div',
                children: [
                  { type: 'text', attr: { value: 'Hello' }},
                  { type: 'text', attr: { value: 'Weex' }}
                ]
              })

              instance.$refresh({ counter: 6 })
              setTimeout(() => {
                expect(instance.getRealRoot()).toEqual({
                  type: 'div',
                  children: [
                    { type: 'input', attr: { value: 'Hello' }},
                    { type: 'text', attr: { value: 'Weex' }}
                  ]
                })
                done()
              })
            })
          })
        })
      })
    })
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
