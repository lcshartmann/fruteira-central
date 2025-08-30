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

export interface ItemSale {
    id: string
    productId: Number
    productName: string
    quantity: Number
    unitaryPrice: Number
}

export type CartItem = {
  id: string; // uuid da linha
  productId: string;
  productName: string;
  unitType:  "un" | "kg";
  qty: number; // unidades ou kg
  unitPrice: number; // preço por unidade/kg
  discount: number; // valor absoluto por linha (R$)
 };

 export type PortData = {
   path: string,
   baudrate: number,
   databits: number
 }

 export type Sale = {
    method: 'cash' | 'card' | 'pix',
    subtotal: number,
    discount: number,
    total: number,
    items: CartItem[]
}

export interface AppConfig {
    theme: 'light' | 'dark';
    devices: { 
        scale?: {
            name: string,
            pid: number,
            vid: number,
            path: string,
            baudRate: number,
            databits: number,
        }
}
}