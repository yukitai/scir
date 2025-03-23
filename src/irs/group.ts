import { Block } from "../block.ts";
import { Builder } from "../builder.ts";
import { Span } from "../iem.ts";
import { IR } from "../ir.ts";
import { IRDefinition } from "./definition.ts";
import { nextId } from "../id.ts";
import { BlockOpcode } from "../block.ts";

class IRGroup extends IR {

    stacks: IR[]

    constructor (stacks: IR[], span: Span) {
        super(span)
        this.stacks = stacks
    }

    override generate(builder: Builder): Block {
        let block = builder.current.newBlock({
            id: nextId(),
            opcode: BlockOpcode.Event_WhenFlagClicked,
            source: this,
            inputs: {},
            fields: {},
            isShadow: false,
            isTopLevel: true,
            parent: null,
            next: null,
            states: {},
        })
        this.stacks.forEach((stack) => {
            if (stack instanceof IRDefinition) {
                stack.generate(builder)
                return
            }
            const nextBlock = stack.generate(builder)
            builder.current.createConnection(block, nextBlock)
            block = nextBlock
        })
        return block
    }
}

export {
    IRGroup,
}