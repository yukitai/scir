import { Block, BlockOpcode, Input } from "../block.ts";
import { Builder } from "../builder.ts";
import { nextId } from "../id.ts";
import { createSpanView, iem, LogLevel, Span } from "../iem.ts";
import { BlockInput } from "../input.ts";
import { IR } from "../ir.ts";
import { IRError } from "./error.ts";

class IRBoolean extends IR {

    value: boolean

    constructor (value: boolean, span: Span) {
        super(span)
        this.value = value
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
        if (!this.value) return undefined as unknown as Input
        const block = builder.current.newBlock({
            id: nextId(),
            opcode: BlockOpcode.Operator_Not,
            source: this,
            inputs: {},
            fields: {},
            parent: null,
            next: null,
            isShadow: false,
            isTopLevel: false,
            states: {},
        })
        builder.current.createInputConnection(parent, block)
        return BlockInput(block.id)
    }
}

export {
    IRBoolean,
}