import { Block } from "../block.ts";
import { Builder } from "../builder.ts";
import { createSpanView } from "../iem.ts";
import { iem, LogLevel, Span } from "../iem.ts";
import { Input, SimpleInputType, SimpleInput } from "../input.ts";
import { IR } from "../ir.ts";
import { Value } from "../value.ts";
import { IRError } from "./error.ts";

class IRConstant extends IR {

    type: SimpleInputType
    value: Value

    constructor (type: SimpleInputType, value: Value, span: Span) {
        super(span)
        this.type = type
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

    override generateInput(_builder: Builder, _parent: Block): Input {
        const input = SimpleInput(this.type, this.value)
        input.isShadow = true
        return input
    }

    override generateInputNullable(builder: Builder, parent: Block): Input | null {
        return this.generateInput(builder, parent)
    }
}

export {
    IRConstant,
}