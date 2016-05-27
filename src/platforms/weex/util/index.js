import { makeMap } from 'shared/util'
import { Node } from '../runtime/native'

export const isReservedTag = makeMap(
  'div,img,image,input,switch,indicator,list,scroller,cell,template,text,slider,image'
)
export function isUnaryTag () { /* console.log('isUnaryTag') */ }
export function mustUseProp () { /* console.log('mustUseProp') */ }
export function getTagNamespace () { /* console.log('getTagNamespace') */ }
export function isUnknownElement () { /* console.log('isUnknownElement') */ }
export function query (el, instanceId) {
  const body = new Node(el)
  body.instanceId = instanceId
  body.nodeId = '_body'
  body.attached = true
  const root = new Node('div')
  root._uselessNode = true // hack, it'a uselessNode for weex
  body.appendChild(root)
  return root
}
