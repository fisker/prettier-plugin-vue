import prettierDocument from 'prettier/doc'

import prettier from 'prettier'

const {
  concat,
  join,
  line,
  softline,
  hardline,
  literalline,
  group,
  conditionalGroup,
  fill,
  lineSuffix,
  lineSuffixBoundary,
  cursor,
  breakParent,
  ifBreak,
  trim,
  indent,
  align,
  addAlignmentToDoc: addAlignmentToDocument,
  markAsRoot,
  dedentToRoot,
  dedent,
} = prettierDocument.builders
const {stripTrailingHardline} = prettierDocument.utils

let i = 0
const uid = () => (i += 1)

const removeParent = (node) => {
  if (Array.isArray(node)) {
    return node.map((node) => removeParent(node))
  }

  if (node && node.type) {
    const a = {}
    for (const [key, value] of Object.entries(node)) {
      if (key !== 'parent') {
        a[key] = removeParent(value)
      }
    }
    return a
  }
  return node
}

const printESTree = (ast, options) => {
  const {formatted} = prettier.__debug.formatAST(
    {
      type: 'Program',
      body: Array.isArray(ast) ? ast : [ast],
    },
    {
      parser: '__vue_expression',
      originalText: options.text,
      singleQuote: true,
      __isInHtmlAttribute: true,
    }
  )

  return formatted.trim()
}

const isHTMLVoidElement = (tagName) => tagName === 'img'

function formatStyle(originalText) {
  const document = prettier.__debug.printToDoc(originalText, {
    parser: 'scss',
  })
  return document
}

function formatScript(originalText) {
  const document = prettier.__debug.printToDoc(originalText, {
    parser: 'babel',
  })
  return document
}

class VuePrinter {
  constructor(result) {
    this.document = result.document

    console
      .log
      // this.document.children[0].children[0].startTag.attributes[0].key
      ()
    this.text = result.text
  }

  toPrettierDocument() {
    const result = this.print(this.document)

    return concat([...result])
  }

  isRootBlock(node) {}

  *print(node) {
    if (!node) {
      return
    }
    const {type} = node
    yield* this[type](node)
  }

  *VDocumentFragment(node) {
    const {children} = node
    for (const child of children) {
      yield* this.print(child)
    }
  }

  *VElement(node) {
    const {startTag, endTag, name, children} = node
    yield* this.print(startTag)

    if (node.children.length === 1 && name === 'style') {
      yield hardline
      yield formatStyle(node.children[0].value)
    } else if (node.children.length === 1 && name === 'script') {
      yield hardline
      yield formatScript(node.children[0].value)
    } else {
      for (const child of children) {
        if (child.type === 'VText') {
          yield child.value.trim()
        } else if (child.type === 'VElement') {
          yield softline
          const element = concat([line, ...this.print(child)])
          yield indent(group(element))
        } else {
          yield softline
          yield* this.print(child)
        }
      }
    }
    yield softline
    yield* this.print(endTag)
  }

  *VText(node) {
    yield node.value
  }

  *VStartTag(node) {
    const {name} = node.parent

    const parts = ['<', name]
    const printedAttributes = []
    for (const attribute of node.attributes) {
      parts.push(line, ...this.print(attribute))
    }
    const closing = node.selfClosing && !isHTMLVoidElement(name) ? '/>' : '>'
    parts.push(closing)
    yield group(concat([ifBreak(indent(concat(parts)), concat(parts))]))
  }

  *VAttribute(node) {
    const {key, value} = node
    yield* this.print(key)
    if (value) {
      yield '='
      yield '"'
      yield* this.print(value)
      yield '"'
    }
  }

  *VEndTag(node) {
    const {name} = node.parent
    yield `</${name}>`
  }

  *VExpressionContainer(node) {
    if (node.parent.type === 'VElement') {
      yield '{{'
    }
    if (
      node.expression.type === 'VOnExpression' ||
      node.expression.type === 'VForExpression'
    ) {
      yield* this.print(node.expression)
    } else {
      yield printESTree(node.expression, {text: this.text})
    }
    if (node.parent.type === 'VElement') {
      yield '}}'
    }
  }

  *VOnExpression(node) {
    yield printESTree(node.body, {text: this.text})
  }

  *VForExpression(node) {
    yield printESTree(node.left, {text: this.text})
    yield ' of '
    yield printESTree(node.right, {text: this.text})
  }

  *VIdentifier(node) {
    yield node.name
  }

  *VLiteral(node) {
    yield node.value
  }

  *VDirectiveKey(node) {
    const {name, rawName, argument, modifier} = node
    if (
      name.type === 'VIdentifier' &&
      name.name === 'bind' &&
      name.rawName === ':'
    ) {
      yield ':'
    } else if (
      name.type === 'VIdentifier' &&
      name.name === 'on' &&
      name.rawName === '@'
    ) {
      yield '@'
    } else {
      yield 'v-'
      yield* this.print(name)
    }
    if (argument) {
      yield* this.print(argument)
    }
  }
}

function print(path, print) {
  const parseResult = path.getValue()
  const printer = new VuePrinter(parseResult)
  return printer.toPrettierDocument()
}

export default {
  print,
}
