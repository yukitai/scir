import { assertEquals } from "@std/assert/equals";
import { BlockOpcode } from "../src/block.ts";
import { Builder } from "../src/builder.ts";
import { nextId } from "../src/id.ts";
import { BlockInput } from "../src/input.ts";
import { fromJson } from "../src/lock.ts";

Deno.test({
    name: "test-clear-old-generation",
    fn () {
        const builder = new Builder(fromJson({ names: {} }))
        const COND = builder.current.newBlock({
            id: nextId(),
            source: null,
            opcode: BlockOpcode.Operator_Not,
            inputs: {},
            fields: {},
            next: null,
            parent: null,
            isShadow: false,
            isTopLevel: false,
            states: {},
        })
        const IF = builder.current.newBlock({
            id: nextId(),
            source: null,
            opcode: BlockOpcode.Control_If,
            inputs: {
                CONDITION: BlockInput(COND.id),
            },
            fields: {},
            next: null,
            parent: null,
            isShadow: false,
            isTopLevel: true,
            states: { x: 0, y: 0 },
        })
        COND.parent = IF.id

        builder.lockfile = fromJson({
            names: {
                "IF": {
                    id: IF.id
                }
            }
        })
        builder.clearOldGeneration()

        const json = builder.json()

        const expected = {
            targets: [
              {
                isStage: true,
                name: "Stage",
                variables: {},
                lists: {},
                broadcasts: {},
                blocks: {},
                comments: {},
                currentCostume: 1,
                costumes: [],
                sounds: [],
                layerOrder: 0,
                volume: 100
              }
            ],
            monitors: [],
            extensions: [],
            meta: { semver: "3.0.0", vm: "", agent: "" }
          }
        assertEquals(json, expected)
    }
})