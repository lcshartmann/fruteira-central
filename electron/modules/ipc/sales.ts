import { ipcMain } from 'electron'
import { prisma } from '../prisma'

export function registerSaleHandlers() {
  ipcMain.handle('sale:add', async (_event, sale: any) => {
    if (!prisma) throw new Error('Prisma não inicializado')
    return prisma.sale.create({
      data: {
        method: sale.method,
        total: sale.total,
        subtotal: sale.subtotal,
        discount: sale.discount,
        items: { create: sale.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.qty,
          unitPrice: item.unitPrice
        })) }
      },
      include: { items: true }
    })
  })

  ipcMain.handle('sale:getAll', async () => {
    if (!prisma) throw new Error('Prisma não inicializado')
    return prisma.sale.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    })
  })
}
