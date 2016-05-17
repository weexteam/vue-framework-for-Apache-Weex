import {
  getAndRemoveAttr
} from 'compiler/helpers'

function parse (el, options) {
  const staticStyle = getAndRemoveAttr(el, 'append')
  if (staticStyle === 'tree') {
    el.atom = true
  }
}

function genData (el) {
  return el.atom ? `atom:true,` : ''
}

export default {
  staticKeys: ['atom'],
  parse,
  genData
}
