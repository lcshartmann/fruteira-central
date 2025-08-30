import { Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Select, SelectTrigger, SelectGroup, SelectValue, SelectContent, SelectLabel, SelectItem } from "./components/ui/select";
import { useEffect, useRef, useState } from "react";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import type { AppConfig } from "./lib/types";


export default function Settings() {
    type Device = { name: string; pid: string | number; vid: string | number; path: string };
    const [devices, setDevices] = useState<Device[]>([]);
    const [settings, setSettings] = useState<AppConfig>();
    const [scaleName, setScaleName] = useState<string>('');
    const baudRef = useRef<HTMLInputElement>(null);
    const dataRef = useRef<HTMLInputElement>(null);

    async function fetchUSBDevices() {
        const d = await window.api.getSerialDevices();
        setDevices(d);
    }

    async function  fetchSettings() {
        const s = await window.api.getSettings();
        setSettings(s);
        setScaleName(s?.devices.scale?.name || '');
    }   

    async function handleSave() {
        const scale = devices.find((d:any) => d.name === scaleName);
        const baudrate = baudRef.current?.value
        const databits = dataRef.current?.value

        if(!scale || !baudrate || !databits) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        const newSettings: AppConfig = {
            ...settings!,
            devices: {
                ...settings?.devices,
                scale: {
                    name: scale.name,
                    pid: Number(scale.pid),
                    vid: Number(scale.vid),
                    path: scale.path,
                    baudRate: Number(baudrate),
                    databits: Number(databits)
                } 
                }}
            await window.api.setSettings(newSettings)
            }

    useEffect(() => {
        fetchUSBDevices();
        fetchSettings();
    }, []);
  return (
    <div className="flex-l m-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg text-bold"> <Settings2/> Configurações</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-3 mx-16">
                        <h2 className="text-xl">Dispositivos</h2>
                        <hr></hr>
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3>Porta serial da balança</h3>
                                    <p className="text-muted-foreground text-sm">Escolha o dispositivo que deseja utilizar para pesagem.</p>
                                </div>
                                <Select onValueChange={setScaleName} value={settings?.devices.scale && settings.devices.scale?.name}>
                                    <SelectTrigger className="w-[250px]">
                                        <SelectValue placeholder="Selecione um dispositivo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Dispositivos</SelectLabel>
                                            {devices && devices.map((d:any) => {
                                                return <SelectItem value={d.name}>{d.name}</SelectItem>
                                            })}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3>Baudrate</h3>
                                    <p className="text-muted-foreground text-sm">Velocidade de transmissão dos dados entre balança e computador.</p>
                                </div>
                                <Input ref={baudRef} type="number" defaultValue={settings?.devices.scale && settings.devices.scale?.baudRate} placeholder="4800" className="w-[250px]"></Input>
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3>Data bits</h3>
                                    <p className="text-muted-foreground text-sm">Número de bits de dado por byte.</p>
                                </div>
                                <Input ref={dataRef} type="number" defaultValue={settings?.devices.scale && settings.devices.scale?.databits} placeholder="8" className="w-[250px]"></Input>
                            </div>
                        </div>
                        <Button className="self-end mt-4" onClick={handleSave}>Salvar</Button>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}