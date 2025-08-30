import { app } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
const { createRequire } = await import('module')
const require = createRequire(import.meta.url)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let prisma: any

export async function initPrisma() {
  const dbPath = app.isPackaged
    ? path.join(process.resourcesPath, 'local.db')
    : path.join(__dirname, '../../prisma/local.db')

  process.env.DATABASE_URL = `sqlite:${dbPath}`

  const { PrismaClient } = require('@prisma/client')
  prisma = new PrismaClient()
  return prisma
}

export { prisma }
