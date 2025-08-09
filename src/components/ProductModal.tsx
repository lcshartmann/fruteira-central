import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { useRef, useState } from "react";
import type { Product } from "../lib/types";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import type { Params } from "../lib/types";
interface DialogProps {
    open: boolean
    setOpen: (open: boolean) => void
    defaultValues?: Product
    callback: (p: Params) => void
}

export default function ProductModal({open, setOpen, callback, defaultValues}: DialogProps){
    const [type, setType] = useState<string>(defaultValues ? defaultValues.unitType :  'kg');
    const nameRef = useRef<HTMLInputElement>(null);
    const priceRef = useRef<HTMLInputElement>(null);
    const refs = [nameRef, priceRef];

    const handleSubmit = () => {
        let invalidForm = false;
        refs.map((r, i ) => {
            r.current!.classList.remove('invalid');
            if(r.current!.value == ''){
                r.current!.classList.add('invalid')
                invalidForm = true;
            }
            if(i == 1 && Number(r.current!.value) <= 0){
                r.current!.classList.add('invalid')
                invalidForm = true;
            }
        })
        if(invalidForm) return;
        
        const params = {
            id: Number(defaultValues?.id),
            name: nameRef.current!.value.toUpperCase(),
            price: Number(priceRef.current!.value),
            type: type,
        }
        callback(params);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-[400px]" >
                <DialogHeader>
                    <DialogTitle>{defaultValues ? 'Editar produto' : 'Novo produto'}</DialogTitle>
                </DialogHeader>
                <DialogDescription></DialogDescription>
                <div className="w-full flex">
    
                    <div className="h-4/5 w-full p-1 m-1 flex flex-col gap-8">
                    
                            <div className="flex-col px-2">
                            <Label className='my-3' htmlFor='name'>Nome</Label>
                            <Input autoFocus placeholder="Nome do produto" id='name' ref={nameRef} defaultValue={defaultValues? defaultValues.name : ''}  className="col-span-3 uppercase border-slate-600"></Input>
                           {/* {nameRef.current && error > 0 && nameRef.current.classList.contains('invalid') && <div className="text-xs mt-1 text-red-600">This field cannot be blank!</div>} */}
                            </div>
                            <div className="flex" >
                                <div className="flex-col w-2/3 px-2">
                                    <Label className='my-3' htmlFor='price'>Preço</Label>
                                    <Input placeholder="10.00" type='number' min={0.00} id='price' defaultValue={defaultValues? defaultValues.price : 0} ref={priceRef}   className="col-span-3 border-slate-600"></Input>
                                    {/* {refs.priceRef.current && error > 0 && refs.priceRef.current.classList.contains('invalid') && <div className="text-xs mt-1 text-red-600">This field cannot be blank!</div>}
                                    {refs.priceRef.current && error > 0 && refs.priceRef.current.classList.contains('invalidInt') && <div className="text-xs mt-1 text-red-600">The price must be greater than zero</div>} */}
                                </div>
                                <div className="flex-col  px-4">
                                    <Label className="my-3" htmlFor="unit">Tipo unitário</Label>
                                    <RadioGroup onValueChange={setType} className="flex pt-3" defaultValue={defaultValues? defaultValues.unitType : 'kg'}>
                                     <div className="flex items-center gap-3">
                                        <RadioGroupItem className="border-zinc-400" value="kg" id="r1" />
                                        <Label htmlFor="r1">R$/kg</Label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <RadioGroupItem className="border-zinc-400" value="un" id="r2" />
                                        <Label htmlFor="r2">R$/un</Label>
                                    </div>
                                </RadioGroup>
                                </div>
                            </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant='link' onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit}>Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}