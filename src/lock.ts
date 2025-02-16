interface LockFile {
    names: Record<string, Declaration>
}

interface Declaration {
    id: string,
}

const loadLockFile = (path: string): Promise<LockFile> => {
    return Deno.readTextFile(path)
               .then((it) => fromText(it))
}

const fromJson = (json: object): LockFile => {
    return json as LockFile
}

const fromText = (text: string): LockFile => {
    return JSON.parse(text)
}

const exportLockFileToText = (lockfile: LockFile): string => {
    return JSON.stringify(lockfile)
}

export {
    type LockFile,
    loadLockFile,
    fromJson,
    fromText,
    exportLockFileToText,
}