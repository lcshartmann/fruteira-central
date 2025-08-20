import { ipcMain, app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
const { createRequire } = await import("module");
const require2 = createRequire(import.meta.url);
const { SerialPort, ReadlineParser } = require2("serialport");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let prisma;
let currentWeight = 0;
async function initPrisma() {
  const dbPath = app.isPackaged ? path.join(process.resourcesPath, "local.db") : path.join(__dirname, "../../prisma/local.db");
  process.env.DATABASE_URL = `sqlite:${dbPath}`;
  const { PrismaClient } = require2("@prisma/client");
  prisma = new PrismaClient();
}
const port = new SerialPort({
  path: "COM8",
  baudRate: 4800,
  dataBits: 8,
  parity: "none",
  stopBits: 1
});
const parser = port.pipe(new ReadlineParser({ delimiter: "\r" }));
parser.on("data", (line) => {
  currentWeight = Number(Number(line.trim().slice(1)).toFixed(2));
});
ipcMain.handle("product:getAll", async () => {
  if (!prisma) throw new Error("Prisma não inicializado");
  return await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      unitType: true,
      inStock: true
    }
  });
});
ipcMain.handle("product:add", async (_event, p) => {
  if (!prisma) throw new Error("Prisma não inicializado");
  const res = await prisma.product.create({ data: {
    name: p.name,
    price: p.price,
    unitType: p.type,
    inStock: true
  } });
  return res;
});
ipcMain.handle("product:delete", async (_event, id) => {
  if (!prisma) throw new Error("Prisma não inicializado");
  return await prisma.product.delete({
    where: {
      id
    }
  });
});
ipcMain.handle("product:update", async (_event, p) => {
  if (!prisma) throw new Error("Prisma não inicilizado");
  const res = await prisma.product.update({
    where: {
      id: p.id
    },
    data: {
      name: p.name,
      price: p.price,
      unitType: p.type
    }
  });
  return res;
});
ipcMain.handle("product:toggle", async (_event, id) => {
  await prisma.$executeRaw`
  UPDATE "Product"
  SET "inStock" = NOT "inStock"
  WHERE "id" = ${id}
`;
});
ipcMain.handle("scale:read", () => {
  if (!currentWeight) throw new Error("Scale not avaliable");
  return currentWeight;
});
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: true
    }
  });
  if (!app.isPackaged) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
app.whenReady().then(async () => {
  await initPrisma();
  createWindow();
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
