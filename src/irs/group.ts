import { Block } from "../block.ts";
import { Builder } from "../builder.ts";
import { Span } from "../iem.ts";
import { IR } from "../ir.ts";
import { IRError } from "./error.ts";

class IRGroup extends IR {

    stacks: IR[]

    constructor (stacks: IR[], span: Span) {
        super(span)
        this.stacks = stacks
    }

    override generate(builder: Builder): Block {
        this.stacks.forEach((stack) => {
            stack.generate(builder)
        })
        return new IRError(this.span).generate(builder)
    }
}

export {
    IRGroup,
}