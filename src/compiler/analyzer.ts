import { createSpanView, iem, LogLevel, Span } from "../iem.ts";
import { Node, File, FunctionDeclaration, ImportStmt, LongVariableDeclaration, Type, TypeDeclaration, Expr, ExprBinaryOp, ExprCall, ExprDot, ExprGroup, ExprUnaryOp, ExprVariable, BinaryType, ExprLiteral, NilType, ShortVariableDeclaration, Block, VariableDeclaration, ExprStmt } from "./ast.ts";
import { TypeLayout } from "./layout.ts";
import { TokenType } from "./lexer.ts";

interface Describer {
    node?: Node,
    layout?: TypeLayout,
    type?: Type,
}

class Analyzer {

    ast: File
    globals: Record<string, Describer>
    types: Record<string, Type>
    hasError: boolean
    locals: Record<string, Describer>[]

    constructor (ast: File) {
        this.ast = ast
        this.globals = {}
        this.locals = [{}]
        this.types = {}
        this.hasError = false
    }

    typeError (dest: Type, src: Type, destSpan: Span, srcSpan: Span) {
        this.hasError = true
        iem(
            LogLevel.Error,
            `mismatched type: ${dest.formatType()} and ${src.formatType()}`,
            createSpanView(
                [
                    {
                        ...destSpan,
                        extra: `expected type ${src.formatType()}`
                    },
                    {
                        ...srcSpan,
                        extra: `required by this expression`
                    },
                ],
                0,
            )
        )
    }

    constraintType (dest: Type, src: Type, destSpan: Span, srcSpan: Span): boolean {
        if (!dest.requireTypeSatisfied(src)) {
            this.typeError(dest, src, destSpan, srcSpan)
            return false
        }
        return true
    }

    createBinaryType (type: "string" | "int" | "float" | "bool", span: Span): BinaryType {
        const tMap = {
            string: TokenType.TString,
            int: TokenType.TInt,
            float: TokenType.TFloat,
            bool: TokenType.TBool,
        }
        return new BinaryType({
            type: tMap[type],
            value: type,
            span,
        }, span)
    }

    createFrame () {
        this.locals.push({})
    }

    destroyFrame () {
        this.locals.pop()
    }

    layoutFromType (type: Type, global = false): TypeLayout {
        throw new Error("not implemented yet")
    }

    analyze() {
        this.ast.items.forEach((item) => {
            if (item instanceof FunctionDeclaration) {
                this.analyzeFunction(item)
            } else if (item instanceof TypeDeclaration) {
                this.analyzeType(item)
            } else if (item instanceof ImportStmt) {
                this.analyzeImport(item)
            } else if (item instanceof LongVariableDeclaration) {
                this.analyzeGlobalVariable(item)
            }
        })
    }

    analyzeFunction(func: FunctionDeclaration) {
        this.globals[func.tok_name.value] = { node: func }
        this.createFrame()
        func.args.groups.forEach((group) => {
            group.names.forEach((name) => {
            })
        })
        this.analyzeBlock(func.body)
        this.destroyFrame()
    }

    analyzeBlock(block: Block) {
        this.createFrame()
        block.stmts.forEach((stmt) => {
            if (stmt instanceof LongVariableDeclaration
             || stmt instanceof ShortVariableDeclaration) {
                this.analyzeLocalVariable(stmt)
            } else if (stmt instanceof ExprStmt) {
                this.analyzeExpr(stmt.expr)
            }
        })
        this.destroyFrame()
    }

    analyzeType(type: TypeDeclaration) {
        this.types[type.tok_name.value] = type.type
    }

    analyzeImport(importStmt: ImportStmt) {
        importStmt.tok_paths.forEach((_path) => {
            // TODO: implement import
        })
    }

    analyzeGlobalVariable(varDecl: LongVariableDeclaration) {
        this.analyzeExpr(varDecl.value)
        this.globals[varDecl.tok_name.value] = {
            node: varDecl,
            layout: this.layoutFromType(varDecl.type, true),
        }
        this.constraintType(varDecl.type, varDecl.value.type, varDecl.type.span, varDecl.value.span)
    }

    analyzeLocalVariable(varDecl: VariableDeclaration) {
        this.analyzeExpr(varDecl.value)
        this.locals[this.locals.length - 1][varDecl.tok_name.value] = {
            node: varDecl,
            layout: this.layoutFromType(varDecl.type),  
        }
        this.constraintType(varDecl.type, varDecl.value.type, varDecl.type.span, varDecl.value.span)
    }

    analyzeExpr(expr: Expr) {
        if (expr instanceof ExprLiteral) {
            let type: Type
            switch (expr.value.type) {
                case TokenType.Number: {
                    const isFloat = expr.value.value.includes(".")
                    type = isFloat
                           ? this.createBinaryType("float", expr.span)
                           : this.createBinaryType("int", expr.span)
                    break   
                }
                case TokenType.String:
                    type = this.createBinaryType("string", expr.span) 
                    break
                case TokenType.KTrue:
                case TokenType.KFalse:
                    type = this.createBinaryType("bool", expr.span)   
                    break
                case TokenType.KNil:
                    type = new NilType(undefined, expr.span)
                    break
                default:
                    throw new Error("unreachable code")
            }
            this.constraintType(expr.type, type, expr.span, expr.span)
        } else if (expr instanceof ExprBinaryOp) {
            this.analyzeExpr(expr.left)
            this.analyzeExpr(expr.right)
            if (!this.constraintType(expr.left.type, expr.right.type, expr.left.span, expr.right.span)) {
                return
            }
            switch (expr.op.type) {
                case TokenType.OEq:
                case TokenType.ONe:
                case TokenType.OLt:
                case TokenType.OLe:
                case TokenType.OGt:
                case TokenType.OGe: {
                    const t_bool = this.createBinaryType("bool", expr.span)
                    this.constraintType(expr.type, t_bool, expr.span, expr.span)
                    break
                }
                default:
                    this.constraintType(expr.type, expr.left.type, expr.span, expr.left.span)
            }
        } else if (expr instanceof ExprUnaryOp) {
            this.analyzeExpr(expr.expr)
            this.constraintType(expr.type, expr.expr.type, expr.span, expr.expr.span)
        } else if (expr instanceof ExprCall) {
            // TODO: check function arguments & return types
            throw new Error("not implemented yet")
        } else if (expr instanceof ExprDot) {
            this.analyzeExpr(expr.left)
            // TODO: check field type
            throw new Error("not implemented yet")
        } else if (expr instanceof ExprVariable) {
            throw new Error("not implemented yet")
        } else if (expr instanceof ExprGroup) {
            this.analyzeExpr(expr.expr)
            this.constraintType(expr.type, expr.expr.type, expr.span, expr.expr.span)
        }
    }
}

export {
    Analyzer,
}