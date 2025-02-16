import { assertNotEquals } from "@std/assert";
import { nextId } from "../src/id.ts";

Deno.test({
    name: "test-id-generation",
    fn () {
        let lastId = nextId()
        for (let i = 0; i < 1000; ++i) {
            const id = nextId()
            assertNotEquals(id, lastId)
            lastId = id
        }
    }
})