import { mergeSpan } from "../iem.ts";
import { createSpanView, LogLevel } from "../iem.ts";
import { iem } from "../iem.ts";
import { LongVariableDeclaration } from "./ast.ts";
import { ArgumentGroup, ArgumentList, Attribute, UnknownType, BinaryType, Block, Expr, ExprAssign, ExprBinary, ExprBinaryOp, ExprCall, ExprDot, ExprGroup, ExprLiteralBool, ExprLiteralNumber, ExprLiteralString, ExprStmt, ExprUnaryOp, ExprVariable, File, FunctionDeclaration, ImportStmt, Item, NilType, ReturnStmt, Stmt, Type } from "./ast.ts";
import { Token, TokenType } from "./lexer.ts";
import { Stream } from "./stream.ts";

class Parser extends Stream<Token> {

    hasError = false
    
    constructor (tokenStream: Token[]) {
        super(tokenStream)
    }

    expectNext(tokenType: TokenType): Token | null {
        const token = this.peek()
        if (token.type !== tokenType) {
            return null
        }
        return this.next()
    }

    expectNextOrError(tokenType: TokenType, costumItemName?: string): Token | null {
        const token = this.peek()
        if (token.type !== tokenType) {
            this.hasError = true
            iem(
                LogLevel.Error,
                `expected ${costumItemName ?? tokenType}, found ${token.type}`,
                createSpanView(
                    [
                        { ...token.span },
                    ],
                    0,
                )
            )
            return null
        }
        return this.next()
    }

    restore (): void {
        this.ignore(1)
        while (this.hasNext()) {
            switch (this.peek().type) {
                case TokenType.KImport:
                case TokenType.KType:
                case TokenType.KFunc:
                case TokenType.Hash:
                case TokenType.KVar:
                    return
            }
            this.ignore(1)
        }
    }

    parse (): File | null {
        return this.parseFile()
    }

    parseFile (): File | null {
        const tok_package = this.expectNextOrError(TokenType.KPackage)
        if (tok_package === null) return null
        const tok_name = this.expectNextOrError(TokenType.Identifier)
        if (tok_name === null) return null

        const items = []
        while (this.hasNext()) {
            const item = this.parseItem()
            if (item === null) {
                this.restore()
                continue
            }
            items.push(item)
        }

        return new File(
            items,
            tok_package,
            tok_name, 
            mergeSpan(tok_package.span, tok_name.span),
        )
    }

    parseItem (attr?: Attribute[]): Item | null {
        const leader = this.peek()
        switch (leader.type) {
            case TokenType.KImport:
                return this.parseImport()
            case TokenType.KType:
                return this.parseTypeDeclaration()
            case TokenType.KFunc:
                return this.parseFunctionDeclaration(attr ?? [])
            case TokenType.Hash:
                return this.parseAttributedItem()
            case TokenType.KVar:
                return this.parseLongVariableDeclaration()
            default:
                this.expectNextOrError(TokenType.KImport, "Item")
                return null
        }
    }

    parseImport (): Item | null {
        const tok_import = this.expectNextOrError(TokenType.KImport)
        if (tok_import === null) return null
        const tok_lparen = this.expectNext(TokenType.LParen)
        if (tok_lparen === null) {
            const tok_path = this.expectNextOrError(TokenType.String, "LParen or Path")
            if (tok_path === null) return null
            return new ImportStmt(
                tok_import,
                undefined,
                [ tok_path ],
                undefined,
                mergeSpan(tok_import.span, tok_path.span),
            )
        }
        const paths = []
        while (this.hasNext() && this.peek().type !== TokenType.RParen) {
            const tok_path = this.expectNextOrError(TokenType.String, "Path")
            if (tok_path === null) return null
            paths.push(tok_path)
        }
        const tok_rparen = this.expectNextOrError(TokenType.RParen)
        if (tok_rparen === null) return null
        return new ImportStmt(
            tok_import,
            tok_lparen,
            paths,
            tok_rparen,
            mergeSpan(tok_import.span, tok_rparen.span),
        )
    }

    parseTypeDeclaration (): Item | null {
        const tok_type = this.expectNextOrError(TokenType.KType)
        if (tok_type === null) return null
        const tok_name = this.expectNextOrError(TokenType.Identifier)
        if (tok_name === null) return null
        return null
    }

    parseFunctionDeclaration (attrs: Attribute[]): Item | null {
        const tok_func = this.expectNextOrError(TokenType.KFunc)
        if (tok_func === null) return null
        const tok_name = this.expectNextOrError(TokenType.Identifier)
        if (tok_name === null) return null
        const args = this.parseArgumentList()
        if (args === null) return null
        let ret_t: Type | null
        if (this.peek().type === TokenType.LBrace) {
            ret_t = new NilType(undefined, mergeSpan(tok_func.span, args.span))
        } else {
            ret_t = this.parseType()
            if (ret_t === null) return null
        }
        const body = this.parseBlock()
        if (body === null) return null
        return new FunctionDeclaration(
            attrs,
            tok_func,
            tok_name,
            args,
            ret_t,
            body,
            mergeSpan(tok_func.span, body.span),
        )
    }

    parseAttributedItem (): Item | null {
        const attrs = []
        while (this.hasNext() && this.peek().type === TokenType.Hash) {
            const attr = this.parseAttribute()
            if (attr === null) return null
            attrs.push(attr)
        }
        return this.parseItem(attrs)
    }

    parseAttribute (): Attribute | null {
        const tok_hash = this.expectNextOrError(TokenType.Hash)
        if (tok_hash === null) return null
        const tok_lbracket = this.expectNextOrError(TokenType.LBracket)
        if (tok_lbracket === null) return null
        const tok_rbracket = this.expectNextOrError(TokenType.RBracket)
        if (tok_rbracket === null) return null
        return new Attribute(
            tok_hash,
            tok_lbracket,
            tok_rbracket,
            mergeSpan(tok_hash.span, tok_rbracket.span),
        )
    }

    parseLongVariableDeclaration (): Item | null {
        const tok_var = this.expectNextOrError(TokenType.KVar, "Variable Declaration")
        if (tok_var === null) return null
        const tok_name = this.expectNextOrError(TokenType.Identifier)
        if (tok_name === null) return null
        let type: Type | null = null
        let tok_assign: Token | null
        if ((tok_assign = this.expectNext(TokenType.Assign)) === null) {
            type = this.parseType()
            tok_assign = this.expectNextOrError(TokenType.Assign, "Assign or Type")
            if (tok_assign === null) return null
        }
        if (type === null) {
            type = new UnknownType(tok_name.span)
        }
        const expr = this.parseExpr()
        if (expr === null) return null
        return new LongVariableDeclaration(
            tok_var,
            tok_name,
            type,
            tok_assign,
            expr,
            mergeSpan(tok_var.span, expr.span),
        )
    }

    parseArgumentList (): ArgumentList | null {
        const tok_lparen = this.expectNextOrError(TokenType.LParen)
        if (tok_lparen === null) return null

        if (this.peek().type === TokenType.RParen) {
            const tok_rparen = this.next()
            return new ArgumentList(
                tok_lparen,
                [],
                tok_rparen,
                mergeSpan(tok_lparen.span, tok_rparen.span),
            )
        }

        const groups: ArgumentGroup[] = []
        const names = []
        while (this.hasNext()) {
            const name = this.expectNextOrError(TokenType.Identifier)
            if (name === null) return null
            names.push(name)
            
            if (this.peek().type === TokenType.Comma) {
                this.ignore(1)
                continue
            }
            
            const type = this.parseType()
            if (type === null) return null
            const comma = this.expectNext(TokenType.Comma)
            
            groups.push({
                names: names.slice(),
                type,
                layout: null,
                tok_comma: comma !== null ? comma : undefined,
            })
            names.length = 0
            
            if (this.peek().type === TokenType.RParen) break
        }

        const tok_rparen = this.expectNextOrError(TokenType.RParen)
        return new ArgumentList(
            tok_lparen,
            groups,
            tok_rparen!,
            mergeSpan(tok_lparen.span, tok_rparen!.span),
        )
    }

    parseType (): Type | null {
        return this.parseTypeBinary()
    }

    parseTypeBinary (): Type | null {
        const tok = this.peek()
        switch (tok.type) {
            case TokenType.TInt:
            case TokenType.TFloat:
            case TokenType.TBool:
            case TokenType.TString:
                this.ignore(1)
                return new BinaryType(tok, tok.span)
            case TokenType.KNil:
                this.ignore(1)
                return new NilType(tok, tok.span)
            default:
                this.expectNextOrError(TokenType.TInt, "Binary Type")
                return null
        }
    }

    parseBlock (): Block | null {
        const tok_lbrace = this.expectNextOrError(TokenType.LBrace)
        if (tok_lbrace === null) return null
        const stmts = []
        while (this.hasNext() && this.peek().type !== TokenType.RBrace) {
            const stmt = this.parseStmt()
            if (stmt === null) return null
            stmts.push(stmt)
        }
        const tok_rbrace = this.next()
        return new Block(
            tok_lbrace,
            stmts,
            tok_rbrace,
            mergeSpan(tok_lbrace.span, tok_rbrace.span),
        )
    }

    parseStmt (): Stmt | null {
        switch (this.peek().type) {
            case TokenType.KVar:
                return this.parseLongVariableDeclaration()
            case TokenType.KReturn:
                return this.parseReturnStmt()
        }
        const expr = this.parseExpr(false)
        if (expr === null) {
            this.expectNextOrError(TokenType.KVar, "Statement")
            return null
        }
        return new ExprStmt(expr, expr.span)
    }

    parseExpr (required = true): Expr | null {
        return this.parseExprAssign(required)
    }

    parseExprAssign (required = true): Expr | null {
        let left: Expr | null = this.parseExprOr(required)
        if (left === null) return null
        outer: while (this.hasNext()) {
            const operator = this.peek()
            switch (operator.type) {
                case TokenType.Assign: {
                    this.ignore(1)
                    const right = this.parseExpr(required)
                    if (right === null) return null
                    left = new ExprAssign(
                        left, operator, right,
                        mergeSpan(left.span, right.span),
                    )
                    break
                }
                default: break outer
            }
        }
        return left
    }

    parseExprOr (required: boolean): Expr | null {
        let left = this.parseExprAnd(required)
        if (left === null) return null
        outer: while (this.hasNext()) {
            const operator = this.peek()
            switch (operator.type) {
                case TokenType.OOr: {
                    this.ignore(1)
                    const right = this.parseExprAnd(required)
                    if (right === null) return null
                    left = new ExprBinaryOp(
                        left, operator, right,
                        mergeSpan(left.span, right.span),
                    )
                    break
                }
                default: break outer
            }
        }
        return left
    }

    parseExprAnd (required: boolean): Expr | null {
        let left = this.parseExprEqual(required)
        if (left === null) return null
        outer: while (this.hasNext()) {
            const operator = this.peek()
            switch (operator.type) {
                case TokenType.OAnd: {
                    this.ignore(1)
                    const right = this.parseExprEqual(required)
                    if (right === null) return null
                    left = new ExprBinaryOp(
                        left, operator, right,
                        mergeSpan(left.span, right.span),
                    )
                    break
                }
                default: break outer
            }
        }
        return left
    }

    parseExprEqual (required: boolean): Expr | null {
        let left = this.parseExprCompare(required)
        if (left === null) return null
        outer: while (this.hasNext()) {
            const operator = this.peek()
            switch (operator.type) {
                case TokenType.OEq:
                case TokenType.ONe: {
                    this.ignore(1)
                    const right = this.parseExprCompare(required)
                    if (right === null) return null
                    left = new ExprBinaryOp(
                        left, operator, right,
                        mergeSpan(left.span, right.span),
                    )
                    break
                }
                default: break outer
            }
        }
        return left
    }

    parseExprCompare (required: boolean): Expr | null {
        let left = this.parseExprAdd(required)
        if (left === null) return null
        outer: while (this.hasNext()) {
            const operator = this.peek()
            switch (operator.type) {
                case TokenType.OLt:
                case TokenType.OLe:
                case TokenType.OGt:
                case TokenType.OGe: {
                    this.ignore(1)
                    const right = this.parseExprAdd(required)
                    if (right === null) return null
                    left = new ExprBinaryOp(
                        left, operator, right,
                        mergeSpan(left.span, right.span),
                    )
                    break
                }
                default: break outer
            }
        }
        return left
    }

    parseExprAdd (required: boolean): Expr | null {
        let left = this.parseExprMul(required)
        if (left === null) return null
        outer: while (this.hasNext()) {
            const operator = this.peek()
            switch (operator.type) {
                case TokenType.OAdd:
                case TokenType.OSub: {
                    this.ignore(1)
                    const right = this.parseExprMul(required)
                    if (right === null) return null
                    left = new ExprBinaryOp(
                        left, operator, right,
                        mergeSpan(left.span, right.span),
                    )
                    break
                }
                default: break outer
            }
        }
        return left
    }

    parseExprMul (required: boolean): Expr | null {
        let left = this.parseExprPow(required)
        if (left === null) return null
        outer: while (this.hasNext()) {
            const operator = this.peek()
            switch (operator.type) {
                case TokenType.OMul:
                case TokenType.ODiv:
                case TokenType.OMod: {
                    this.ignore(1)
                    const right = this.parseExprPow(required)
                    if (right === null) return null
                    left = new ExprBinaryOp(
                        left, operator, right,
                        mergeSpan(left.span, right.span),
                    )
                    break
                }
                default: break outer
            }
        }
        return left
    }

    parseExprPow (required: boolean): Expr | null {
        let left: Expr | null = this.parseExprUnary(required)
        if (left === null) return null
        outer: while (this.hasNext()) {
            const operator = this.peek()
            switch (operator.type) {
                case TokenType.OPow: {
                    this.ignore(1)
                    const right = this.parseExprUnary(required)
                    if (right === null) return null
                    left = new ExprBinaryOp(
                        left, operator, right,
                        mergeSpan(left.span, right.span),
                    )
                    break
                }
                default: break outer
            }
        }
        return left
    }

    parseExprUnary (required: boolean): Expr | null {
        const operators = []
        outer: while (this.hasNext()) {
            const operator = this.peek()
            switch (operator.type) {
                case TokenType.OAdd:
                case TokenType.OSub:
                case TokenType.ONot: {
                    operators.push(this.next())
                    break
                }
                default: break outer
            }
        }
        const left = this.parseExprCall(required)
        if (left === null) return null
        return operators.reduceRight((expr, operator) => {
            return new ExprUnaryOp(
                operator, expr,
                mergeSpan(operator.span, expr.span),
            )
        }, left)
    }

    parseExprCall (required: boolean): Expr | null {
        let left: Expr | null = this.parseExprBinary(required)
        if (left === null) return null
        outer: while (this.hasNext()) {
            const operator = this.peek()
            switch (operator.type) {
                case TokenType.Dot: {
                    this.ignore(1)
                    const right = this.expectNextOrError(TokenType.Identifier)
                    if (right === null) return null
                    left = new ExprDot(
                        left, operator, right,
                        mergeSpan(left.span, right.span),
                    )
                    break
                }
                case TokenType.LParen: {
                    const tok_lparen = this.next()
                    const args = []
                    while (this.hasNext()) {
                        const curr = this.peek()
                        if (curr.type === TokenType.RParen)
                            break
                        const arg = this.parseExpr(required)
                        if (arg === null) return null
                        args.push(arg)
                        if (!this.expectNext(TokenType.Comma)) {
                            if (this.peek().type !== TokenType.RParen)
                                return null
                        }
                    }
                    const tok_rparen = this.expectNextOrError(TokenType.RParen, "Comma or RParen")
                    if (tok_rparen === null) return null
                    left = new ExprCall(
                        left, tok_lparen, args, tok_rparen,
                        mergeSpan(left.span, tok_rparen.span),
                    )
                    break
                }
                default: break outer
            }
        }
        return left
    }

    parseExprBinary (required: boolean): ExprBinary | null {
        const tok = this.peek()
        switch (tok.type) {
            case TokenType.LParen: {
                this.ignore(1)
                const expr = this.parseExpr()
                if (expr === null) return null
                const tok_rparen = this.expectNextOrError(TokenType.RParen)
                if (tok_rparen === null) return null
                return new ExprGroup(
                    tok, expr, tok_rparen,
                    mergeSpan(tok.span, tok_rparen.span),
                )
            }
            case TokenType.Identifier:
                this.ignore(1)
                return new ExprVariable(tok, tok.span)
            case TokenType.KTrue:
            case TokenType.KFalse:
                this.ignore(1)
                return new ExprLiteralBool(tok, tok.span)
            case TokenType.String:
                this.ignore(1)
                return new ExprLiteralString(tok, tok.span)
            case TokenType.Number:
                this.ignore(1)
                return new ExprLiteralNumber(tok, tok.span)
        }
        if (required)
            this.expectNextOrError(TokenType.Identifier, "Expression")
        return null
    }

    parseReturnStmt (): ReturnStmt | null {
        const tok_return = this.expectNextOrError(TokenType.KReturn)
        if (tok_return === null) return null
        const expr = this.parseExpr(false)
        if (expr === null)
            return new ReturnStmt(tok_return, undefined, tok_return.span)
        return new ReturnStmt(tok_return, expr, mergeSpan(tok_return.span, expr.span))
    }
}

export {
    Parser,
}