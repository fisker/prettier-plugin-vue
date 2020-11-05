import {parseForESLint} from 'vue-eslint-parser'
import {AST_FORMAT} from '../constants.mjs'

const options = {
  parser: false,
}

function parse(text) {
  const result = parseForESLint(text, options)
  const document = result.services.getDocumentFragment()
  // I don't like options.originalText
  document.originalText = text
  return document
}

export default {
  parse,
  astFormat: AST_FORMAT,
  locStart() {
    return 0
  },
  locEnd() {
    return 0
  },
}
