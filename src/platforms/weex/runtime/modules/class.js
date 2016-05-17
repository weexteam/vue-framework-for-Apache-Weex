import { extend } from 'shared/util'

function updateClass (oldVnode, vnode) {
  const el = vnode.elm
  const ctx = vnode.context

  let data = vnode.data
  const staticClass = data.staticClass
  const klass = data.class
  if (!staticClass && !klass) {
    return
  }

  const classList = []
  if (staticClass) {
    classList.push.apply(classList, staticClass)
  }
  if (klass) {
    classList.push.apply(classList, klass)
  }

  const style = getStyle(classList, ctx)
  for (const key in style) {
    el.setStyle(key, style[key])
  }
}

function getStyle (classList, ctx) {
  const stylesheet = ctx.$options.style || {}
  const result = {}
  classList.forEach(name => {
    const style = stylesheet[name]
    extend(result, style)
  })
  return result
}

export default {
  create: updateClass,
  update: updateClass
}
