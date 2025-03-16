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
    raw: Variable[]
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

export {
    type ValueStorePosition,
    type TypeLayout,
    type VariableLayout,
    type StructLayout,
    type ArrayLayout,
    StoreType,
    LayoutType,
}