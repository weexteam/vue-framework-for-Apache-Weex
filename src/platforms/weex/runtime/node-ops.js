import renderer from './config'

export const namespaceMap = {}

export function createElement (tagName) {
  return new renderer.Element(tagName)
}

export function createElementNS (namespace, tagName) {
  return new renderer.Element(namespace + ':' + tagName)
}

export function createTextNode (text) {
  return new renderer.TextNode(text)
}

export function insertBefore (node, target, before) {
  // console.log(`inserting: ${target.type} to ${node.type}`)
  if (target.nodeType === 3) {
    if (node.type === 'text') {
      node.setAttr('value', target.text)
      target.parentNode = node
    }
    return
  }
  node.insertBefore(target, before)
}

export function removeChild (node, child) {
  node.removeChild(child)
}

export function appendChild (node, child) {
  // console.log(`appending: ${child.type} to ${node.type}`)
  if (child.nodeType === 3) {
    if (node.type === 'text') {
      node.setAttr('value', child.text)
      child.parentNode = node
    }
    return
  }

  node.appendChild(child)
}

export function parentNode (node) {
  return node.parentNode
}

export function nextSibling (node) {
  return node.nextSibling
}

export function tagName (node) {
  return node.type
}

export function setTextContent (node, text) {
  node.parentNode.setAttr('value', text)
}

export function childNodes (node) {
  return node.pureChildren
}
