import { Block, Opcode } from "../block.ts";
import { Builder } from "../builder.ts";
import { nextId } from "../id.ts";
import { Span } from "../iem.ts";
import { Field } from "../input.ts";
import { IR } from "../ir.ts";

class IRCommon extends IR {

    opcode: Opcode
    fields: Record<string, Field>
    inputs: Record<string, IR>

    constructor (
        opcode: Opcode,
        fields: Record<string, Field>,
        inputs: Record<string, IR>,
        span: Span,
    ) {
        super(span)
        this.opcode = opcode
        this.fields = fields
        this.inputs = inputs
        this.span = span
    }

    override generate(builder: Builder): Block {
        const block = builder.current.newBlock({
            id: nextId(),
            source: this,
            opcode: this.opcode,
            fields: this.fields,
            inputs: {},
            next: null,
            parent: null,
            isShadow: false,
            isTopLevel: true,
            states: {},
        })
        block.inputs = Object.fromEntries(
            Object
            .entries(this.inputs)
            .map(([k, v]) => [k, v.generateInput(builder, block)])
        )
        return block
    }
}

export {
    IRCommon,
}