/* @flow */

import { extend } from 'shared/util'

function updateClass (oldVnode: VNodeWithData, vnode: VNodeWithData) {
  const el = vnode.elm
  const ctx = vnode.context

  const data: VNodeData = vnode.data
  const oldData: VNodeData = oldVnode.data
  if (!data.staticClass && !data.class &&
      (!oldData || (!oldData.staticClass && !oldData.class))) {
    return
  }

  const classList = []
  if (data.staticClass) {
    classList.push.apply(classList, data.staticClass)
  }
  if (data.class) {
    classList.push.apply(classList, data.class)
  }

  // @todo: remove old class Style
  const style = getStyle(classList, ctx)
  for (const key in style) {
    el.setStyle(key, style[key])
  }
}

function getStyle (classList: Array<string>, ctx: Component): Object {
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
