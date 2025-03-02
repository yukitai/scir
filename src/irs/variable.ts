import { Block } from "../block.ts";
import { Builder } from "../builder.ts";
import { IR } from "../ir.ts";
import { LayoutType, StoreType, TypeLayout, VariableLayout } from "../compiler/layout.ts";
import { createSpanView, iem, LogLevel, Span } from "../iem.ts";
import { IRError } from "./error.ts";
import { Input, VariableInput } from "../input.ts";
import { blue, italic, magenta } from "jsr:@std/fmt/colors";
import { nextId } from "../id.ts";

const getMode = (t1: number, t2: number): number => {
    return (t1 << 4) | t2
}
const decodeMode = (mode: number): string => {
    const t1 = (mode >> 4) as unknown as LayoutType
    const t2 = (mode & 0b1111) as unknown as LayoutType
    const t1names = {
        [LayoutType.Variable]: "variable layout",
        [LayoutType.Array]: "array layout",
        [LayoutType.Struct]: "struct layout",
    }
    const t2names = {
        [StoreType.Variable]: "in variable",
        [StoreType.List]: "in list",
        [StoreType.Stack]: "on stack",
    }
    return magenta(t1names[t1]) + " " + italic(blue(t2names[t2]))
}

class GetVariable extends IR {

    variable: TypeLayout

    constructor (variable: TypeLayout, span: Span) {
        super(span)
        this.variable = variable
    }

    override generate(builder: Builder): Block {
        iem(
            LogLevel.Error,
            `internal compiler error: try to generate top-level inputs`,
            createSpanView(
                [
                    {
                        ...this.span,
                        extra: "error might occurs here"
                    }
                ],
                0,
                [
                    LogLevel.Help,
                    "this is an ICE, "
                    + "which mostly is a bug of compiler. "
                    + "you can open an issue with this message at "
                    + "https://github.com/yukitai/scir "
                    + "when you meet this"
                ]
            )
        )
        return new IRError(this.span).generate(builder)
    }

    override generateInput(builder: Builder, parent: Block): Input {
        const mode = getMode(this.variable.type, this.variable.position.type)
        switch (mode) {
            case getMode(LayoutType.Variable, StoreType.Variable): {
                const variable = builder.NewVariable(
                    (this.variable as VariableLayout).name
                )
                return VariableInput(variable)
            }
        }
        iem(
            LogLevel.Error,
            `internal compiler error: invalid variable layout for IR_GET: ${decodeMode(mode)}`,
            createSpanView(
                [
                    {
                        ...this.span,
                        extra: "error might occurs here"
                    }
                ],
                0,
                [
                    LogLevel.Help,
                    "this is an ICE, "
                    + "which mostly is a bug of compiler. "
                    + "you can open an issue with this message at "
                    + "https://github.com/yukitai/scir "
                    + "when you meet this"
                ]
            )
        )
        return new IRError(this.span).generateInput(builder, parent)
    }
}

class SetVariable extends IR {

    variable: TypeLayout
    value: IR

    constructor (variable: TypeLayout, value: IR, span: Span) {
        super(span)
        this.variable = variable
        this.value = value
    }
    
    override generate(builder: Builder): Block {
        const mode = getMode(this.variable.type, this.variable.position.type)
        switch (mode) {
            case getMode(LayoutType.Variable, StoreType.Variable): {
                const variable = builder.NewVariable(
                    (this.variable as VariableLayout).name
                )
                const block = builder.current.newBlock({
                    id: nextId(),
                    opcode: "data_setvariableto",
                    source: this,
                    fields: {
                        VARIABLE: {
                            name: variable.name,
                            value: variable.name,
                            id: variable.id,
                        }
                    },
                    inputs: {},
                    parent: null,
                    next: null,
                    isTopLevel: true,
                    isShadow: false,
                    states: {},
                })
                block.inputs.VALUE = this.value.generateInput(builder, block)
                return block
            }
        }
        iem(
            LogLevel.Error,
            `internal compiler error: invalid variable layout for IR_STORE: ${decodeMode(mode)}`,
            createSpanView(
                [
                    {
                        ...this.span,
                        extra: "error might occurs here"
                    }
                ],
                0,
                [
                    LogLevel.Help,
                    "this is an ICE, "
                    + "which mostly is a bug of compiler. "
                    + "you can open an issue with this message at "
                    + "https://github.com/yukitai/scir "
                    + "when you meet this"
                ]
            )
        )
        return new IRError(this.span).generate(builder)
    }
}

export {
    GetVariable,
    SetVariable,
}