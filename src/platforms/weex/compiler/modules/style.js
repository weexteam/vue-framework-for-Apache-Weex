import { cached, camelize } from 'shared/util'
import { parseText } from 'compiler/parser/text-parser'
import {
  getAndRemoveAttr,
  getBindingAttr
} from 'compiler/helpers'

const normalize = cached(function (prop) {
  return camelize(prop)
})

function transformNode (el, options) {
  const staticStyle = getAndRemoveAttr(el, 'style')
  const { dynamic, styleResult } = parseStaticStyle(staticStyle, options)
  if (!dynamic && styleResult) {
    el.staticStyle = styleResult
  }
  const styleBinding = getBindingAttr(el, 'style', false /* getStatic */)
  if (styleBinding) {
    el.styleBinding = styleBinding
  } else if (dynamic) {
    el.styleBinding = styleResult
  }
}

function genData (el) {
  let data = ''
  if (el.staticStyle) {
    data += `staticStyle:${el.staticStyle},`
  }
  if (el.styleBinding) {
    data += `style:${el.styleBinding},`
  }
  return data
}

function parseStaticStyle (staticStyle, options) {
  // "width: 200px; height: 200px;" -> {width: 200, height: 200}
  // "width: 200px; height: {{y}}" -> {width: 200, height: y}
  let dynamic = false
  let styleResult = ''
  if (staticStyle) {
    const styleList = staticStyle.trim().split(';').map(style => {
      const result = style.trim().split(':')
      if (result.length !== 2) {
        return
      }
      const key = normalize(result[0].trim())
      const value = result[1].trim()
      const dynamicValue = parseText(value, options.delimiters)
      if (dynamicValue) {
        dynamic = true
        return key + ':' + dynamicValue
      }
      return key + ':' + JSON.stringify(value)
    }).filter(result => result)
    if (styleList.length) {
      styleResult = '{' + styleList.join(',') + '}'
    }
  }
  return { dynamic, styleResult }
}

export default {
  staticKeys: ['staticStyle'],
  transformNode,
  genData
}
