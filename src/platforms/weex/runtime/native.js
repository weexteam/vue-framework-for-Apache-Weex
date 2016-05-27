/**
 * new Node(tagName, data)
 *
 * - instanceId
 * - nodeId
 * - tagName: (read-only)
 *
 * - nextSibling: (read-only)
 * - previousSibling: (read-only)
 *
 * - children[]: (read-only)
 * - index: (read-only)
 *
 * - attr{k: v}: (read-only)
 * - style{k: v}: (read-only)
 * - event{type: handler}: (read-only)
 *
 * - appendChild(child)
 * - insertBefore(target, before)
 * - removeChild(child)
 *
 * - setAttribute(key, value)
 * - setStyle(key, value)
 * - addEventListener(type, handler, ctx)
 *
 * - toJSON()
 */

let latestNodeId = 1
// let hackFirstNode = true

export function Node (tagName, data) {
  data = data || {}
  this.instanceId = ''
  this.nodeId = latestNodeId++
  this.tagName = tagName
  this.attr = data.attr || {}
  this.style = data.style || {}
  this.event = data.event || {}
  this.parentNode = null
  this.nextSibling = null
  this.children = []
  this.attached = false
  this.nodeType = 3 // hack for vnode.elm detection
}

export function TextNode (text) {
  this.instanceId = ''
  this.nodeId = latestNodeId++
  this.parentNode = null
  this.nodeType = 1
  this.text = text
}

Node.prototype.setAttribute = function setAttribute (key, value) {
  if (this.attr[key] === value) {
    return
  }
  if (value == null) {
    delete this.attr[key]
  } else {
    this.attr[key] = value
  }
  if (this.attached) {
    global.callNative(this.instanceId, [{ module: 'dom', method: 'updateAttrs', args: [String(this.nodeId), { [key]: value }] }])
  }
}

Node.prototype.hasAttribute = function setAttribute (key) {
  return !(this[key] == null)
}

Node.prototype.removeAttribute = function setAttribute (key) {
  if (this[key] == null) {
    return
  }
  delete this.attr[key]
  if (this.attached) {
    global.callNative(this.instanceId, [{ module: 'dom', method: 'updateAttr', args: [String(this.nodeId), { [key]: null }] }])
  }
}

Node.prototype.setStyle = function setStyle (key, value) {
  if (this.style[key] === value) {
    return
  }
  if (value == null) {
    delete this.style[key]
  } else {
    this.style[key] = value
  }
  if (this.attached) {
    global.callNative(this.instanceId, [{ module: 'dom', method: 'updateStyle', args: [String(this.nodeId), { [key]: value }] }])
  }
}

Node.prototype.addEventListener = function addEventListener (type, handler, ctx) {
  const events = this.event
  let needAddEvent = false
  if (!events[type]) {
    events[type] = true
    needAddEvent = true
  }
  let descriptor = ctx.events[this.nodeId]
  if (!descriptor) {
    descriptor = ctx.events[this.nodeId] = { context: ctx, el: this, handlers: {}}
  }
  if (!descriptor.handlers[type]) {
    descriptor.handlers[type] = []
  }
  descriptor.handlers[type].push(handler)

  if (this.attached && needAddEvent) {
    global.callNative(this.instanceId, [{ module: 'dom', method: 'addEvent', args: [String(this.nodeId), type] }])
  }
}

Node.prototype.appendChild = function appendChild (child) {
  if (!child) {
    return
  }

  if (child.nodeType === 1) {
    if (this.tagName === 'text') {
      this.setAttribute('value', child.text)
    }
    return
  }

  const children = this.children
  const length = children.length
  const lastChild = children[length - 1]

  // affected: this, child, lastChild
  // x children, parentNode, nextSibling

  // this.parentNode
  // this.nextSibling
  this.children.push(child)

  child.parentNode = this
  // child.nextSibling
  // child.children

  if (lastChild) {
    // lastChild.parentNode
    lastChild.nextSibling = child
    // lastChild.children
  }

  child.attached = this.attached

  if (!child.instanceId && this.instanceId) {
    child.instanceId = this.instanceId
    attachAll(child)
  }

  if (this.attached && !child._uselessNode) {
    if (this.nodeId === '_body') {
      createBody(child)
    } else {
      global.callNative(this.instanceId, [{ module: 'dom', method: 'addElement', args: [String(this.nodeId), child.toJSON(), -1] }])
    }
  }
}

Node.prototype.insertBefore = function insertBefore (target, before) {
  if (!target) {
    return
  }

  if (before && before.nextSibling === target) {
    return
  }

  if (target.nodeType === 1) {
    if (this.tagName === 'text') {
      this.setAttribute('value', target.text)
    }
    return
  }

  if (!target.instanceId && this.instanceId) {
    target.instanceId = this.instanceId
  }

  const children = this.children
  const targetParent = target.parentNode

  // affected: target parent, target before, this, target, before
  // x children, parentNode, nextSibling

  if (targetParent) {
    const targetParentChildren = targetParent && targetParent.children
    const targetIndex = targetParentChildren && targetParentChildren.indexOf(target)
    const targetBefore = targetParentChildren && targetParentChildren[targetIndex - 1]
    const targetAfter = targetParentChildren && targetParentChildren[targetIndex + 1]

    // targetParent.parentNode
    // targetParent.nextSibling
    targetParentChildren.splice(targetIndex, 1)

    if (targetBefore) {
      // targetBefore.parentNode
      targetBefore.nextSibling = targetAfter
      // targetBefore.children
    }
  }

  let beforeIndex = children.indexOf(before)
  if (beforeIndex < 0) {
    beforeIndex = children.length - 1
  }

  // this.parentNode
  // this.nextSibling
  this.children.splice(beforeIndex + 1, null, target)

  target.parentNode = this
  target.nextSibling = children[beforeIndex + 2]
  // target.children

  if (before) {
    // before.parentNode
    before.nextSibling = target
    // before.children
  }

  if (this.attached && target.attached) {
    global.callNative(this.instanceId, [{ module: 'dom', method: 'moveElement', args: [String(target.nodeId), this.nodeId, beforeIndex + 1] }])
  } else if (this.attached && !target.attached) {
    target.attached = true
    attachAll(target)
    if (this.nodeId === '_body') {
      createBody(target)
    } else {
      global.callNative(this.instanceId, [{ module: 'dom', method: 'addElement', args: [String(this.nodeId), target.toJSON(), beforeIndex + 1] }])
    }
  }
}

Node.prototype.removeChild = function removeChild (child) {
  if (!child) {
    return
  }

  const childIndex = this.children.indexOf(child)
  const before = this.children[childIndex - 1]

  // affected: child, this, before
  // x children, parentNode, nextSibling

  child.parentNode = undefined
  child.nextSibling = undefined
  // child.children

  // this.parentNode
  // this.nextSibling
  this.children.splice(childIndex, 1)

  if (before) {
    // before.parentNode
    before.nextSibling = this.children[childIndex]
    // before.children
  }

  if (this.attached && !child._uselessNode) {
    global.callNative(this.instanceId, [{ module: 'dom', method: 'removeElement', args: [String(child.nodeId)] }])
  }

  // todo: remove all node and remove all events
}

Node.prototype.toJSON = function toJSON () {
  var ref = String(this.nodeId)
  var type = this.tagName
  var attr = this.attr
  var style = this.style
  var event = Object.keys(this.event)
  var children = this.children
  return { ref, type, attr, style, event, children: children.map(child => child.toJSON()) }
}

function attachAll (node) {
  const instanceId = node.instanceId
  const attached = node.attached
  node.children.forEach(child => {
    child.instanceId = instanceId
    child.attached = attached
    attachAll(child)
  })
}

function createBody (node) {
  node.nodeId = '_root'
  global.callNative(node.instanceId, [{ module: 'dom', method: 'createBody', args: [node.toJSON()] }])
}

// function detachAll (node) {}
