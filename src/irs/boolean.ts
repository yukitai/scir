import { Block, BlockOpcode, Input } from "../block.ts";
import { Builder } from "../builder.ts";
import { nextId } from "../id.ts";
import { Span } from "../iem.ts";
import { BlockInput } from "../input.ts";
import { IR } from "../ir.ts";

class IRBoolean extends IR {

    value: boolean

    constructor (value: boolean, span: Span) {
        super(span)
        this.value = value
    }

    override generate(_builder: Builder): Block {
        throw ""
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