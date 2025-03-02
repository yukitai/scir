type Iter<T> = T extends string ? string | string[] : T[]

class Stream<T> {

    stream: Iter<T>
    current: number

    constructor (stream: Iter<T>) {
        this.stream = stream
        this.current = 0
    }

    hasNext (): boolean {
        return this.current < this.stream.length
    }

    next (): T {
        return this.stream[this.current++] as T
    }

    peek (): T {
        return this.stream[this.current] as T
    }

    ignore (count: number) {
        this.current += count
    }
}

export {
    Stream
}