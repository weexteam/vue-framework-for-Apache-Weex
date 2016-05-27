import { extend, cached, camelize } from 'shared/util'

const normalize = cached(function (prop) {
  return camelize(prop)
})

function createStyle (oldVnode, vnode) {
  if (!vnode.data.staticStyle) {
    updateStyle(oldVnode, vnode)
    return
  }
  const elm = vnode.elm
  const staticStyle = vnode.data.staticStyle
  for (const name in staticStyle) {
    if (staticStyle[name]) {
      elm.setStyle(normalize(name), staticStyle[name])
    }
  }
  updateStyle(oldVnode, vnode)
}

function updateStyle (oldVnode, vnode) {
  if (!oldVnode.data.style && !vnode.data.style) {
    return
  }
  let cur, name
  const elm = vnode.elm
  const oldStyle = oldVnode.data.style || {}
  let style = vnode.data.style || {}

  // handle array syntax
  if (Array.isArray(style)) {
    style = vnode.data.style = toObject(style)
  }

  for (name in oldStyle) {
    if (!style[name]) {
      elm.setStyle(normalize(name))
    }
  }
  for (name in style) {
    cur = style[name]
    if (cur !== oldStyle[name]) {
      elm.setStyle(normalize(name), cur)
    }
  }
}

function toObject (arr) {
  const res = arr[0] || {}
  for (var i = 1; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i])
    }
  }
  return res
}

export default {
  create: createStyle,
  update: updateStyle
}
