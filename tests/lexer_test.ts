import { assertObjectMatch } from "@std/assert";
import { Lexer } from "../src/compiler/lexer.ts"

Deno.test({
    name: "test-lexer",
    fn () {
        const code = `\
abc _abc abc_ a12 123 1.2 2. "Hello, World!" ( ) [ ] { } # , : ;
package import func __opcode__ while for in repeat until
if else var return true false struct enum type
int float string boolean
+ - * / % ^ == != < <= > >= && || !`
        const lexer = new Lexer(code)
        const tokens = [...lexer]

        const expected = [
            { type: "Identifier", value: "abc" },
            { type: "Identifier", value: "_abc" },
            { type: "Identifier", value: "abc_" },
            { type: "Identifier", value: "a12" },
            { type: "Number", value: "123" },
            { type: "Number", value: "1.2" },
            { type: "Number", value: "2." },
            { type: "String", value: '"Hello, World!"' },
            { type: "LParen", value: "(" },
            { type: "RParen", value: ")" },
            { type: "LBracket", value: "[" },
            { type: "RBracket", value: "]" },
            { type: "LBrace", value: "{" },
            { type: "RBrace", value: "}" },
            { type: "Hash", value: "#" },
            { type: "Comma", value: "," },
            { type: "Colon", value: ":" },
            { type: "Semi", value: ";" },
            { type: "KPackage", value: "package" },
            { type: "KImport", value: "import" },
            { type: "KFunc", value: "func" },
            { type: "K__Opcode__", value: "__opcode__" },
            { type: "KWhile", value: "while" },
            { type: "KFor", value: "for" },
            { type: "KIn", value: "in" },
            { type: "KRepeat", value: "repeat" },
            { type: "KUntil", value: "until" },
            { type: "KIf", value: "if" },
            { type: "KElse", value: "else" },
            { type: "KVar", value: "var" },
            { type: "KReturn", value: "return" },
            { type: "KTrue", value: "true" },
            { type: "KFalse", value: "false" },
            { type: "KStruct", value: "struct" },
            { type: "KEnum", value: "enum" },
            { type: "KType", value: "type" },
            { type: "TInt", value: "int" },
            { type: "TFloat", value: "float" },
            { type: "TString", value: "string" },
            { type: "Identifier", value: "boolean" },
            { type: "OAdd", value: "+" },
            { type: "OSub", value: "-" },
            { type: "OMul", value: "*" },
            { type: "ODiv", value: "/" },
            { type: "OMod", value: "%" },
            { type: "OPow", value: "^" },
            { type: "OEq", value: "==" },
            { type: "ONe", value: "!=" },
            { type: "OLt", value: "<" },
            { type: "OLe", value: "<=" },
            { type: "OGt", value: ">" },
            { type: "OGe", value: ">=" },
            { type: "OAnd", value: "&&" },
            { type: "OOr", value: "||" },
            { type: "ONot", value: "!" },
        ]

        tokens.forEach((it, idx) => {
            assertObjectMatch(it, expected[idx], `Token ${idx}`)
        })
    }
})