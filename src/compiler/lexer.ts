import { createSpan, createSpanView, iem, LogLevel, previewSpanShort } from "../iem.ts";
import { Position, Span } from "../iem.ts";
import { Stream } from "./stream.ts";

enum TokenType {
    Broken = "Broken",

    Identifier = "Identifier",
    Number = "Number",
    String = "String",

    LParen = "LParen",
    RParen = "RParen",
    LBracket = "LBracket",
    RBracket = "RBracket",
    LBrace = "LBrace",
    RBrace = "RBrace",

    Hash = "Hash",
    Comma = "Comma",
    Colon = "Colon",
    Semi = "Semi",
    Assign = "Assign",
    ShortDef = "ShortDef",
    Dot = "Dot",

    KPackage = "KPackage",
    KImport = "KImport",
    KFunc = "KFunc",
    K__Opcode__ = "K__Opcode__",
    KWhile = "KWhile",
    KFor = "KFor",
    KIn = "KIn",
    KRepeat = "KRepeat",
    KUntil = "KUntil",
    KIf = "KIf",
    KElse = "KElse",
    KReturn = "KReturn",
    KVar = "KVar",
    KTrue = "KTrue",
    KFalse = "KFalse",
    KStruct = "KStruct",
    KEnum = "KEnum",
    KType = "KType",
    KNil = "KNil",

    TInt = "TInt",
    TFloat = "TFloat",
    TString = "TString",
    TBool = "TBool",

    OAdd = "OAdd",
    OSub = "OSub",
    OMul = "OMul",
    ODiv = "ODiv",
    OMod = "OMod",
    OPow = "OPow",
    OEq = "OEq",
    ONe = "ONe",
    OLt = "OLt",
    OLe = "OLe",
    OGt = "OGt",
    OGe = "OGe",
    OAnd = "OAnd",
    OOr = "OOr",
    ONot = "ONot",
}

type Token = {
    type: TokenType,
    value: string,
    span: Span,
}

const previewToken = (token: Token): string => {
    return `${token.type}(\`${token.value}\`, ${previewSpanShort(token.span)})`
}

class Lexer extends Stream<string> {

    cursor: Position
    lines: string[]
    file?: string

    constructor (code: string, file?: string) {
        super(code)
        this.lines = code.split("\n")
        this.cursor = [0, 0]
        this.file = file
    }

    getSpan (cursor?: Position) {
        const nowCursor = this.getCursor()
        if (cursor) {
            return createSpan(
                this.lines,
                [cursor, nowCursor],
                this.file,
            )
        } else {
            return createSpan(
                this.lines,
                [nowCursor, [nowCursor[0], nowCursor[1] + 1]],
                this.file,
            )
        }
    }

    unexpectError (expect: string, actual: string, span: Span) {
        iem(
            LogLevel.Error,
            `expected ${expect}, found ${actual}`,
            createSpanView(
                [
                    { ...span }
                ],
                0,
            )
        )
    }

    unfinishedStringError (span: Span) {
        iem(
            LogLevel.Error,
            `unfinished string literal`,
            createSpanView(
                [
                    { ...span }
                ],
                0,
            )
        )
    }

    moveCursor (n: number) {
        this.cursor[1] += n
        while (
            this.cursor[0] < this.lines.length
         && this.lines[this.cursor[0]].length + 1 <= this.cursor[1]
        ) {
            this.cursor[1] -= this.lines[this.cursor[0]].length + 1
            this.cursor[0]++
        }
    }

    getCursor (): Position {
        return [...this.cursor]
    }

    override next(): string {
        this.moveCursor(1)
        return super.next()
    }

    override ignore(count: number) {
        this.moveCursor(count)
        super.ignore(count)
    }

    jumpSpace () {
        while (" \n".indexOf(this.peek()) !== -1) this.ignore(1)
    }

    stringFormed (text: string): string {
        if (!text) return "EOF"
        return `\`${text}\``
    }

    nextToken (): Token {
        this.jumpSpace()
        const start = this.getCursor()
        const current = this.next()
        switch (current) {
            case "+": return {
                type: TokenType.OAdd,
                value: "+",
                span: this.getSpan(start),
            }
            case "-": return {
                type: TokenType.OSub,
                value: "-",
                span: this.getSpan(start),
            }
            case "*": return {
                type: TokenType.OMul,
                value: "*",
                span: this.getSpan(start),
            }
            case "/": return {
                type: TokenType.ODiv,
                value: "/",
                span: this.getSpan(start),
            }
            case "%": return {
                type: TokenType.OMod,
                value: "%",
                span: this.getSpan(start),
            }
            case "^": return {
                type: TokenType.OPow,
                value: "^",
                span: this.getSpan(start),
            }
            case "(": return {
                type: TokenType.LParen,
                value: "(",
                span: this.getSpan(start),
            }
            case ")": return {
                type: TokenType.RParen,
                value: ")",
                span: this.getSpan(start),
            }
            case "[": return {
                type: TokenType.LBracket,
                value: "[",
                span: this.getSpan(start),
            }
            case "]": return {
                type: TokenType.RBracket,
                value: "]",
                span: this.getSpan(start),
            }
            case "{": return {
                type: TokenType.LBrace,
                value: "{",
                span: this.getSpan(start),
            }
            case "}": return {
                type: TokenType.RBrace,
                value: "}",
                span: this.getSpan(start),
            }
            case ".": return {
                type: TokenType.Dot,
                value: ".",
                span: this.getSpan(start),
            }
            case ":": 
                if (this.peek() === "=") {
                    this.ignore(1)
                    return {
                        type: TokenType.ShortDef,
                        value: ":=",
                        span: this.getSpan(start),
                    }
                }
                return {
                    type: TokenType.Colon,
                    value: ":",
                    span: this.getSpan(start),
                }
            case ",": return {
                type: TokenType.Comma,
                value: ",",
                span: this.getSpan(start),
            }
            case ";": return {
                type: TokenType.Semi,
                value: ";",
                span: this.getSpan(start),
            }
            case "#": return {
                type: TokenType.Hash,
                value: "#",
                span: this.getSpan(start),
            }
            case "=":
                if (this.peek() === "=") {
                    this.ignore(1)
                    return {
                        type: TokenType.OEq,
                        value: "==",
                        span: this.getSpan(start),
                    }
                }
                return {
                    type: TokenType.Assign,
                    value: "=",
                    span: this.getSpan(start),
                }
            case "!":
                if (this.peek() === "=") {
                    this.ignore(1)
                    return {
                        type: TokenType.ONe,
                        value: "!=",
                        span: this.getSpan(start),
                    }
                }
                return {
                    type: TokenType.ONot,
                    value: "!",
                    span: this.getSpan(start),
                }
            case "<":
                if (this.peek() === "=") {
                    this.ignore(1)
                    return {
                        type: TokenType.OLe,
                        value: "<=",
                        span: this.getSpan(start),
                    }
                }
                return {
                    type: TokenType.OLt,
                    value: "<",
                    span: this.getSpan(start),
                }
            case ">":
                if (this.peek() === "=") {
                    this.ignore(1)
                    return {
                        type: TokenType.OGe,
                        value: ">=",
                        span: this.getSpan(start),
                    }
                }
                return {
                    type: TokenType.OGt,
                    value: ">",
                    span: this.getSpan(start),
                }
            case "&":
                if (this.peek() === "&") {
                    this.ignore(1)
                    return {
                        type: TokenType.OAnd,
                        value: "&&",
                        span: this.getSpan(start),
                    }
                }
                this.unexpectError("`&`", this.stringFormed(this.peek()), this.getSpan())
                return {
                    type: TokenType.Broken,
                    value: "&",
                    span: this.getSpan(start),
                }
            case "|":
                if (this.peek() === "|") {
                    this.ignore(1)
                    return {
                        type: TokenType.OOr,
                        value: "||",
                        span: this.getSpan(start),
                    }
                }
                this.unexpectError("`|`", this.stringFormed(this.peek()), this.getSpan())
                return {
                    type: TokenType.Broken,
                    value: "|",
                    span: this.getSpan(start),
                }
            case '"': {
                let flag = false
                const begin = this.current
                while (!flag && this.peek() !== '"') {
                    if (!this.hasNext()) {
                        this.unfinishedStringError(this.getSpan(start))
                        return {
                            type: TokenType.Broken,
                            value: "",
                            span: this.getSpan(start)
                        }
                    }
                    if (flag) {
                        flag = false
                    } else if (this.peek() === "\\") {
                        flag = true
                    }
                    this.ignore(1)
                }
                this.ignore(1)
                const value = '"' + this.stream.slice(begin, this.current) as string
                return {
                    type: TokenType.String,
                    value,
                    span: this.getSpan(start),
                }
            }
        }
        if (/[0-9]/.test(current)) {
            const begin = this.current - 1
            while (this.hasNext() && /[0-9\.]/.test(this.peek()))
                this.ignore(1)
            const value = this.stream.slice(begin, this.current) as string
            return {
                type: TokenType.Number,
                value,
                span: this.getSpan(start),
            }
        } else if (/[a-z_]/i.test(current)) {
            const begin = this.current - 1
            while (this.hasNext() && /[a-z0-9_]/i.test(this.peek()))
                this.ignore(1)
            const value = this.stream.slice(begin, this.current) as string
            let tokenType = TokenType.Identifier
            switch (value) {
                case "func": 
                    tokenType = TokenType.KFunc
                    break
                case "if": 
                    tokenType = TokenType.KIf
                    break
                case "else": 
                    tokenType = TokenType.KElse
                    break
                case "while": 
                    tokenType = TokenType.KWhile
                    break
                case "repeat": 
                    tokenType = TokenType.KRepeat
                    break
                case "until": 
                    tokenType = TokenType.KUntil
                    break
                case "for": 
                    tokenType = TokenType.KFor
                    break
                case "in": 
                    tokenType = TokenType.KIn
                    break
                case "return": 
                    tokenType = TokenType.KReturn
                    break
                case "__opcode__": 
                    tokenType = TokenType.K__Opcode__
                    break
                case "package": 
                    tokenType = TokenType.KPackage
                    break
                case "import": 
                    tokenType = TokenType.KImport
                    break
                case "var": 
                    tokenType = TokenType.KVar
                    break
                case "struct": 
                    tokenType = TokenType.KStruct
                    break
                case "enum": 
                    tokenType = TokenType.KEnum
                    break
                case "type": 
                    tokenType = TokenType.KType
                    break
                case "int": 
                    tokenType = TokenType.TInt
                    break
                case "float": 
                    tokenType = TokenType.TFloat
                    break
                case "string": 
                    tokenType = TokenType.TString
                    break
                case "bool": 
                    tokenType = TokenType.TBool
                    break
                case "true": 
                    tokenType = TokenType.KTrue
                    break
                case "false": 
                    tokenType = TokenType.KFalse
                    break
                case "nil": 
                    tokenType = TokenType.KNil
                    break
            }
            return {
                type: tokenType,
                value,
                span: this.getSpan(start),
            }
        }
        this.unexpectError("Item", this.stringFormed(current), this.getSpan())
        return {
            type: TokenType.Broken,
            value: current,
            span: this.getSpan(),
        }
    }

    *[Symbol.iterator] () {
        while (this.hasNext())
            yield this.nextToken()
    }
}

export {
    type Token,
    TokenType,
    Lexer,
    previewToken,
}