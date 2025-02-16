import { JSZip, readZip } from "https://deno.land/x/jszip@0.11.0/mod.ts"
import { Builder } from "./builder.ts";
import { Target } from "./builder.ts";
import { Block } from "./block.ts";
import { convertArrayToField, convertArrayToInput, FieldArray, InputArray } from "./input.ts";
import { loadLockFile } from "./lock.ts";

interface Sb3File {
    zip: JSZip,
    builder: Builder,
}

// deno-lint-ignore no-explicit-any
const convertJsonToBlock = (id: string, block: any): Block => {
    return {
        id,
        source: null,
        opcode: block.opcode,
        next: block.next,
        parent: block.parent,
        inputs: Object.fromEntries(
            Object.entries(block.inputs)
                  .map(([k, v]) => [k, convertArrayToInput(v as InputArray)])
        ),
        fields: Object.fromEntries(
            Object.entries(block.fields)
                  .map(([k, v]) => [k, convertArrayToField(k, v as FieldArray)])
        ),
        isShadow: block.shadow,
        isTopLevel: block.topLevel,
        states: block,
    }
}

// deno-lint-ignore no-explicit-any
const initSprite = (sprite: Target, target: any) => {
    sprite.isStage = target.isStage
    sprite.locals = {
        variables: target.variables,
        lists: target.lists,
        broadcasts: target.broadcasts,
    }
    for (const blockid in target.blocks) {
        sprite.newBlock(convertJsonToBlock(blockid, target.blocks[blockid]))
    }
    sprite.states = target
}

// deno-lint-ignore no-explicit-any
const initBuilder = (builder: Builder, projectJson: any) => {
    builder.extensions = projectJson.extensions
    builder.meta = projectJson.meta
    builder.monitors = projectJson.monitors
    for (const target of projectJson.targets) {
        if (target.isStage) {
            initSprite(builder.stage, target)
        } else {
            const sprite = new Target(builder, target.name)
            builder.sprites.push(sprite)
            initSprite(sprite, target)
        }
    }
}

const loadSb3 = async (path: string, lockfile?: string): Promise<Sb3File> => {
    const zip = await readZip(path)
    const projectJson = JSON.parse(
        await zip.file("project.json")
                 .async("string"),
    )
    const builder = new Builder(lockfile
                                ? await loadLockFile(lockfile)
                                : { names: {} })
    initBuilder(builder, projectJson)
    return { zip, builder }
}

const exportSb3 = async (sb3: Sb3File, path: string): Promise<void> => {
    const projectJson = sb3.builder.json()
    sb3.zip.addFile("project.json", JSON.stringify(projectJson))
    await sb3.zip.writeZip(path)
}

export {
    type Sb3File,
    loadSb3,
    exportSb3,
}