/* @flow */

import { updateListeners } from 'core/vdom/helpers'

function updateDOMListeners (oldVnode: VNodeWithData, vnode: VNodeWithData) {
  if (!oldVnode.data.on && !vnode.data.on) {
    return
  }
  const on = vnode.data.on || {}
  const oldOn = oldVnode.data.on || {}
  // @todo: removeEvent
  updateListeners(on, oldOn, (event, handler, capture) => {
    if (capture) {
      console.log('Weex do not support event in bubble phase.')
      return
    }
    vnode.elm.addEvent(event, handler.bind(vnode.context))
  })
}

export default {
  create: updateDOMListeners,
  update: updateDOMListeners
}
