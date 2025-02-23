import { brightRed, brightGreen, brightYellow, brightWhite, cyan, bold, dim, yellow } from "jsr:@std/fmt/colors"
import { printf, sprintf } from "jsr:@std/fmt/printf"

type Position = [number, number]

interface Span {
    lines: string[],
    range: [Position, Position],
    file?: string,
    extra?: string,
}

enum LogLevel {
    Error = 0,
    Warn = 1,
    Info = 2,
    Help = 2.1,
}

// deno-lint-ignore prefer-const
let LOG_LEVEL = LogLevel.Info

const setLogLevel = (level: LogLevel) => {
    LOG_LEVEL = level
}

const logIgnored = (level: LogLevel): boolean => {
    return Math.floor(level) > Math.floor(LOG_LEVEL)
}

const getLeader = (level: LogLevel): string => {
    switch (level) {
        case LogLevel.Error: return bold(brightRed("error"))
        case LogLevel.Warn: return bold(brightYellow("warn"))
        case LogLevel.Info: return bold(brightWhite("info"))
        case LogLevel.Help: return bold(brightGreen("help"))
    }
}

const renderSpan = (span: Span) => {
    printf("     %s\n", bold(dim("|")))
    const [rangeStart, rangeEnd] = span.range
    for (let line = rangeStart[0]; line <= rangeEnd[0]; ++line) {
        printf(
            "%s %s %s\n",
            bold(dim(sprintf(
                "%4d",
                line + 1,
            ))),
            line > rangeStart[0] && line <= rangeEnd[0]
                ? bold(yellow("|"))
                : bold(dim("|")),
            span.lines[line]
        )
        if (rangeStart[0] === rangeEnd[0]) {
            printf(
                "    %s %s%s %s\n",
                bold(dim(" |")),
                " ".repeat(rangeStart[1]),
                bold(yellow("^".repeat(rangeEnd[1] - rangeStart[1]))),
                yellow(span.extra ?? "")
            )
        } else if (line === rangeStart[0]) {
            printf(
                "     %s%s%s\n",
                bold(yellow("+~")),
                bold(yellow("~".repeat(rangeStart[1]))),
                bold(yellow("^".repeat(span.lines[line].length - rangeStart[1])))
            )
        } else if (line === rangeEnd[0]) {
            printf(
                "     %s%s %s\n",
                bold(yellow("+~")),
                bold(yellow("^".repeat(rangeEnd[1] - 1))),
                yellow(span.extra ?? "")
            )
        }
    }
}

interface SpanView {
    spans: Span[],
    mainSpanId: number,
    extra?: [LogLevel, string],
}

const iem = (
    level: LogLevel,
    messageProvider: string | (() => string),
    span: SpanView,
) => {
    if (logIgnored(level)) return
    const leader = getLeader(level)
    const message = typeof messageProvider === "function"
                    ? messageProvider()
                    : messageProvider
    const mainSpan = span.spans[span.mainSpanId]
    const file = mainSpan.file ?? "anonymous"
    printf(
        "%s: %s\n %s %s:%s:%s\n",
        leader,
        message,
        dim("-->"),
        bold(file),
        cyan(String(mainSpan.range[0][0] + 1)),
        cyan(String(mainSpan.range[0][1])),
    )
    span.spans.forEach(renderSpan)
    if (!span.extra || logIgnored(span.extra[0])) return
    const exLeadeer = getLeader(span.extra[0])
    const exMessage = span.extra[1]
    printf(
        "     %s %s: %s\n",
        bold(dim("=")),
        exLeadeer,
        exMessage,
    )
}

export {
    type Position,
    type Span,
    LogLevel,
    iem,
    logIgnored,
    setLogLevel,
    LOG_LEVEL,
}