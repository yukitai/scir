import { Block } from "../block.ts";
import { Builder } from "../builder.ts";
import { TypeLayout } from "../compiler/layout.ts";
import { nextId } from "../id.ts";
import { createSpanView, iem, LogLevel, Span } from "../iem.ts";
import { BlockInput, Input, ValueField } from "../input.ts";
import { IR } from "../ir.ts";
import { IRError } from "./error.ts";
import { IRStack } from "./stack.ts";

class IRDefinition extends IR {

    name: string
    args: Record<string, TypeLayout>
    body: IRStack
    warp: boolean
    argumentids: string[]

    constructor (
        name: string,
        args: Record<string, TypeLayout>,
        body: IRStack,
        warp: boolean,
        span: Span,
    ) {
        super(span)
        this.name = name
        this.args = args
        this.body = body
        this.warp = warp
        this.argumentids = Object.keys(this.args).map(() => nextId())
    }

    get proccode () {
        return `${this.name}(${Object
                         .entries(this.args)
                         .map(([name, _]) => `${name}: %s`)
                         .join(", ")})`
    }

    generate (builder: Builder): Block {
        const definition = builder.current.newBlock({
            id: builder.lockfile.names[name]?.id ?? nextId(),
            opcode: "procedures_definition",
            source: this,
            inputs: {},
            fields: {},
            isShadow: false,
            isTopLevel: true,
            parent: null,
            next: null,
            states: {
                x: 0,
                y: 0,
            }
        })

        const prototype = builder.current.newBlock({
            id: nextId(),
            opcode: "procedures_prototype",
            source: this,
            inputs: {},
            fields: {},
            isShadow: true,
            isTopLevel: false,
            parent: definition.id,
            next: null,
            states: {
                mutation: {
                    tagName: "mutation",
                    children: [],
                    proccode: this.proccode,
                    argumentids: "",
                    argumentnames: "",
                    argumentdefaults: "",
                    warp: this.warp,
                }
            }
        })

        definition.inputs["custom_block"] = BlockInput(prototype.id)

        const argumentnames: string[] = []
        const argumentdefaults: string[] = []

        Object.entries(this.args).forEach(([name, _], idx) => {
            const id = this.argumentids[idx]
            argumentnames.push(name)
            argumentdefaults.push("")
            const arg = builder.current.newBlock({
                id,
                opcode: "argument_reporter_string_number",
                source: this,
                inputs: {},
                fields: {
                    VALUE: ValueField(name, name),
                },
                isShadow: true,
                isTopLevel: false,
                parent: prototype.id,
                next: null,
                states: {},
            })
            prototype.inputs[id] = BlockInput(arg.id)
        })

        // @ts-ignore mutation
        prototype.states.mutation.argumentids = JSON.stringify(this.argumentids)
        // @ts-ignore mutation
        prototype.states.mutation.argumentnames = JSON.stringify(argumentnames)
        // @ts-ignore mutation
        prototype.states.mutation.argumentdefaults = JSON.stringify(argumentdefaults)

        const body = this.body.generateNullable(builder)
        if (body !== null) {
            builder.current.createConnection(definition, body)
        }
        return definition
    }

    override generateInput(builder: Builder, parent: Block): Input {
        iem(
            LogLevel.Error,
            `internal compiler error: try to generate function as an input`,
            createSpanView(
                [
                    { ...this.span }
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

class IRCall extends IR {

    definition: IRDefinition
    args: IR[]

    constructor (
        definition: IRDefinition,
        args: IR[],
        span: Span,
    ) {
        super(span)
        this.definition = definition
        this.args = args
    }

    override generate(builder: Builder): Block {
        const call = builder.current.newBlock({
            id: nextId(),
            opcode: "procedures_call",
            source: this,
            inputs: {},
            fields: {},
            isShadow: false,
            isTopLevel: false,
            parent: null,
            next: null,
            states: {
                mutation: {
                    tagName: "mutation",
                    children: [],
                    proccode: this.definition.proccode,
                    argumentids: JSON.stringify(this.definition.argumentids),
                    warp: this.definition.warp,
                }
            }
        })

        this.args.forEach((arg, idx) => {
            const input = arg.generateInput(builder, call)
            call.inputs[this.definition.argumentids[idx]] = input
        })
        return call
    }

    override generateInput(_builder: Builder, _parent: Block): Input {
        throw new Error("Method not implemented.")
    }
}

class IRArgument extends IR {

    definition: IRDefinition
    name: string

    constructor (
        definition: IRDefinition,
        name: string,
        span: Span,
    ) {
        super(span)
        this.definition = definition
        this.name = name
    }

    override generate(builder: Builder): Block {
        iem(
            LogLevel.Error,
            `internal compiler error: try to generate top-level inputs`,
            createSpanView(
                [
                    { ...this.span }
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
        const input = builder.current.newBlock({
            id: nextId(),
            opcode: "argument_reporter_string_number",
            source: this,   
            inputs: {},
            fields: {
                VALUE: ValueField(this.name, this.name),
            },
            isShadow: false,
            isTopLevel: false,
            parent: null,
            next: null,
            states: {},
        })
        builder.current.createInputConnection(parent, input)
        return BlockInput(input.id)
    }
}


export {
    IRDefinition,
    IRCall,
    IRArgument,
}