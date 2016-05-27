import { Node, TextNode } from './native'

export const namespaceMap = {}

export function createElement (tagName) {
  return new Node(tagName)
}

export function createElementNS (namespace, tagName) {
  return new Node(namespace + ':' + tagName)
}

export function createTextNode (text) {
  return new TextNode(text)
}

export function insertBefore (node, target, before) {
  node.insertBefore(target, before)
}

export function removeChild (node, child) {
  node.removeChild(child)
}

export function appendChild (node, child) {
  node.appendChild(child)
}

export function parentNode (node) {
  return node.parentNode
}

export function nextSibling (node) {
  return node.nextSibling
}

export function tagName (node) {
  return node.tagName
}

export function setTextContent (node, text) {
  node.parentNode.setAttribute('value', text)
}

export function childNodes (node) {
  return node.children
}
