// src/electron/main.ts
import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Params } from '../src/lib/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let prisma: any

async function initPrisma() {
  const dbPath = app.isPackaged
    ? path.join(process.resourcesPath, 'local.db')
    : path.join(__dirname, '../../prisma/local.db')

  process.env.DATABASE_URL = `sqlite:${dbPath}`

  const { createRequire } = await import('module')
  const require = createRequire(import.meta.url)
  const { PrismaClient } = require('@prisma/client')
  prisma = new PrismaClient()
}


ipcMain.handle('product:getAll', async () => {
  if (!prisma) throw new Error('Prisma não inicializado')
  return await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      unitType: true,
      inStock: true
    }
  });
})

ipcMain.handle('product:add', async (_event ,p: Params) => {
  if (!prisma) throw new  Error('Prisma não inicializado')
    console.log(typeof p.price)
  const res = await prisma.product.create({data: {
      name:p.name,
      price:p.price,
      unitType:p.type,
      inStock:true
  }});
  return res;
})

ipcMain.handle('product:delete', async (_event, id: string) => {
  if (!prisma) throw new Error('Prisma não inicializado')
  try {
    return await prisma.product.delete({
    where: {
      id: id
    }
    })
  } catch (e) {
    return e
  }
  

})

ipcMain.handle('product:update', async (_event, p: Params) => {
  if(!prisma) throw new Error('Prisma não inicilizado')
  try {
      const res = await prisma.product.update({
      where: {
        id: p.id
      },
      data: {
        name: p.name,
        price: p.price,
        unitType: p.type,
      }
    })
    return res;
  } catch (e) {
    return e;
  }
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
    },
  })

  if (!app.isPackaged) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html')) // vite build output
  }
}

app.whenReady().then(async () => {
  await initPrisma()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
