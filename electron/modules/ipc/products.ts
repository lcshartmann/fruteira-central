import { ipcMain } from 'electron'
import { prisma } from '../prisma'

export function registerProductHandlers() {
  ipcMain.handle('product:getAll', async () => {
    if (!prisma) throw new Error('Prisma não inicializado')
    return prisma.product.findMany({
      select: { id: true, name: true, price: true, unitType: true, inStock: true }
    })
  })

  ipcMain.handle('product:add', async (_event, p: any) => {
    if (!prisma) throw new Error('Prisma não inicializado')
    return prisma.product.create({
      data: { name: p.name, price: p.price, unitType: p.type, inStock: true }
    })
  })

  ipcMain.handle('product:update', async (_event, p: any) => {
    if (!prisma) throw new Error('Prisma não inicializado')
    return prisma.product.update({
      where: { id: p.id },
      data: { name: p.name, price: p.price, unitType: p.type }
    })
  })

  ipcMain.handle('product:delete', async (_event, id: string) => {
    if (!prisma) throw new Error('Prisma não inicializado')
    return prisma.product.delete({ where: { id } })
  })

  ipcMain.handle('product:toggle', async (_event, id: string) => {
    await prisma.$executeRaw`
      UPDATE "Product"
      SET "inStock" = NOT "inStock"
      WHERE "id" = ${id}
    `
  })
}
