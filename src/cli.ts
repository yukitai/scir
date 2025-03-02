// import { StoreType } from "./compiler/layout.ts";
// import { LayoutType } from "./compiler/layout.ts";
// import { TypeLayout } from "./compiler/layout.ts";
// import { emptySpan, hasError } from "./iem.ts";
// import { InputType } from "./input.ts";
// import { IRCommon } from "./irs/common.ts";
// import { IRConstant } from "./irs/constant.ts";
// import { IRStack } from "./irs/stack.ts";
// import { GetVariable, SetVariable } from "./irs/variable.ts";
// import { exportSb3 } from "./sb3.ts";
// import { loadSb3 } from "./sb3.ts";
// 
// const sb3 = await loadSb3("./template/Template2.sb3")
// 
// const typeBasic = {
//     type: LayoutType.Variable,
//     name: "HelloFromScir",
//     position: {
//         type: StoreType.Variable,
//         start: 0,
//         offsetSize: 1,
//     },
//     isSized () { return true },
//     size () { return 1 },
// } as TypeLayout
// 
// const irconstant = new IRConstant(InputType.String, "Hello, World!", emptySpan())
// 
// const irvar = new GetVariable(typeBasic, emptySpan())
// const irset = new SetVariable(typeBasic, irconstant, emptySpan())
// 
// const ircommon = new IRCommon(
//     "looks_say",
//     {},
//     {
//         MESSAGE: irvar,
//     },
//     emptySpan(),
// )
// 
// const irstack = new IRStack([
//     irset,
//     ircommon,
//     ircommon,
// ], emptySpan())
// 
// irstack.generate(sb3.builder)
// 
// if (!hasError()) {
//     console.dir(sb3.builder.json(), { depth: 10 })
//     exportSb3(sb3, "./export.sb3")
// }

import { Lexer } from "./compiler/lexer.ts";

const code = `\
#[event.KeyPressed("any")]
func main() {
    looks.Say("Hello, World!")
}`

const lexer = new Lexer(code, "main.scir")

const tokens = [...lexer]
tokens.forEach((it) => console.dir(it, { depth: 0 }))