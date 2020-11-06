import {parseForESLint} from 'vue-eslint-parser'
import {AST_FORMAT} from '../constants.mjs'

const options = {
  parser: false,
}

function parse(text) {
  const result = parseForESLint(text, options)
  const document = result.services.getDocumentFragment()
  const [error] = document.errors
  if (error) {
    const {message, lineNumber, column} = error
    const parseError = new SyntaxError(message)
    parseError.loc = {
      start: {line: lineNumber, column: column + 1},
    }
    throw parseError
  }

  return {
    result,
    document,
    text,
  }
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
