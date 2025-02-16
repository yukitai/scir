import { Builder } from "./builder.ts";

interface IR {
    generate(builder: Builder): void
}

export {
    type IR,
}