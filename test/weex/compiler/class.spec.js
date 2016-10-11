import { compile } from '../../../packages/weex-template-compiler'

describe('compile class', () => {
  it('should be compiled', () => {
    const { render, staticRenderFns, errors } = compile(`<div class="a b c"></div>`)
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).not.toBeUndefined()
    expect(staticRenderFns.length).toEqual(1)
    expect(staticRenderFns).toMatch(/staticClass\:\["a","b","c"\]/)
    expect(errors).toEqual([])
  })

  it('should compile dynamic class', () => {
    const { render, staticRenderFns, errors } = compile(`<div class="a {{b}} c"></div>`)
    expect(render).not.toBeUndefined()
    expect(staticRenderFns).toEqual([])
    expect(render).toMatch(/class\:\["a",_s\(b\),"c"\]/)
    expect(errors).not.toBeUndefined()
    expect(errors.length).toEqual(1)
    expect(errors[0]).toMatch(/a \{\{b\}\} c/)
    expect(errors[0]).toMatch(/v\-bind/)
  })
})
