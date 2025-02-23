import { Block, Input } from "./block.ts";
import { Builder } from "./builder.ts";
import { Span } from "./iem.ts";
import { BlockInput } from "./input.ts";

abstract class IR {

    span: Span

    constructor (span: Span) {
        this.span = span
    }
    
    abstract generate (builder: Builder): Block

    generateNullable (builder: Builder): Block | null {
        return this.generate(builder)
    }

    generateInput (builder: Builder, parent: Block): Input {
        const block = this.generate(builder)
        builder.current.createInputConnection(parent, block)
        return BlockInput(block.id)
    }

    generateInputNullable (builder: Builder, parent: Block): Input | null {
        const block = this.generateNullable(builder)
        if (block === null) return null
        builder.current.createInputConnection(parent, block)
        return BlockInput(block.id)
    }
}

export {
    IR,
}