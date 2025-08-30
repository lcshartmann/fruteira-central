import { contextBridge, ipcRenderer } from 'electron'
import type { AppConfig, Params, PortData, Sale } from '../src/lib/types'

contextBridge.exposeInMainWorld('api', {
  getProducts: () => ipcRenderer.invoke('product:getAll'),
  addProduct: (p: Params) => ipcRenderer.invoke('product:add', p),
  deleteProduct: (id: string) => ipcRenderer.invoke('product:delete', id),
  updateProduct: (p: Params) => ipcRenderer.invoke('product:update', p),
  toggleProductState: (id: string) => ipcRenderer.invoke('product:toggle', id),
  readScale: (date: Date) => ipcRenderer.invoke('scale:read', date),
  registerSale: (s: Sale) => ipcRenderer.invoke('sale:add', s),
  getSales: () => ipcRenderer.invoke('sale:getAll'),
  getScaleStatus: () => ipcRenderer.invoke('scale:getStatus'),
  getPrinterStatus: () => ipcRenderer.invoke('scale:getStatus'),
  scaleStatus: (callback: (s: boolean) => void) => ipcRenderer.on('scale:status', (_event, status) => callback(status)),
  printerStatus: (callback: (s: boolean) => void) => ipcRenderer.on('ṕrinter:status', (_event, status) => callback(status)),
  getSerialDevices: () => ipcRenderer.invoke('usb:getSerialDevices'),
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
  getSettings: () => ipcRenderer.invoke('settings:getAll'),
  setSetting: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
  setSettings: (value: AppConfig) => ipcRenderer.invoke('settings:setAll', value)
})
