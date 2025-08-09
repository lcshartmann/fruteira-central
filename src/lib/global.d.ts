export {};
import type { Product, Params } from './types'
declare global {
  interface Window {
    api: {
      getProducts: () => Promise<Product[]>;
      addProduct: (p: Params) => Promise<Product>;
      deleteProduct: (id: int) => Promise<Product>;
      updateProduct: (p: Params) => Promise<Product>;
    };
  }
}