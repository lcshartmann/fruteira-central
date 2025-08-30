import { createRequire } from "module";
import { reconnectScale } from "../main";
const require = await createRequire(import.meta.url);
const { usb, getDeviceList, findByIds } = require('usb');
import { ipcMain } from "electron";
const { SerialPort, ReadlineParser } = require('serialport')
import { settings } from "./ipc/settings";
import { closePort } from "./serial";


export function setUSBListener() {
  usb.on('attach', (device: any) => {
   const scale = settings.get('devices.scale');
   if(!scale) return;
    if(device.deviceDescriptor.idVendor === scale.vid && device.deviceDescriptor.idProduct === scale.pid) {
      reconnectScale();
    }
  });

  usb.on('detach', (device: any) => {
    const scale = settings.get('devices.scale');
    if(!scale) return;
    if(device.deviceDescriptor.idVendor === scale.vid && device.deviceDescriptor.idProduct === scale.pid) {
      closePort();
    }
  }
  );
}   

function getDescriptorAsync(device: any, descIndex: number): Promise<string | null> {
  return new Promise((resolve, reject) => {
    if (!descIndex) return resolve(null);
    device.getStringDescriptor(descIndex, (err: Error, data: any) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}



export function registerUSBHandlers() {
  ipcMain.handle('usb:getSerialDevices', async () => {
    const serialDevices = (await SerialPort.list()).filter((d: any) => d.productId);

    const list = await Promise.all(serialDevices.map(async (d: any) => {
      const pid = parseInt(d.productId, 16);
      const vid = parseInt(d.vendorId, 16);
      const path = d.path;
      const usbd = findByIds(vid, pid);

      if (!usbd) return null;

      try {
        usbd.open();

        const manufacturer = await getDescriptorAsync(usbd, usbd.deviceDescriptor.iManufacturer);
        const name = await getDescriptorAsync(usbd, usbd.deviceDescriptor.iProduct);

        return {
          path,
          pid,
          vid,
          name,
          manufacturer
        };

      } catch (e) {
        console.error(`Erro no USB ${vid}:${pid} -`, e);
        return null;
      } finally {
        try { usbd.close(); } catch (e) { }
      }
    }));

    // remove nulos
    return list.filter(Boolean);
  });
}