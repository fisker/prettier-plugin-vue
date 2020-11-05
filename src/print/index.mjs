import prettier from 'prettier'

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

const printESTree = (ast) => {
  const formated = prettier.format('fisker', {
    parser() {
      return {
        type: 'ExpressionStatement',
        expression: removeParent(ast),
      }
    },
    sigleQuote: true,
  })

  return formated
}

const isHTMLVoidElement = (tagName) => tagName === 'img'

function print(path, print) {
  const node = path.getValue()
  const {originalText} = node
  const result = printNode(node)
  return {type: 'concat', parts: [...result]}
}

function* printNode(node) {
  if (!node) {
    return
  }

  const {type, children} = node

  if (type === 'VDocumentFragment') {
    for (const child of children) {
      yield* printNode(child)
    }
    return
  }

  if (type === 'VElement') {
    if (node.name === 'style') {
      console.log({node})
    }
    const {startTag, endTag} = node
    yield* printNode(startTag)
    for (const child of children) {
      yield* printNode(child)
    }

    yield* printNode(endTag)
    return
  }

  if (type === 'VText') {
    return yield node.value
  }

  if (type === 'VStartTag') {
    const {name} = node.parent
    yield '<'
    yield name
    const {attributes} = node
    for (const [index, attribute] of attributes.entries()) {
      yield ' '
      yield* printNode(attribute)
    }
    if (node.selfClosing && !isHTMLVoidElement(name)) {
      yield '/'
    }
    yield '>'
    return
  }

  if (type === 'VAttribute') {
    const {key, value} = node
    yield* printNode(key)
    if (value) {
      yield '='
      yield '"'
      yield* printNode(value)
      yield '"'
    }
    return
  }

  if (type === 'VEndTag') {
    const {name} = node.parent
    yield `</${name}>`
    return
    // console.log(node)
  }

  if (type === 'VExpressionContainer') {
    yield printESTree(node.expression)
    return
  }

  if (type === 'VIdentifier') {
    return yield node.name
  }
  if (type === 'VLiteral') {
    return yield node.value
  }
  if (type === 'VDirectiveKey') {
    const {name, arguments: arguments_, modifier} = node
    yield 'v-'
    yield* printNode(name)
  }
  // console.log({type})
}
export default {
  print,
}
