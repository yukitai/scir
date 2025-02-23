import { Block, BlockOpcode } from "../block.ts";
import { Builder } from "../builder.ts";
import { nextId } from "../id.ts";
import { Span } from "../iem.ts";
import { BlockInput } from "../input.ts";
import { IR } from "../ir.ts";
import { IRStack } from "./stack.ts";

type IfCase = {
    condition: IR,
    substack: IRStack,
}

class IRBranch extends IR {

    branches: IfCase[]
    defaultCase: IRStack | null

    constructor (branches: IfCase[], defaultCase: IRStack, span: Span) {
        super(span)
        this.branches = branches
        this.defaultCase = defaultCase
    }

    override generate(builder: Builder): Block {
        const lastBranch = this.branches.slice(-1)[0]
        const lastBranchBlock = builder.current.newBlock({
            id: nextId(),
            opcode: this.defaultCase === null
                    ? BlockOpcode.Control_If
                    : BlockOpcode.Control_IfElse,
            source: this,
            fields: {},
            inputs: {},
            parent: null,
            next: null,
            isTopLevel: true,
            isShadow: false,
            states: {},
        })
        const substack = lastBranch
                         .substack
                         .generateInputNullable(builder, lastBranchBlock)
        const defaultCaseSubstack = this
                                    .defaultCase
                                    ?.generateInputNullable(builder, lastBranchBlock)
        if (substack !== null) {
            lastBranchBlock.inputs.SUBSTACK = substack
        }
        if (defaultCaseSubstack) {
            lastBranchBlock.inputs.SUBSTACK2 = defaultCaseSubstack
        }
        lastBranchBlock.inputs.CONDITION = lastBranch
                                           .condition
                                           .generateInput(builder, lastBranchBlock)
        return this.branches.slice(0, -1).reduceRight((children, branch) => {
            const block = builder.current.newBlock({
                id: nextId(),
                opcode: BlockOpcode.Control_IfElse,
                source: this,
                fields: {},
                inputs: {},
                parent: null,
                next: null,
                isTopLevel: true,
                isShadow: false,
                states: {},
            })
            block.inputs = {
                CONDITION: branch.condition.generateInput(builder, block),
                SUBSTACK2: BlockInput(children.id),
            }
            const substack = branch.substack.generateInputNullable(builder, block)
            if (substack !== null) {
                block.inputs.SUBSTACK = substack
            }
            children.parent = block.id
            children.isTopLevel = false
            return block
        }, lastBranchBlock)
    }
}

export {
    IRBranch,
}