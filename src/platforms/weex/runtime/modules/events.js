import { updateListeners } from 'core/vdom/helpers'

function updateDOMListeners (oldVnode, vnode) {
  if (!oldVnode.data.on && !vnode.data.on) {
    return
  }
  const on = vnode.data.on || {}
  const oldOn = oldVnode.data.on || {}
  updateListeners(on, oldOn, (event, handler, capture) => {
    if (capture) {
      console.log('Weex do not support event in bubble phase.')
      return
    }
    vnode.elm.addEventListener(event, handler, vnode.context.$options.methodConfig)
  })
}

export default {
  create: updateDOMListeners,
  update: updateDOMListeners
}
