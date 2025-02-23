import { BlockOpcode } from "./block.ts";
import { Target } from "./builder.ts";
import { createSpan } from "./iem.ts";
import { InputType } from "./input.ts";
import { IRBoolean } from "./irs/boolean.ts";
import { IRBranch } from "./irs/branch.ts";
import { IRCommon } from "./irs/common.ts";
import { IRConstant } from "./irs/constant.ts";
import { IRStack } from "./irs/stack.ts";
import { exportSb3 } from "./sb3.ts";
import { loadSb3 } from "./sb3.ts";

const sb3 = await loadSb3("./template/Template2.sb3")

const irtrue = new IRBoolean(true, createSpan([""],[[0,0],[0,0]]))
const irfalse = new IRBoolean(false, createSpan([""],[[0,0],[0,0]]))

const irconstant = new IRConstant(
    InputType.String,
    "Hello, World!",
    createSpan([""],[[0,0],[0,0]]),
)

const ircommon = new IRCommon(
    BlockOpcode.Looks_Say,
    {},
    {
        MESSAGE: irconstant
    },
    createSpan([""],[[0,0],[0,0]]),
)

const irbranch = new IRBranch(
    [
        {
            condition: irfalse,
            substack: new IRStack(
                [
                    ircommon,
                ],
                createSpan([""],[[0,0],[0,0]])
            ),
        },
        {
            condition: irtrue,
            substack: new IRStack(
                [],
                createSpan([""],[[0,0],[0,0]])
            ),
        },
    ],
    new IRStack(
        [
            ircommon,
            ircommon,
        ],
        createSpan([""],[[0,0],[0,0]])
    ),
    createSpan([""],[[0,0],[0,0]])
)

const sp1 = new Target(sb3.builder, "Test1")
sb3.builder.sprites.push(sp1)
sb3.builder.current = sp1 
irbranch.generate(sb3.builder)

const sp2 = new Target(sb3.builder, "Test2")
sb3.builder.sprites.push(sp2)
sb3.builder.current = sp2 
irbranch.generate(sb3.builder)

console.dir(sb3.builder.json(), { depth: 10 })

exportSb3(sb3, "./export.sb3")