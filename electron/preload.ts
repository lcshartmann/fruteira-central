import { contextBridge, ipcRenderer } from 'electron'
import type { Params } from '../src/lib/types'

contextBridge.exposeInMainWorld('api', {
  getProducts: () => ipcRenderer.invoke('product:getAll'),
  addProduct: (p: Params) => ipcRenderer.invoke('product:add', p),
  deleteProduct: (id: string) => ipcRenderer.invoke('product:delete', id),
  updateProduct: (p: Params) => ipcRenderer.invoke('product:update', p)
})
