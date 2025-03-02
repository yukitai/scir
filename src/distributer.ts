import { Builder } from "./builder.ts";
import { nextId } from "./id.ts";

type Variable = {
    name: string,
    id: string,
}

const NewGlobalVariable = (builder: Builder, varname: string) => {
    let id
    const lockinfo = builder.lockfile.names[varname]
    if (lockinfo) {
        id = lockinfo.id
    } else {
        id = nextId()
        builder.lockfile.names[varname] = {
            id,
        }
    }
    const name = `${varname}$${id}`
    return { name, id } as Variable
}

interface LocalsContext {
    slots: Variable[]
}

const NewLocalsContext = () => ({
    slots: []
} as LocalsContext)

const NewLocalVariable = (ctx: LocalsContext, varname: string) => {
    // not fully impled
    // TODO: auto merge variables
    const variable = ctx.slots.find((it) => it.name === varname)
    if (variable) return variable
    const id = nextId()
    const local = {
        name: `${varname}$${id}`,
        id,
    } as Variable
    ctx.slots.push(local)
    return local
}

export {
    type Variable,
    type LocalsContext,
    NewGlobalVariable,
    NewLocalsContext,
    NewLocalVariable
}