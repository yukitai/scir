import { NamedId } from "./id.ts";

interface Field {
    name: string,
    value: string,
    id: string | null
}

const ValueField = (name: string, value: string): Field => ({
    name, value, id: null,
})

const NamedIdField = (name: string, namedid: NamedId): Field => ({
    name, value: namedid.name, id: namedid.id,
})

type FieldArray = [string] | [string, null] | [string, string]

const convertFieldToArray = (field: Field): FieldArray => {
    // if (field.id === null) return [field.value]
    return [field.value, field.id]
}

const enum InputType {
    Block           = 0,
    Number          = 4,
    PositiveNumber  = 5,
    PositiveInteger = 6,
    Integer         = 7,
    Angle           = 8,
    Color           = 9,
    String          = 10,
    Broadcast       = 11,
    Variable        = 12,
    List            = 13,
}

interface Input {
    type: InputType,
    array: string[],
    shadowed: Input | null,
    isShadow: boolean,
}

const BlockInput = (id: string): Input => ({
    type: InputType.Block,
    array: [id],
    shadowed: null,
    isShadow: false,
})

type StringOrNumber = string | number

type SimpleInputType = InputType.Number
       | InputType.PositiveNumber
       | InputType.PositiveInteger
       | InputType.Integer
       | InputType.Angle
       | InputType.Color
       | InputType.String

const SimpleInput = (
    type: SimpleInputType,
    value: StringOrNumber,
): Input => ({
    type,
    array: [String(value)],
    shadowed: null,
    isShadow: false,
})

const BroadcastInput = (broadcast: NamedId): Input => ({
    type: InputType.Broadcast,
    array: [broadcast.name, broadcast.id],
    shadowed: null,
    isShadow: false,
})

const VariableInput = (variable: NamedId, x = 0, y = 0): Input => ({
    type: InputType.Broadcast,
    array: [variable.name, variable.id, String(x), String(y)],
    shadowed: null,
    isShadow: false,
})

const ListInput = (list: NamedId, x = 0, y = 0): Input => ({
    type: InputType.Broadcast,
    array: [list.name, list.id, String(x), String(y)],
    shadowed: null,
    isShadow: false,
})

const Shadowed = (input: Input, shadowed: Input): Input => {
    return { ...input, shadowed }
}

type InputItemArray = [InputType.Number
                    | InputType.PositiveNumber
                    | InputType.PositiveInteger
                    | InputType.Integer
                    | InputType.Angle,
                    string]
                | [InputType.Color
                    | InputType.String,
                    string]
                | [InputType.Broadcast, string, string]
                | [InputType.Variable
                    | InputType.List,
                    string, string,
                    number, number]
                | string

type InputArray = [1, InputItemArray] // Shadow
                | [2, InputItemArray] // No Shadow
                | [3, InputItemArray, InputItemArray] // Shadowed

const convertInputToItemArray = (input: Input): InputItemArray => {
    switch (input.type) {
        case InputType.Block:
            return input.array[0]
        case InputType.Number:
            return [InputType.Number, input.array[0]]
        case InputType.PositiveNumber:
            return [InputType.PositiveNumber, input.array[0]]
        case InputType.PositiveInteger:
            return [InputType.PositiveInteger, input.array[0]]
        case InputType.Integer:
            return [InputType.Integer, input.array[0]]
        case InputType.Angle:
            return [InputType.Angle, input.array[0]]
        case InputType.Color:
            return [InputType.Color, input.array[0]]
        case InputType.String:
            return [InputType.String, input.array[0]]
        case InputType.Broadcast:
            return [InputType.Broadcast, input.array[0], input.array[1]]
        case InputType.Variable:
            return [InputType.Variable,
                    input.array[0], input.array[1],
                    parseFloat(input.array[2]),
                    parseFloat(input.array[3])]
        case InputType.List:
            return [InputType.List,
                    input.array[0], input.array[1],
                    parseFloat(input.array[2]),
                    parseFloat(input.array[3])]
    }
}

const convertInputToArray = (input: Input): InputArray => {
    if (!input) return undefined as unknown as InputArray
    if (input.shadowed) {
        return [3,
            convertInputToItemArray(input),
            convertInputToItemArray(input.shadowed)]
    }
    if (input.isShadow)
        return [1, convertInputToItemArray(input)]
    return [2, convertInputToItemArray(input)]
}

const convertItemArrayToInput = (array: InputItemArray): Input => {
    if (typeof array === "string")
        return BlockInput(array)
    switch (array[0]) {
        case InputType.Number:
        case InputType.PositiveNumber:
        case InputType.PositiveInteger:
        case InputType.Integer:
        case InputType.Angle:
        case InputType.Color:
        case InputType.String:
            return SimpleInput(array[0], array[1])
        case InputType.Broadcast:
            return BroadcastInput({
                name: array[1],
                id: array[2],
            })
        case InputType.Variable:
            return VariableInput({
                name: array[1],
                id: array[2],
            }, array[3], array[4])
        case InputType.List:
            return ListInput({
                name: array[1],
                id: array[2],
            }, array[3], array[4])
    }
}

const convertArrayToInput = (array: InputArray): Input => {
    switch (array[0]) {
        case 1: {
            const input = convertItemArrayToInput(array[1])
            input.isShadow = true
            return input
        }
        case 2:
            return convertItemArrayToInput(array[1])
        case 3:
            return Shadowed(
                convertItemArrayToInput(array[1]),
                convertItemArrayToInput(array[2]),
            )
    }
}

const convertArrayToField = (name: string, array: FieldArray): Field => {
    if (!array[1]) return ValueField(name, array[0])
    return NamedIdField(name, { name: array[0], id: array[1] })
}

export {
    type Input,
    type Field,
    type FieldArray,
    type InputArray,
    type SimpleInputType,
    InputType,
    convertInputToArray,
    SimpleInput,
    BlockInput,
    BroadcastInput,
    ListInput,
    VariableInput,
    Shadowed,
    ValueField,
    NamedIdField,
    convertFieldToArray,
    convertArrayToField,
    convertArrayToInput,
}