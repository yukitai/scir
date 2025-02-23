import { Block } from "../block.ts";
import { Builder } from "../builder.ts";
import { Span, iem, LogLevel, createSpanView } from "../iem.ts";
import { IR } from "../ir.ts";
import { IRError } from "./error.ts";

class IRStack extends IR {

    blocks: IR[]

    constructor (blocks: IR[], span: Span) {
        super(span)
        this.blocks = blocks
    }

    override generate(builder: Builder): Block {
        const head = this.generateNullable(builder)
        if (head !== null) return head
        iem(
            LogLevel.Error,
            `unexpected empty block`,
            createSpanView(
                [
                    { ...this.span }
                ],
                0,
                [
                    LogLevel.Help,
                    "remove this block"
                ]
            ),
        )
        return new IRError(this.span).generate(builder)  
    }

    override generateNullable(builder: Builder): Block | null {
        if (this.blocks.length === 0) return null
        const generatedBlocks = this.blocks.map((it) => it.generate(builder))
        generatedBlocks.reduce((parent, block) => {
            builder.current.createConnection(parent, block)
            return block
        })
        return generatedBlocks[0]
    }
}

export {
    IRStack,
}