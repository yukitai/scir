import { Span } from "../iem.ts";
import { Token } from "./lexer.ts";

abstract class Node {

    span: Span

    constructor (span: Span) {
        this.span = span
    }
}

class File extends Node {
    
    tok_package: Token
    tok_packageName: Token
    items: Item[]

    constructor (
        items: Item[],
        tok_package: Token,
        tok_packageName: Token,
        span: Span
    ) {
        super(span)
        this.items = items
        this.tok_package = tok_package
        this.tok_packageName = tok_packageName
    }
}

type Item = VariableDeclaration
          | FunctionDeclaration
          | TypeDeclaration
          | ImportStmt

class VariableDeclaration extends Node {

    tok_var: Token
    tok_name: Token
    // TODO: Type and Initializer

    constructor (
        tok_var: Token,
        tok_name: Token,
        span: Span,
    ) {
        super(span)
        this.tok_var = tok_var
        this.tok_name = tok_name
    }
}

class FunctionDeclaration extends Node {

    attributes: Attribute[]

    constructor (
        attributes: Attribute[],
        span: Span
    ) {
        super(span)
        this.attributes = attributes
    }
}

class TypeDeclaration extends Node {
    constructor (
        span: Span,
    ) {
        super(span)
    }
}

class ImportStmt extends Node {
    constructor (span: Span) {
        super(span)
    }
}

class Attribute extends Node {

    tok_hash: Token
    tok_lbracket: Token
    // TODO: Attribute Inner
    tok_rbracket: Token
    constructor (
        tok_hash: Token,
        tok_lbracket: Token,
        tok_rbracket: Token,
        span: Span,
    ) {
        super(span)
        this.tok_hash = tok_hash
        this.tok_lbracket = tok_lbracket
        this.tok_rbracket = tok_rbracket
    }
}

export {
    type Item,
    Node,
    File,
    VariableDeclaration,
    FunctionDeclaration,
    TypeDeclaration,
    Attribute,
    ImportStmt,
}