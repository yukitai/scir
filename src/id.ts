const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`!@#$%^&*()_+-=[]\\{}|;':\",./<>? "
const indexes = [0]

const nextId = (): string => {
    const id = indexes.map((it) => chars[it]).join("")
    indexes[0] += 1
    for (let i = 0; i < indexes.length; ++i) {
        if (indexes[i] >= chars.length) {
            indexes[i] %= chars.length
            if (i < indexes.length)
                indexes[i + 1] += 1
            else indexes[i + 1] = 0
        }
    }
    return "scir_" + id
}

interface NamedId {
    name: string,
    id: string,
}

export {
    type NamedId,
    nextId,
}