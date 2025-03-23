// import { StoreType } from "./compiler/layout.ts";
// import { LayoutType } from "./compiler/layout.ts";
// import { TypeLayout } from "./compiler/layout.ts";
// import { emptySpan, hasError } from "./iem.ts";
// import { InputType } from "./input.ts";
// import { IRCommon } from "./irs/common.ts";
// import { IRConstant } from "./irs/constant.ts";
// import { IRArgument, IRCall, IRDefinition } from "./irs/definition.ts";
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
// const irdef = new IRDefinition(
//     "HelloFunction",
//     {
//         "param1": typeBasic,
//         "param2": typeBasic,
//     },
//     irstack,
//     false,
//     emptySpan(),
// )
// 
// const irarg = new IRArgument(irdef, "param1", emptySpan())
// 
// const ircall = new IRCall(
//     irdef,
//     [irconstant, irarg],
//     emptySpan(),
// )
// 
// irstack.blocks.push(ircall)
// 
// irdef.generate(sb3.builder)
// 
// if (!hasError()) {
//     console.dir(sb3.builder.json(), { depth: 10 })
//     exportSb3(sb3, "./export.sb3")
// }

import { printf } from "jsr:@std/fmt/printf";
import { Lexer } from "./compiler/lexer.ts";
import { Parser } from "./compiler/parser.ts";
import { bold, green, red } from "jsr:@std/fmt/colors";
import { Analyzer } from "./compiler/analyzer.ts";
import { loadSb3, exportSb3 } from "./sb3.ts";

const code = `\
package main

import (
    "looks"
)

var a = 114514
var b = "1919810"

func main() {
}`

const filename = "main.scir"

const lexer = new Lexer(code, filename)

const parser = new Parser([...lexer])

const ast = parser.parse()

if (parser.hasError) {
    printf(
        "%s: at least 1 error found, cannot build `%s`\n",
        bold(red("error")),
        filename,
    )
    Deno.exit(10)
}

// console.log(ast!.preview())

const analyzer = new Analyzer(ast!)
analyzer.analyze()
if (analyzer.hasError) {
    Deno.exit(10)
}
console.log(ast!.preview())

const ir = ast!.generate()

// console.dir(ir, { depth: 10 })

const sb3 = await loadSb3("./template/Template.sb3")

ir.generate(sb3.builder)

console.dir(sb3.builder.json(), { depth: 10 })

exportSb3(sb3, "./export.sb3")

console.log(green(bold("done")))