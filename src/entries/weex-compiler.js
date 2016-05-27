/* @flow */

import { extend, genStaticKeys } from 'shared/util'
import { compile as baseCompile } from 'compiler/index'
import modules from 'weex/compiler/modules/index'
import directives from 'weex/compiler/directives/index'
import { isReservedTag, isUnaryTag, mustUseProp, getTagNamespace } from 'weex/util/index'

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
