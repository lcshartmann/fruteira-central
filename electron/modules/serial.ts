import { BrowserWindow } from 'electron'
import { createRequire } from 'module'
const require = await createRequire(import.meta.url)
const { SerialPort, ReadlineParser } = require('serialport')
import { settings } from './ipc/settings'
const scale  = settings.get('devices.scale')
const currentScaleRead = {
  weight: 0,
  lastUpdate: new Date(0)
}
let port: any

export async function setupSerial(mainWindow: BrowserWindow) {
  if (!scale) return
  const ports = await SerialPort.list()
  const updPath = ports.find((p:any) => parseInt(p.productId, 16) === scale?.pid && parseInt(p.vendorId, 16) === scale?.vid).path
  
  port = new SerialPort({
    path: updPath,
    baudRate: scale?.baudRate,
    dataBits: scale?.databits,
    parity: 'none',
    stopBits: 1
  })

  
  port.on('open', () => mainWindow.webContents.send('scale:status', true))
  port.on('close', () => mainWindow.webContents.send('scale:status', false))
  port.on('error', (e: any) => {
    mainWindow.webContents.send('scale:status', false)
    console.log(e)
  })

  const parser = port.pipe(new ReadlineParser({ delimiter: '\r' }))
  parser.on('data', (line: string) => {
    currentScaleRead.weight = Number(Number(line.trim().slice(1)).toFixed(2))
    currentScaleRead.lastUpdate = new Date()

  })
}

export function closePort() {
  if (port && port.isOpen) {
    port.close()
   }
   port.removeAllListeners();
}

export function getCurrentWeight(d: Date) {
  if (!port) throw new Error('Scale not available')
  // if(d> currentScaleRead.lastUpdate) {
  //   throw new Error('No recent weight data')
  // }
  // implementar essa verificação depois
  return currentScaleRead.weight;
}

export function isPortOpen() {
  return port?.isOpen
}

