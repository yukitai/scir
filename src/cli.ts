import { loadSb3 } from "./sb3.ts";

const sb3 = await loadSb3("./ScratchOpcodes.zip")
console.dir(sb3.builder.json(), { depth: 10 })