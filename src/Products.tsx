import debounce from 'lodash/debounce'

import type { Product } from './lib/types';
import { Pencil, Check, Trash } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "./components/ui/scroll-area";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import ProductModal from './components/ProductModal';
import type { Params } from './lib/types';
import { toast } from 'sonner';
import { Switch } from './components/ui/switch';
import { Card, CardContent } from './components/ui/card';

function Products(){
    const [data, setData] = useState<Product[]>([])
    const [queryData, setQueryData] = useState<Product[]>([])
    const [openNewDialog, setopenNewDialog] = useState<boolean>(false)
    const [openEditDialog, setopenEditDialog] = useState<boolean>(false)
    const [productToEdit, setProductToEdit] = useState<Product>();
    const [queryValue, setQuery] = useState('')

    async function deleteProduct(id:string) {
        try {
            const res = await window.api.deleteProduct(id);
            fetchProducts();
        } catch (e) {
            toast.error('Não foi possível deletar o produto', {
                description: <div>{(e as Error).message}</div>
            })
        }
    }

    async function fetchProducts() {
        const data = await window.api.getProducts()
        setData(data)
        setQueryData(data)
    }

    async function createItem(p: Params){
        try {
            const res = await window.api.addProduct(p)
            setopenNewDialog(false)
            fetchProducts()
        } catch (e) {
            toast.error('Não foi possível criar o produto', {
                description: <div>{(e as Error).message}</div>
            })
        }
    }

    async function updateItem(p: Params){
        try {
            const res = await window.api.updateProduct(p)
            setopenEditDialog(false)
            fetchProducts()
        } catch (e) {
            toast.error('Não foi possível criar o produto', {
                description: <div>{(e as Error).message}</div>
            })
        }
    }

    async function toggleItem(id:string) {
        await window.api.toggleProductState(id);
        fetchProducts()
    }

    useEffect(() => {
       
        fetchProducts();
    }, [])

    const queryRef = useRef(null)
    

    
     const handleQuery = (event:any) => {
        setQuery(event.target.value)
    } 


    useEffect(() => {
        const handleQuery = debounce(() => {
            if(queryValue.trim() !== '') {
                const query = data.filter((item: Product) => item.name.toLowerCase().includes(queryValue.toLowerCase()))
                setQueryData(query.sort((a:Product,b:Product) => {
                    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
                }));
            } else {
                setQueryData(data.sort((a:Product,b:Product) => {
                    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
                }));
            }
        }, 200);


        handleQuery();

        return () => {
            handleQuery.cancel();
        };
    }, [queryValue, data]);

    
 
    return(
        <div className="max-w-screen h-11/12">
        <ProductModal open={openEditDialog} setOpen={setopenEditDialog} defaultValues={productToEdit} callback={updateItem}/>
        <ProductModal open={openNewDialog} setOpen={setopenNewDialog} callback={createItem} />
    <div className="w-screen overflow-hidden h-4/5 my-5 mx-auto flex justify-center">
        <div className="w-4/5 max-h-full flex flex-col">
            <div className="w-full my-4 flex">
                <Input ref={queryRef} className='border-2 mr-3' autoFocus placeholder='Pesquisar produto pelo nome' onChange={handleQuery}></Input>
                <Button  onClick={() => setopenNewDialog(true)}>Novo produto</Button>
            </div>
            <div className="max-h-full">
                <ScrollArea className="h-full">
                    <Card>
                        <CardContent>
                            <Table>
                        <TableHeader className="sticky top-0 z-10 bg-primary">
                            <TableRow>
                                <TableHead className="sticky top-0 text-white">Produto</TableHead>
                                <TableHead className="sticky top-0 text-white">Código</TableHead>
                                <TableHead className="sticky top-0 text-white">Preço</TableHead>
                                <TableHead className="sticky top-0 text-white text-center">Disponível?</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                            <TableBody>
                                {queryData.map((item: Product, i) => {
                                    return(
                                        <TableRow key={item.id} className={i%2==0?"bg-":""}>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell>{item.id}</TableCell>
                                            <TableCell>{item.price.toLocaleString('pt-br', {style: 'currency', currency: 'BRL'})}/{item.unitType}</TableCell>
                                            <TableCell className='text-center'><Switch checked={item.inStock} onCheckedChange={() => {toggleItem(item.id)}}/></TableCell>
                                            <TableCell className='flex gap-2'>
                                                <Pencil onClick={() => {setopenEditDialog(true); setProductToEdit(item)}}/>
                                                <Trash className='hover:cursor-pointer' onClick={() => {deleteProduct(item.id)}} />
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                    </Table>
                        </CardContent>
                    </Card>
                </ScrollArea>
            </div>
        </div>
    </div>
</div>
    )
}


export default Products;