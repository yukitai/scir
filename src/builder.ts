import { Block, blockToJson, Input } from "./block.ts";
import { nextId } from "./id.ts";
import { InputType } from "./input.ts";
import { LockFile } from "./lock.ts";
import { Value } from "./value.ts";

type Local = {
    variables: Record<string, Value>,
    lists: Record<string, Value>,
    broadcasts: Record<string, Value>,
}

class Target {
    id: string
    name: string
    isStage: boolean
    blocks: Record<string, Block>
    locals: Local
    builder: Builder

    // states to be saved
    states: Record<string, unknown>

    constructor (builder: Builder, name: string, isStage = false) {
        this.builder = builder
        this.id = nextId()
        this.name = name
        this.isStage = isStage
        this.blocks = {}
        this.locals = {
            variables: {},
            lists: {},
            broadcasts: {},
        }
        this.states = {
            comments: {},
            currentCostume: 1,
            costumes: [],
            sounds: [],
            layerOrder: 0,
            volume: 100,
        }
    }

    newBlock (block: Block): Block {
        this.blocks[block.id] = block
        return block
    }

    clearOldGeneration () {
        for (const decl of Object.values(this.builder.lockfile.names)) {
            const id = decl.id
            this.deleteBlockRec(id)
        }
    }

    deleteBlock (id: string): Block {
        const block = this.blocks[id]
        delete this.blocks[id]
        return block
    }

    deleteInput (input: Input) {
        switch (input.type) {
            case InputType.Block:
                this.deleteBlockRec(input.array[0])
        }
        if (input.shadowed) this.deleteInput(input.shadowed)
    }

    deleteBlockRec (id: string | null) {
        while (id) {
            const block = this.deleteBlock(id)
            Object.entries(block.inputs)
                .forEach(([_, input]) => {
                    this.deleteInput(input)
                })            
            id = block.next
        }
    }

    json (): object {
        return {
            ...this.states,
            isStage: this.isStage,
            name: this.name,
            variables: this.locals.variables,
            lists: this.locals.lists,
            broadcasts: this.locals.broadcasts,
            blocks: Object.fromEntries(
                Object.entries(this.blocks)
                      .map(([k, v]) => [k, blockToJson(v)])
            ),
        }
    }
}

class Builder {
    sprites: Target[]
    stage: Target
    current: Target
    globals: Local
    extensions: string[]
    lockfile: LockFile
    monitors: object
    meta: object

    constructor (lockfile: LockFile) {
        this.sprites = []
        this.stage = new Target(this, "Stage", true)
        this.current = this.stage
        this.globals = this.stage.locals
        this.extensions = []
        this.lockfile = lockfile
        this.meta = {
            semver: "3.0.0",
            vm: "",
            agent: "",
        }
        this.monitors = []
    }

    clearOldGeneration () {
        this.stage.clearOldGeneration()
        this.sprites.forEach((it) => it.clearOldGeneration())
    }

    json (): object {
        return {
            targets: [
                ...this.sprites,
                this.stage
            ].map(it => it.json()),
            monitors: this.monitors,
            extensions: this.extensions,
            meta: this.meta,
        }
    }
}

export {
    Target,
    Builder,
}