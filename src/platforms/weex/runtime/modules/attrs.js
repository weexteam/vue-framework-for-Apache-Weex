function updateAttrs (oldVnode, vnode) {
  if (!oldVnode.data.attrs && !vnode.data.attrs) {
    return
  }
  let key, cur, old
  const elm = vnode.elm
  const oldAttrs = oldVnode.data.attrs || {}
  const attrs = vnode.data.attrs || {}

  for (key in attrs) {
    cur = attrs[key]
    old = oldAttrs[key]
    if (old !== cur) {
      elm.setAttr(key, cur)
    }
  }
  for (key in oldAttrs) {
    if (attrs[key] == null) {
      elm.setAttr(key)
    }
  }
}

export default {
  create: function (_, vnode) {
    const attrs = vnode.data.staticAttrs
    if (attrs) {
      for (let key in attrs) {
        if (!vnode.elm) debugger
        vnode.elm.setAttr(key, attrs[key])
      }
    }
    updateAttrs(_, vnode)
  },
  update: updateAttrs
}
