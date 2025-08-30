export {};
import type { Product, Params, PortData } from './types'
declare global {
  interface Window {
    api: {
      getProducts: () => Promise<Product[]>;
      addProduct: (p: Params) => Promise<Product>;
      deleteProduct: (id: int) => Promise<Product>;
      updateProduct: (p: Params) => Promise<Product>;
      toggleProductState: (id: string) => void;
      readScale: (d: Date) => String;
      registerSale: (s: Sale) => Promise<void>;
      getSales: () => Promise<Sale[]>;
      getScaleStatus: () => Promise<boolean>;
      getPrinterStatus: () => Promise<boolean>;
      scaleStatus: (cb: (b:boolean) => void) => void;
      printerStatus: (cb: (b:boolean) => void) => void;
      getSerialDevices: () => Promise<[]>;
      getSettings: () => Promise<AppConfig>;
      getSetting: (key: string) => Promise<any>;
      setSettings: (s: AppConfig) => Promise<void>;
      setSetting: (key: string, value: any) => Promise<void>;
    };
  }
}