import { assert, assertFalse } from "@std/assert";
import { LogLevel, setLogLevel, logIgnored } from "../src/iem.ts";

Deno.test({
    name: "test-iem-ignore",
    fn () {
        setLogLevel(LogLevel.Error)
        assertFalse(logIgnored(LogLevel.Error), "actual: Error, filter: Error")
        assert(logIgnored(LogLevel.Warn), "actual: Warn, filter: Error")
        assert(logIgnored(LogLevel.Info), "actual: Info, filter: Error")
        assert(logIgnored(LogLevel.Help), "actual: Help, filter: Error")
        
        setLogLevel(LogLevel.Warn)
        assertFalse(logIgnored(LogLevel.Error), "actual: Error, filter: Warn")
        assertFalse(logIgnored(LogLevel.Warn), "actual: Warn, filter: Warn")
        assert(logIgnored(LogLevel.Info), "actual: Info, filter: Warn")
        assert(logIgnored(LogLevel.Help), "actual: Help, filter: Warn")
        
        setLogLevel(LogLevel.Info)
        assertFalse(logIgnored(LogLevel.Error), "actual: Error, filter: Info")
        assertFalse(logIgnored(LogLevel.Warn), "actual: Warn, filter: Info")
        assertFalse(logIgnored(LogLevel.Info), "actual: Info, filter: Info")
        assertFalse(logIgnored(LogLevel.Help), "actual: Help, filter: Info")
        
        setLogLevel(LogLevel.Help)
        assertFalse(logIgnored(LogLevel.Error), "actual: Error, filter: Help")
        assertFalse(logIgnored(LogLevel.Warn), "actual: Warn, filter: Help")
        assertFalse(logIgnored(LogLevel.Info), "actual: Info, filter: Help")
        assertFalse(logIgnored(LogLevel.Help), "actual: Help, filter: Help")
    }
})