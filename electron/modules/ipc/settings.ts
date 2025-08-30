import store from 'electron-store'
import { ipcMain } from 'electron';
import type { AppConfig  } from '../../../src/lib/types';


export const settings = new store<AppConfig>({
    defaults: {
        theme: 'dark',
        devices: {}
    }
})


export function registerSettingsHandlers() {
    ipcMain.handle('settings:getAll', () => {
        return settings.store;
    });
    ipcMain.handle('settings:get', (event, key: keyof AppConfig) => {
        return settings.get(key);
    });
    
    ipcMain.handle('settings:set', (event, key: keyof AppConfig, value: any) => {
        settings.set(key, value);
        return true;
    });
    
    ipcMain.handle('settings:setAll', (event, value: AppConfig) => {
        settings.store = value;
        return true;
    });
}
