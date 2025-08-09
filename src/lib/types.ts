export interface Product {
    name: string
    id: string
    inStock: boolean
    price: number
    unitType: 'kg' | 'un'
}

export interface Params {
    name: string
    price: number
    type: string
    id?: Number
    inStock?: boolean
}