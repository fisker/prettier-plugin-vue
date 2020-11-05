import {PARSER_NAME, AST_FORMAT} from './constants.mjs'
import parser from './parser/index.mjs'
import print from './print/index.mjs'

export default {
  languages: [{name: 'vue', parsers: ['vue']}],
  parsers: {
    [PARSER_NAME]: parser,
  },
  printers: {
    [AST_FORMAT]: print,
  },
}
