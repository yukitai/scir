import { Block, HiddenOpcode } from "../block.ts";
import { Builder } from "../builder.ts";
import { nextId } from "../id.ts";
import { Span, emptySpan } from "../iem.ts";
import { IR } from "../ir.ts";

class IRError extends IR {
    constructor (span?: Span) {
        super(span ?? emptySpan())
    }

    override generate(builder: Builder): Block {
        return builder.current.newBlock({
            id: nextId(),
            source: this,
            opcode: HiddenOpcode.Undefined,
            fields: {},
            inputs: {},
            next: null,
            parent: null,
            isShadow: false,
            isTopLevel: true,
            states: {},
        })
    }
}

export {
    IRError,
}