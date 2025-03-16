import { brightRed, brightGreen, brightYellow, brightWhite, cyan, bold, dim, yellow } from "jsr:@std/fmt/colors"
import { printf, sprintf } from "jsr:@std/fmt/printf"
import { DEBUG } from "./env.ts";

type Position = [number, number]

interface Span {
    lines: string[],
    range: [Position, Position],
    file?: string,
    extra?: string,
}

/**
 * safety: `a < b`
 */
const mergeSpan = (a: Span, b: Span): Span => {
    return {
        lines: a.lines,
        range: [a.range[0], b.range[1]],
    }
}

const previewSpanShort = (span: Span): string => {
    return `Span([${span.range[0]}], [${span.range[1]}])`
}

enum LogLevel {
    Error = 0,
    Warn = 1,
    Info = 2,
    Help = 2.1,
}

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

let HAS_ERROR = false

const hasError = () => HAS_ERROR

const iem = (
    level: LogLevel,
    messageProvider: string | (() => string),
    span: SpanView,
) => {
    if (logIgnored(level)) return
    if (DEBUG) {
        printf("(%s %s)\n", bold(yellow("@:")), cyan(new Error().stack ?? ""))
    }
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

    if (level === LogLevel.Error)
        HAS_ERROR = true
}

const createSpan = (
    lines: string[],
    range: [Position, Position],
    file?: string,
    extra?: string
): Span => {
    return { lines, range, file, extra }
}

const emptySpan = (): Span => ({
    lines: [""],
    range: [[0, 0], [0, 0]],
})

const createSpanView = (
    spans: Span[],
    mainSpanId: number,
    extra?: [LogLevel, string],
): SpanView => {
    return { spans, mainSpanId, extra }
}

const indented = (indent: number, text: string): string => {
    return "  ".repeat(indent) + text
}

export {
    type Position,
    type Span,
    LogLevel,
    iem,
    logIgnored,
    setLogLevel,
    createSpan,
    createSpanView,
    emptySpan,
    hasError,
    mergeSpan,
    previewSpanShort,
    indented,
    LOG_LEVEL,
    HAS_ERROR,
}