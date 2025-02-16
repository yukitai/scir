import { assertEquals } from "@std/assert";
import { loadSb3 } from "../src/sb3.ts";

Deno.test({
    name: "test-load-and-export",
    async fn () {
        const sb3 = await loadSb3("./ScratchOpcodes.zip")
        const projectJson = await sb3.zip
                                     .file("project.json")
                                     .async("string")
        const loaded = JSON.parse(projectJson)
        // deno-lint-ignore no-explicit-any
        const exported = sb3.builder.json() as any

        for (const key in loaded) {
            if (key === "targets") continue
            assertEquals(exported[key], loaded[key], key)
        }

        for (const target of loaded.targets) {
            const exportedTarget = exported
                                   .targets
                                   // deno-lint-ignore no-explicit-any
                                   .find((it: any) => it.name === target.name)
            assertEquals(exportedTarget, target, `target ${target.name}`)
        }
    }
})