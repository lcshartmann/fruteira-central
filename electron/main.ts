import { app } from 'electron'
import { createWindow } from './modules/windows'
import { initPrisma } from './modules/prisma'
import { setupSerial } from './modules/serial'
import { registerProductHandlers } from './modules/ipc/products'
import { registerSaleHandlers } from './modules/ipc/sales'
import { registerScaleHandlers } from './modules/ipc/scale'
import { registerUSBHandlers, setUSBListener } from './modules/usb'
import { registerSettingsHandlers } from './modules/ipc/settings'

let mainWindow: Electron.BrowserWindow

export const reconnectScale = () => {
  if (mainWindow) {
    setupSerial(mainWindow)
  }
}


app.whenReady().then(async () => {
  await initPrisma()
  mainWindow = createWindow()

  setupSerial(mainWindow)
  setUSBListener();

  registerProductHandlers()
  registerSaleHandlers()
  registerScaleHandlers();
  registerUSBHandlers();
  registerSettingsHandlers();
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
