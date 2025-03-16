import { indented, Span } from "../iem.ts";
import { IR } from "../ir.ts";
import { IRGroup } from "../irs/group.ts";
import { previewToken, Token, TokenType } from "./lexer.ts";

abstract class Node {

    span: Span

    constructor (span: Span) {
        this.span = span
    }

    abstract generate (): IR
    abstract preview (indent: number): string
    
    generateNullable (): IR | null {
        return this.generate()
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
        span: Span,
    ) {
        super(span)
        this.items = items
        this.tok_package = tok_package
        this.tok_packageName = tok_packageName
    }

    override generate(): IR {
        const stacks = this.items
                           .map((item) => item.generateNullable())
                           .filter((it) => it !== null)
        return new IRGroup(stacks, this.span)
    }

    override preview (indent: number = 0): string {
        let result = indented(indent, "File(\n")
        for (const item of this.items) {
            result += item.preview(indent + 1)
            result += ",\n"
        }
        return result + indented(indent, ")")
    }
}

abstract class Stmt extends Node {}

type Item = VariableDeclaration
          | FunctionDeclaration
          | TypeDeclaration
          | ImportStmt

abstract class VariableDeclaration extends Stmt {

    tok_name: Token
    type: Type
    value: Expr

    constructor (
        tok_name: Token,
        type: Type,
        value: Expr,
        span: Span,
    ) {
        super(span)
        this.tok_name = tok_name
        this.type = type
        this.value = value
    }

    override generate(): IR {
        throw new Error("Method not implemented.")
    }
}
class LongVariableDeclaration extends VariableDeclaration {

    tok_var: Token
    tok_assign: Token

    constructor (
        tok_var: Token,
        tok_name: Token,
        type: Type,
        tok_assign: Token,
        value: Expr,
        span: Span,
    ) {
        super(tok_name, type, value, span)
        this.tok_var = tok_var
        this.tok_assign = tok_assign
    }

    override preview(indent: number): string {
        let result = indented(indent, "LongVariableDeclaration(\n")
        result += indented(indent + 1, `tok_var:    ${previewToken(this.tok_var)},\n`)
        result += indented(indent + 1, `tok_name:   ${previewToken(this.tok_name)},\n`)
        result += indented(indent + 1, `type:\n${this.type?.preview(indent + 2) ?? "(null)"},\n`)
        result += indented(indent + 1, `tok_assign: ${previewToken(this.tok_assign)},\n`)
        result += indented(indent + 1, `value:\n${this.value.preview(indent + 2)},\n`)
        return result + indented(indent, ")")
    }
}

class ShortVariableDeclaration extends VariableDeclaration {

    tok_shortdef: Token

    constructor (
        tok_name: Token,
        type: Type,
        tok_shortdef: Token,
        value: Expr,
        span: Span,
    ) {
        super(tok_name, type, value, span)
        this.tok_shortdef = tok_shortdef
    }

    override preview(indent: number): string {
        let result = indented(indent, "ShortVariableDeclaration(\n")
        result += indented(indent + 1, `tok_name:     ${previewToken(this.tok_name)},\n`)
        result += indented(indent + 1, `type:\n${this.type?.preview(indent + 2) ?? "(null)"},\n`)
        result += indented(indent + 1, `tok_shortdef: ${previewToken(this.tok_shortdef)},\n`)
        result += indented(indent + 1, `value:\n${this.value.preview(indent + 2)},\n`)
        return result + indented(indent, ")")
    }
}

abstract class Type extends Node {

    abstract formatType (): string
    abstract size(): number | null
    abstract requireTypeSatisfied (type: Type): boolean

    isSized(): boolean {
        return this.size() !== null
    }

    override generate(): IR {
        throw new Error("unreachable")
    }
}

const isUnresolvedType = (type: Type): boolean => {
    return type instanceof UnknownType && type.resolved === null
}

const getResolvedType = (type: Type): Type => {
    if (type instanceof UnknownType && type.resolved !== null)
        return type.resolved
    return type
}
class UnknownType extends Type {

    resolved: Type | null
    
    constructor (span: Span) {
        super(span)
        this.resolved = null
    }

    override formatType(): string {
        if (this.resolved)
            return this.resolved.formatType()
        return "?"
    }

    override size(): number | null {
        return null
    }

    override requireTypeSatisfied(type: Type): boolean {
        if (isUnresolvedType(type) && this.resolved) {
            (type as UnknownType).resolved = this.resolved
            return true
        }
        type = getResolvedType(type)
        if (type instanceof UnknownType) {
            return true
        }
        if (!this.resolved) {
            this.resolved = type
            return true
        }
        return this.resolved.requireTypeSatisfied(type)
    }

    override preview(indent: number): string {
        if (!this.resolved) return indented(indent, "Type(?)")
        return indented(indent, "Type(\n")
             + this.resolved.preview(indent + 1) + ",\n"
             + indented(indent, ")")
    }
}

class BinaryType extends Type {

    tok_name: Token

    constructor (
        tok_name: Token,
        span: Span,
    ) {
        super(span)
        this.tok_name = tok_name
    }

    override formatType(): string {
        return this.tok_name.value
    }

    override size(): number | null {
        return 1
    }

    override requireTypeSatisfied (type: Type): boolean {
        if (isUnresolvedType(type)) {
            (type as UnknownType).resolved = this
            return true
        }
        type = getResolvedType(type)
        if (type instanceof BinaryType) {
            return type.tok_name.type === this.tok_name.type
        }
        return false
    }

    override preview(indent: number): string {
        return indented(indent, `BinaryType(${this.tok_name.value})`)
    }
}

class NilType extends Type {

    tok_nil?: Token

    constructor (
        tok_nil: Token | undefined,
        span: Span,
    ) {
        super(span)
        this.tok_nil = tok_nil
    }

    override formatType(): string {
        return "nil"
    }

    override size(): number | null {
        return 0
    }

    override requireTypeSatisfied (type: Type): boolean {
        if (isUnresolvedType(type)) {
            (type as UnknownType).resolved = this
            return true
        }
        type = getResolvedType(type)
        return type instanceof NilType
    }

    override preview(indent: number): string {
        return indented(indent, "NilType")
            + (this.tok_nil ? "(" + previewToken(this.tok_nil) + ")" : "")
    }
}

type ArgumentGroup = {
    names: Token[],
    type: Type,
    tok_comma?: Token,
}

class ArgumentList extends Node {

    tok_lparen: Token
    groups: ArgumentGroup[]
    tok_rparen: Token

    constructor (
        tok_lparen: Token,
        groups: ArgumentGroup[],
        tok_rparen: Token,
        span: Span,
    ) {
        super(span)
        this.tok_lparen = tok_lparen
        this.groups = groups
        this.tok_rparen = tok_rparen
    }

    queryTypeByName (name: string): Type | null {
        for (const group of this.groups) {
            for (const tok_name of group.names) {
                if (tok_name.value === name) {
                    return group.type
                }
            }
        }
        return null
    }

    override generate(): IR {
        throw new Error("unreachable")
    }

    override generateNullable(): IR | null {
        return null
    }

    override preview(indent: number): string {
        let result = indented(indent, "ArgumentList(\n")
        result += indented(indent + 1, `tok_lparen: ${previewToken(this.tok_lparen)},\n`)
        this.groups.forEach((group) => {
            group.names.forEach((name) => {
                result += indented(indent + 1, `ArgumentPair(\n`)
                result += indented(indent + 2, `tok_name: ${previewToken(name)},\n`)
                result += indented(indent + 2, `type:\n${group.type.preview(indent + 3)},\n`)
                result += indented(indent + 1, `),\n`)
            })
        })
        result += indented(indent + 1, `tok_rparen: ${previewToken(this.tok_rparen)},\n`)
        return result + indented(indent, ")")
    }
}

class Block extends Stmt {

    tok_lbrace: Token
    stmts: Stmt[]
    tok_rbrace: Token

    constructor (
        tok_lbrace: Token,
        stmts: Stmt[],
        tok_rbrace: Token,
        span: Span,
    ) {
        super(span)
        this.tok_lbrace = tok_lbrace
        this.stmts = stmts
        this.tok_rbrace = tok_rbrace
    }

    override generate(): IR {
        throw new Error("Method not implemented.")
    }

    override preview(indent: number): string {
        let result = indented(indent, "Block(\n")
        result += indented(indent + 1, `tok_lbrace: ${previewToken(this.tok_lbrace)},\n`)
        result += indented(indent + 1, `stmts: [\n`)
        this.stmts.forEach((stmt) => {
            result += stmt.preview(indent + 2)
            result += ",\n"
        })
        result += indented(indent + 1, `],\n`)
        result += indented(indent + 1, `tok_rbrace: ${previewToken(this.tok_rbrace)},\n`)
        return result + indented(indent, ")")
    }
}

class ReturnStmt extends Stmt {

    tok_return: Token
    expr?: Expr

    constructor (
        tok_return: Token,
        expr: Expr | undefined,
        span: Span,
    ) {
        super(span)
        this.tok_return = tok_return
        this.expr = expr
    }

    override generate(): IR {
        throw new Error("Method not implemented.")
    }

    override preview(indent: number): string {
        let result = indented(indent, "ReturnStmt(\n")
        result += indented(indent + 1, `tok_return: ${previewToken(this.tok_return)},\n`)
        result += indented(indent + 1, `expr:\n`)
        result += this.expr ? this.expr.preview(indent + 2) : "(null)"
        result += ",\n"
        return result + indented(indent, ")")
    }
}

class FunctionDeclaration extends Node {

    attributes: Attribute[]
    tok_func: Token
    tok_name: Token
    args: ArgumentList
    ret_t: Type
    body: Block

    constructor (
        attributes: Attribute[],
        tok_func: Token,
        tok_name: Token,
        args: ArgumentList,
        ret_t: Type,
        block: Block,
        span: Span,
    ) {
        super(span)
        this.attributes = attributes
        this.tok_func = tok_func
        this.tok_name = tok_name
        this.args = args
        this.ret_t = ret_t
        this.body = block
    }

    override generate(): IR {
        throw new Error("Method not implemented.")
    }

    override preview(indent: number): string {
        let result = indented(indent, "FunctionDeclaration(\n")
        this.attributes.forEach((attr) => {
            result += indented(indent + 1, attr.preview(indent + 2))
            result += ",\n"
        })
        result += indented(indent + 1, `tok_func: ${previewToken(this.tok_func)},\n`)
        result += indented(indent + 1, `tok_name: ${previewToken(this.tok_name)},\n`)
        result += this.args.preview(indent + 1) + ",\n"
        result += indented(indent + 1, `ret_t:\n${this.ret_t.preview(indent + 2)},\n`)
        result += indented(indent + 1, `body:\n${this.body.preview(indent + 2)},\n`)
        return result + indented(indent, ")")
    }
}

class TypeDeclaration extends Node {

    tok_type: Token
    tok_name: Token
    tok_assign: Token
    type: Type

    constructor (
        tok_type: Token,
        tok_name: Token,
        tok_assign: Token,
        type: Type,
        span: Span,
    ) {
        super(span)
        this.tok_type = tok_type
        this.tok_name = tok_name
        this.tok_assign = tok_assign
        this.type = type
    }

    override generate(): IR {
        throw new Error("unreachable")
    }

    override generateNullable(): IR | null {
        return null
    }

    override preview(indent: number): string {
        let result = indented(indent, "TypeDeclaration(\n")
        result += indented(indent + 1, `tok_type:   ${previewToken(this.tok_type)},\n`)
        result += indented(indent + 1, `tok_name:   ${previewToken(this.tok_name)},\n`)
        result += indented(indent + 1, `tok_assign: ${previewToken(this.tok_assign)},\n`)
        result += indented(indent + 1, `type:\n${this.type.preview(indent + 2)},\n`)
        return result + indented(indent, ")")
    }
}

class ImportStmt extends Node {
    
    tok_import: Token
    tok_lparen?: Token
    tok_paths: Token[]
    tok_rparen?: Token

    constructor (
        tok_import: Token,
        tok_lparen: Token | undefined,
        tok_paths: Token[],
        tok_rparen: Token | undefined,
        span: Span,
    ) {
        super(span)
        this.tok_import = tok_import
        this.tok_lparen = tok_lparen
        this.tok_paths = tok_paths
        this.tok_rparen = tok_rparen
    }

    override generate(): IR {
        throw new Error("unreachable")
    }

    override generateNullable(): IR | null {
        return null
    }

    override preview(indent: number): string {
        let result = indented(indent, "ImportStmt(\n")
        result += indented(indent + 1, `tok_import: ${previewToken(this.tok_import)},\n`)
        result += indented(indent + 1, `tok_lparen: ${this.tok_lparen ? previewToken(this.tok_lparen) : "(null)"},\n`)
        result += indented(indent + 1, `tok_path:   [\n`)
        for (const tok_path of this.tok_paths) {
            result += indented(indent + 2, `${previewToken(tok_path)},\n`)
        }
        result += indented(indent + 1, `],\n`)
        result += indented(indent + 1, `tok_rparen: ${this.tok_rparen ? previewToken(this.tok_rparen) : "(null)"},\n`)
        return result + indented(indent, ")")
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

    override generate(): IR {
        throw new Error("unreachable")
    }

    override preview(indent: number): string {
        let result = indented(indent, "Attribute(\n")
        result += indented(indent + 1, `tok_hash:     ${previewToken(this.tok_hash)},\n`)
        result += indented(indent + 1, `tok_lbracket: ${previewToken(this.tok_lbracket)},\n`)
        result += indented(indent + 1, `tok_rbracket: ${previewToken(this.tok_rbracket)},\n`)
        return result + indented(indent, ")")
    }
}

type Value = string | number | boolean

abstract class Expr extends Node {

    type: Type

    constructor (span: Span) {
        super(span)
        this.type = new UnknownType(span)
    }

    abstract isConst(): boolean
    abstract tryEvaluate(): Value | null
}

class ExprAssign extends Expr {

    left: Expr
    tok_assign: Token
    right: Expr

    constructor (
        left: Expr,
        tok_assign: Token,
        right: Expr,
        span: Span,
    ) {
        super(span)
        this.left = left
        this.tok_assign = tok_assign
        this.right = right
    }

    override isConst(): boolean {
        return false
    }

    override tryEvaluate(): Value | null {
        return null
    }

    override generate(): IR {
        throw new Error("Method not implemented.")
    }

    override preview(indent: number): string {
        return indented(indent, "ExprAssign(\n")
             + indented(indent + 1, "left:\n")
             + this.left.preview(indent + 2) + ",\n"
             + indented(indent + 1, `tok_assign: ${previewToken(this.tok_assign)}`) + ",\n"
             + indented(indent + 1, "right:\n")
             + this.right.preview(indent + 2) + ",\n"
             + indented(indent + 1, "type:\n")
             + this.type.preview(indent + 2) + ",\n"
             + indented(indent, ")")
    }
}

class ExprDot extends Expr {

    left: Expr
    tok_dot: Token
    right: Token

    constructor (
        left: Expr,
        tok_dot: Token,
        right: Token,
        span: Span,
    ) {
        super(span)
        this.left = left
        this.tok_dot = tok_dot
        this.right = right
    }

    override isConst(): boolean {
        return false
    }

    override tryEvaluate(): Value | null {
        return null
    }

    override generate(): IR {
        throw new Error("Method not implemented.")
    }

    override preview(indent: number): string {
        return indented(indent, "ExprAssign(\n")
             + indented(indent + 1, "left:\n")
             + this.left.preview(indent + 2) + ",\n"
             + indented(indent + 1, `tok_dot: ${previewToken(this.tok_dot)}`) + ",\n"
             + indented(indent + 1, `right:   ${previewToken(this.right)}`) + ",\n"
             + indented(indent + 1, "type:\n")
             + this.type.preview(indent + 2) + ",\n"
             + indented(indent, ")")
    }
}

class ExprBinaryOp extends Expr {

    left: Expr
    op: Token
    right: Expr

    constructor (
        left: Expr,
        op: Token,
        right: Expr,
        span: Span,
    ) {
        super(span)
        this.left = left
        this.op = op
        this.right = right
    }

    override isConst(): boolean {
        return this.left.isConst() && this.right.isConst()
    }

    override tryEvaluate(): Value | null {
        const left = this.left.tryEvaluate()
        const right = this.right.tryEvaluate()
        if (left === null || right === null) {
            return null
        }
        return left // TODO: implement binary op
    }

    override generate(): IR {
        throw new Error("Method not implemented.")
    }

    override preview(indent: number): string {
        return indented(indent, "ExprBinaryOp(\n")
             + indented(indent + 1, "left:\n")
             + this.left.preview(indent + 2) + ",\n"
             + indented(indent + 1, `op: ${previewToken(this.op)}`) + ",\n"
             + indented(indent + 1, "right:\n")
             + this.right.preview(indent + 2) + ",\n"
             + indented(indent + 1, "type:\n")
             + this.type.preview(indent + 2) + ",\n"
             + indented(indent, ")")
    }
}

class ExprUnaryOp extends Expr {

    op: Token
    expr: Expr

    constructor (
        op: Token,
        expr: Expr,
        span: Span,
    ) {
        super(span)
        this.op = op
        this.expr = expr
    }
    
    override isConst(): boolean {
        return this.expr.isConst()
    }

    override tryEvaluate(): Value | null {
        const value = this.expr.tryEvaluate()
        if (value === null) {
            return null
        }
        return value // TODO: implement binary op
    }

    override generate(): IR {
        throw new Error("Method not implemented.")
    }

    override preview(indent: number): string {
        return indented(indent, "ExprUnaryOp(\n")
             + indented(indent + 1, `op: ${previewToken(this.op)}`) + ",\n"
             + indented(indent + 1, "expr:\n")
             + this.expr.preview(indent + 2) + ",\n"
             + indented(indent + 1, "type:\n")
             + this.type.preview(indent + 2) + ",\n"
             + indented(indent, ")")
    }
}

type ExprBinary = ExprLiteral | ExprVariable | ExprGroup

class ExprVariable extends Expr {
    
    variable: Token

    constructor (variable: Token, span: Span) {
        super(span)
        this.variable = variable
    }

    override isConst(): boolean {
        return false
    }

    override tryEvaluate(): Value | null {
        return null
    }

    override generate(): IR {
        throw new Error("Method not implemented.")
    }

    override preview(indent: number): string {
        return indented(indent, `ExprVariable(${previewToken(this.variable)})`)
    }
}

abstract class ExprLiteral extends Expr {

    value: Token

    constructor (value: Token, span: Span) {
        super(span)
        this.value = value
    }

    override isConst(): boolean {
        return true
    }

    override generate(): IR {
        throw new Error("Method not implemented.")
    }

    override preview(indent: number): string {
        return indented(indent, `ExprLiteral(\n`)
             + indented(indent + 1, `value: ${previewToken(this.value)}`) + ",\n"
             + indented(indent + 1, `type:\n`)
             + this.type.preview(indent + 2) + ",\n"
             + indented(indent, ")")
    }
}

class ExprLiteralNumber extends ExprLiteral {
    constructor (value: Token, span: Span) {
        super(value, span)
    }

    override tryEvaluate(): Value | null {
        return parseFloat(this.value.value)
    }
}

class ExprLiteralString extends ExprLiteral {
    constructor (value: Token, span: Span) {
        super(value, span)
    }

    override tryEvaluate(): Value | null {
        return eval(this.value.value)
    }
}

class ExprLiteralBool extends ExprLiteral {
    constructor (value: Token, span: Span) {
        super(value, span)
    }

    override tryEvaluate(): Value | null {
        return this.value.type === TokenType.KTrue
    }
}

class ExprGroup extends Expr {
    
    tok_lparen: Token
    expr: Expr
    tok_rparen: Token

    constructor (
        tok_lparen: Token,
        expr: Expr,
        tok_rparen: Token,
        span: Span,
    ) {
        super(span)
        this.tok_lparen = tok_lparen
        this.expr = expr
        this.tok_rparen = tok_rparen
    }

    override generate(): IR {
        throw new Error("Method not implemented.")
    }

    override preview(indent: number): string {
        return indented(indent, "ExprGroup(\n")
             + indented(indent + 1, `tok_lparen: ${previewToken(this.tok_lparen)}`) + ",\n"
             + indented(indent + 1, "expr:\n")
             + this.expr.preview(indent + 2) + ",\n"
             + indented(indent + 1, `tok_rparen: ${previewToken(this.tok_lparen)}`) + ",\n"
             + indented(indent + 1, "type:\n")
             + this.type.preview(indent + 2) + ",\n"
             + indented(indent, ")")
    }

    override isConst(): boolean {
        return this.expr.isConst()
    }

    override tryEvaluate(): Value | null {
        return this.expr.tryEvaluate()
    }
}

class ExprCall extends Expr {

    callee: Expr
    tok_lparen: Token
    args: Expr[]
    tok_rparen: Token

    constructor (
        callee: Expr,
        tok_lparen: Token,
        args: Expr[],
        tok_rparen: Token,
        span: Span,
    ) {
        super(span)
        this.callee = callee
        this.tok_lparen = tok_lparen
        this.args = args
        this.tok_rparen = tok_rparen
    }

    override isConst(): boolean {
        return false
    }

    override tryEvaluate(): Value | null {
        return null
    }
    override generate(): IR {
        throw new Error("Method not implemented.")
    }

    override preview(indent: number): string {
        return indented(indent, "ExprCall(\n")
             + indented(indent + 1, "callee:\n")
             + this.callee.preview(indent + 2) + ",\n"
             + indented(indent + 1, `tok_lparen: ${previewToken(this.tok_lparen)}`) + ",\n"
             + indented(indent + 1, "args: [\n")
             + this.args.map((arg) => arg.preview(indent + 2) + ",").join("\n") + "\n"
             + indented(indent + 1, "]") + ",\n"
             + indented(indent + 1, `tok_rparen: ${previewToken(this.tok_rparen)}`) + ",\n"
             + indented(indent + 1, "type:\n")
             + this.type.preview(indent + 2) + ",\n"
             + indented(indent, ")")
    }
}

class ExprStmt extends Stmt {
    
    expr: Expr

    constructor (
        expr: Expr,
        span: Span,
    ) {
        super(span)
        this.expr = expr
    }

    override generate(): IR {
        throw new Error("Method not implemented.")
    }

    override preview(indent: number): string {
        return indented(indent, "ExprStmt(\n")
             + this.expr.preview(indent + 1) + ",\n"
             + indented(indent, ")")
    }
}

export {
    type Item,
    type ArgumentGroup,
    type Value,
    type ExprBinary,
    Node,
    File,
    VariableDeclaration,
    LongVariableDeclaration,
    ShortVariableDeclaration,
    FunctionDeclaration,
    TypeDeclaration,
    Attribute,
    ImportStmt,
    Type,
    ArgumentList,
    Expr,
    Block,
    Stmt,
    ExprStmt,
    BinaryType,
    NilType,
    ReturnStmt,
    ExprLiteral,
    ExprLiteralBool,
    ExprLiteralNumber,
    ExprLiteralString,
    ExprVariable,
    ExprGroup,
    ExprBinaryOp,
    ExprAssign,
    ExprUnaryOp,
    ExprCall,
    ExprDot,
    UnknownType,
}