/* flow */

import { extend } from 'shared/util'
import { compile as baseCompile } from 'compiler/index'
import modules from 'weex/compiler/modules/index'
import directives from 'weex/compiler/directives/index'
import { isReservedTag, isUnaryTag, mustUseProp, getTagNamespace } from 'weex/util'

const baseOptions: CompilerOptions = {
  expectHTML: false,
  preserveWhitespace: false,
  modules,
  staticKeys: genStaticKeys(modules),
  directives,
  isReservedTag,
  isUnaryTag,
  mustUseProp,
  getTagNamespace
}

export function compile (
  template: string,
  options?: CompilerOptions
): { render: string, staticRenderFns: Array<string> } {
  options = options
    ? extend(extend({}, baseOptions), options)
    : baseOptions
  return baseCompile(template, options)
}

function genStaticKeys (modules: Array<ModuleOptions>): string {
  let keys = []
  if (modules) {
    modules.forEach(module => {
      const staticKeys = module.staticKeys
      if (staticKeys && staticKeys.length) {
        keys = keys.concat(staticKeys)
      }
    })
  }
  return keys.join(',')
}
