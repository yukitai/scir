import { Variable } from "../distributer.ts";

enum StoreType {
    Variable,
    List,
    Stack,
}

enum LayoutType {
    Variable,
    Array,
    Struct,
}

type ValueStorePosition = {
    type: StoreType,
    start: number,
    offsetSize: number,
}

interface TypeLayout {
    type: LayoutType
    position: ValueStorePosition
    isSized(): boolean
    size(): number
    raw: (Variable | null)[]
}

interface VariableLayout extends TypeLayout {
    type: LayoutType.Variable
    name: string
}

interface StructLayout extends TypeLayout {
    type: LayoutType.Struct
    field(field: string): TypeLayout
}

interface ArrayLayout extends TypeLayout {
    type: LayoutType.Array
    staticIndex(idx: number): TypeLayout
    getIndexer(): TypeLayout
}

class NilLayout implements TypeLayout {
    
    type: LayoutType
    position: ValueStorePosition
    raw: never[]

    constructor () {
        this.type = LayoutType.Variable
        this.position = {
            type: StoreType.Variable,
            start: 0,
            offsetSize: 0,
        }
        this.raw = []
    }

    isSized(): boolean { return true }
    size(): number { return 0 }
}

class BinaryLayout implements TypeLayout {
    
    type: LayoutType
    position: ValueStorePosition
    raw: (Variable | null)[]

    constructor () {
        this.type = LayoutType.Variable
        this.position = {
            type: StoreType.Variable,
            start: 0,
            offsetSize: 0,
        }
        this.raw = [ null ]
    }

    isSized(): boolean { return true }
    size(): number { return 1 }
}

export {
    type ValueStorePosition,
    type TypeLayout,
    type VariableLayout,
    type StructLayout,
    type ArrayLayout,
    StoreType,
    LayoutType,
    NilLayout,
    BinaryLayout,
}