import { ipcMain } from 'electron'
import { getCurrentWeight, isPortOpen } from '../serial'

export function registerScaleHandlers() {
  ipcMain.handle('scale:getStatus', () => {
    return isPortOpen()
  })

  ipcMain.handle('scale:read', (_event, date: Date) => {
    return getCurrentWeight(date)
  })
}


