import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Search, Trash2, CreditCard, Barcode, Percent, X, Plus, Minus, ReceiptText, ScanLine, Calculator, ArrowRightLeft, Printer, WalletMinimal, Weight } from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./components/ui/dialog";
import { Label } from "./components/ui/label";
import { Badge } from "./components/ui/badge";
import { ScrollArea } from "./components/ui/scroll-area";
import type { Product, CartItem } from "./lib/types";
import clsx from "clsx";




/**
 * POS (PDV) — Página única em React
 * - Busca por produto (nome/sku)
 * - Entrada por leitor de código de barras (SKU)
 * - Suporte a itens por peso (kg) e unitários
 * - Teclado numérico para quantidade/peso e preço rápido
 * - Atalhos de teclado: F2 focar SKU, F4 Pagamento, DEL remover item, +/− quantidade, Ctrl+D desconto, Ctrl+N nova venda
 * - Desconto por item e por venda (% ou valor)
 * - Cálculo de subtotal, taxa/ICMS estimada e total
 * - Modal de pagamento (dinheiro/cartão/misto), troco e finalizar
 * - Impressão de comprovante/simplificado
 *
 * Observação: esta é uma UI funcional em memória. Integre com seu backend (Electron/Prisma) conectando handlers
 * de add/remove, fechamento de venda e impressão conforme necessário.
 */


// --- Utilidades ---
const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const uuid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// Hook simples para atalhos
function useHotkeys(map: Record<string, (e: KeyboardEvent) => void>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = [e.ctrlKey ? "Ctrl+" : "", e.altKey ? "Alt+" : "", e.shiftKey ? "Shift+" : "", e.key === " " ? "Space" : e.key]
        .join("")
        .replace("+", "+");
      if (map[key]) {
        map[key](e);
      }
      if (map[e.key]) {
        map[e.key](e);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [map]);
}

export default function POSPage({cart, setCart}: {cart: CartItem[], setCart: React.Dispatch<React.SetStateAction<CartItem[]>>}) {
  const [catalog, setCatalog] = useState<Product[]>();
  const [query, setQuery] = useState("");
  const [sku, setSku] = useState("");
  const [discountSaleValue, setDiscountSaleValue] = useState(0); // desconto total em R$
  const [discountSalePercent, setDiscountSalePercent] = useState(0); // %
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'pix'>('cash');
  const [isScaleConnected, setScaleStatus] = useState<boolean>(false);
  const [isPrinterConnected, setPrinterStatus] = useState<boolean>(false);
  const skuRef = useRef<HTMLInputElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  

  // Focar no SKU ao carregar e escutar status de periféricos
  useEffect(() => {
    skuRef.current?.focus();
    
    const getStatus = async () => {
      const scale = await window.api.getScaleStatus();
      const printer = await window.api.getPrinterStatus();
      setScaleStatus(scale);
      setPrinterStatus(printer);
    }
    getStatus();
    window.api.scaleStatus(setScaleStatus);
    window.api.printerStatus(setPrinterStatus);
  }, []);

  // Filtragem por nome
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog!.filter(p => p.name.toLowerCase().includes(q) || String(p.id).includes(q));
  }, [catalog, query]);


  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.qty * i.unitPrice - i.discount, 0), [cart]);
  const saleDiscount = useMemo(() => subtotal * (discountSalePercent / 100) + discountSaleValue, [subtotal, discountSalePercent, discountSaleValue]);
  const total = Math.max(subtotal - saleDiscount, 0);
  

  // Handlers
  const addToCart = (p: Product, qty = 1) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.productId === p.id && i.unitPrice === p.price);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [
        ...prev,
        { id: uuid(), productId: p.id, productName: p.name, unitType: p.unitType, qty, unitPrice: p.price, discount: 0 },
      ];
    });
  };

  const addBySku = async () => {
    const code = sku.trim();
    if (!code) return;
    const found = catalog!.find(p => p.id == code);
    if (found){
      let weight;
      if(found.unitType === "kg"){
        weight = await readScale();
        if(Number(weight) <= 0) return
      }
      addToCart(found, found.unitType === "kg" ? Number(weight) : 1)
    }
    setSku("");
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const changeQty = (id: string, delta: number) => setCart(prev => prev.map(i => (i.id === id ? { ...i, qty: Math.max(0, +(i.qty + delta).toFixed(3)) } : i)));
  const setQty = (id: string, qty: number) => setCart(prev => prev.map(i => (i.id === id ? { ...i, qty: Math.max(0, +qty.toFixed(3)) } : i)));
  const setItemDiscountValue = (id: string, value: number) => setCart(prev => prev.map(i => (i.id === id ? { ...i, discount: Math.max(0, +value.toFixed(2)) } : i)));

  const newSale = async () => {
    setCart([]);
    setDiscountSalePercent(0);
    setDiscountSaleValue(0);
    setPayAmount(0);
    setPayMethod('cash');
    skuRef.current?.focus();
  };

  const finalizePayment = async () => {
    
    const sale = {
      method: payMethod,
      subtotal,
      discount: saleDiscount,
      total,
      items: cart
    }
    const res = await window.api.registerSale(sale)
    newSale();
    setPayOpen(false);
  };

  // Atalhos
  useHotkeys({
    "F2": (e) => { e.preventDefault(); skuRef.current?.focus(); },
    "F4": (e) => { e.preventDefault(); setPayOpen(true); setPayAmount(total); },
    "Delete": (e) => { if (cart.length) removeItem(cart[cart.length - 1].id); },
    "+": (e) => { if (cart.length) changeQty(cart[cart.length - 1].id, +1); },
    "-": (e) => { if (cart.length) changeQty(cart[cart.length - 1].id, -1); },
    "Ctrl+d": (e) => { e.preventDefault(); setDiscountSalePercent(5); },
    "Ctrl+n": (e) => { e.preventDefault(); newSale(); },
  });

  const change = Math.max(payAmount - total, 0);

  async function fetchProducts() {
        const data = await window.api.getProducts()
        const avaliableProducts = data.filter((p) => p.inStock == true)
        setCatalog(avaliableProducts);
    }
  
  async function readScale(){
    const maxRetries = 5;
    const delay = 500 //ms
    let attempt = 0;
    while(attempt < maxRetries){
      try {
        const weight = await window.api.readScale(new Date());
        return weight;
      } catch (error) {
        if(error instanceof Error && error.message === 'No recent weight data' ){
          attempt++;
          await new Promise(res => setTimeout(res, delay));
        } else{
        alert("Erro ao ler balança: " + error);
        return 0;
        }
      }
  }
  alert("Não foi possível ler o peso da balança. Verifique a conexão.");
  return 0;
}
    useEffect(() => {
        fetchProducts();
    },[])

  return (
    <div className="h-full w-full bg-background text-foreground p-4 md:p-6">
      <div className="mx-auto grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Coluna esquerda: Busca e catálogo */}
        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl"><Search className="h-5 w-5"/>Buscar produto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    ref={searchRef}
                    placeholder="Nome ou SKU"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="text-lg"
                  />
                  <Button variant="secondary" onClick={() => setQuery("")}>Limpar</Button>
                </div>
                <div className="text-xs text-muted-foreground">Dica: F2 foca o campo de código de barras, F4 abre o pagamento.</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl"><Barcode className="h-5 w-5"/>Código/SKU</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    ref={skuRef}
                    placeholder="Aproxime o leitor e escaneie"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addBySku(); }}
                    className="text-lg"
                    autoCapitalize="off"
                    autoCorrect="off"
                  />
                  <Button onClick={addBySku} className="whitespace-nowrap">Adicionar</Button>
                </div>
                <div className="text-xs text-muted-foreground">Leitor de código de barras envia ENTER automaticamente ao fim do código.</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between gap-2 text-xl">
                <div className="flex items-center gap-2">
                  <ScanLine className="h-5 w-5"/>Catálogo
                  <div>{filtered ? `(${filtered.length} de ${catalog?.length || 0})` : ''}</div>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1 mx-1"><div className={clsx('w-2 h-2 rounded-full', isScaleConnected ? 'bg-green-500' : 'bg-red-500')}/> Balança </div> /
                  <div className="flex items-center gap-1 mx-1"><div className={clsx('w-2 h-2 rounded-full', isPrinterConnected ? 'bg-green-500' : 'bg-red-500')}/> Impressora</div>
                </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 pr-2">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filtered && filtered!.map(p => (
                    <motion.button
                      key={p.id}
                      onClick={async () => {
                        if(p.unitType === "kg"){
                          const weight = await readScale();
                          if(Number(weight) > 0) return
                          addToCart(p, Number(weight))
                        } else {  
                          addToCart(p, 1)}}
                        }
                      whileTap={{ scale: 0.98 }}
                      className="text-left rounded-2xl border p-3 hover:shadow focus:outline-none focus:ring"
                    >
                      <div className="font-medium leading-tight">{p.name}</div>
                      <div className="text-xs text-muted-foreground">SKU {p.id} • {p.unitType === 'kg' ? 'Kg' : 'Un'}</div>
                      <div className="mt-1 text-lg">{currency(p.price)} {p.unitType === 'kg' ? '/kg' : ''}</div>
                    </motion.button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita: Carrinho */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl"><ShoppingCart className="h-5 w-5"/>Carrinho</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <ScrollArea className="h-72 pr-2">
                  <div className="space-y-2">
                    {cart.length === 0 && (
                      <div className="text-sm text-muted-foreground">Nenhum item. Selecione um produto ou escaneie um código.</div>
                    )}
                    {cart.map((i) => (
                      <div key={i.id} className="grid grid-cols-12 items-center gap-2 p-2 rounded-xl border">
                        <div className="col-span-5">
                          <div className="font-medium leading-tight">{i.productName}</div>
                          <div className="text-xs text-muted-foreground">SKU {i.productId} • {i.unitType === 'kg' ? 'Kg' : 'Un'}</div>
                        </div>
                        <div className="col-span-4 flex items-center gap-1">
                          <Button size="icon" variant="outline" onClick={() => changeQty(i.id, - (i.unitType === 'kg' ? 0.050 : 1))}><Minus className="h-4 w-4"/></Button>
                          <Input
                            value={i.qty}
                            onChange={e => setQty(i.id, Number(e.target.value) || 0)}
                            className="text-center text-white"
                          />
                          <Button size="icon" variant="outline" onClick={() => changeQty(i.id, (i.unitType === 'kg' ? 0.050 : 1))}><Plus className="h-4 w-4"/></Button>
                        </div>
                        <div className="col-span-2 text-right">
                          <div className="text-sm">{currency(i.unitPrice)}</div>
                          <div className="text-xs text-muted-foreground">{i.unitType === 'kg' ? '/kg' : '/un'}</div>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button size="icon" variant="ghost" onClick={() => removeItem(i.id)}><Trash2 className="h-4 w-4"/></Button>
                        </div>
                        <div className="col-span-12 flex items-center gap-2 text-xs">
                          <Percent className="h-3 w-3"/>
                          <span>Desconto (R$)</span>
                          <Input className="h-7 w-28" value={i.discount} onChange={e => setItemDiscountValue(i.id, Number(e.target.value) || 0)} />
                          <Badge variant="secondary" className="ml-auto">Linha: {currency(Math.max(i.qty * i.unitPrice - i.discount, 0))}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Totais */}
                <div className="space-y-2 border-t pt-3">
                  <div className="flex justify-between text-sm"><span>Subtotal</span><span>{currency(subtotal)}</span></div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>Desconto (%)</span>
                    <Input className="h-8 w-20" value={discountSalePercent} onChange={e => setDiscountSalePercent(Number(e.target.value) || 0)} />
                    <span>Desconto (R$)</span>
                    <Input className="h-8 w-24" value={discountSaleValue} onChange={e => setDiscountSaleValue(Number(e.target.value) || 0)} />
                    <span className="ml-auto">({currency(saleDiscount)})</span>
                  </div>
                  
                  <div className="flex justify-between text-lg font-semibold border-t pt-2"><span>Total</span><span>{currency(total)}</span></div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={() => { setPayAmount(total); setPayOpen(true); }}>
                    <CreditCard className="h-4 w-4 mr-2"/> Pagamento (F4)
                  </Button>
                  <Button variant="secondary" onClick={newSale}><ArrowRightLeft className="h-4 w-4 mr-2"/>Nova venda (Ctrl+N)</Button>
                </div>
              </div>
            </CardContent>
          </Card>

         
        </div>
      </div>

      {/* Modal de Pagamento */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><WalletMinimal className="h-5 w-5"/>Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button variant={payMethod === 'cash' ? 'default' : 'outline'} onClick={() => setPayMethod('cash')}>Dinheiro</Button>
              <Button variant={payMethod === 'card' ? 'default' : 'outline'} onClick={() => setPayMethod('card')}>Cartão</Button>
              <Button variant={payMethod === 'pix' ? 'default' : 'outline'} onClick={() => setPayMethod('pix')}>Pix</Button>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-28">Recebido (R$)</Label>
              <Input value={payAmount} onChange={e => setPayAmount(Number(e.target.value) || 0)} />
            </div>
            <div className="flex justify-between text-sm">
              <span>Total</span><span>{currency(total)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <span>Troco</span><span>{currency(change)}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 50, 100].map(v => (
                <Button key={v} variant="secondary" onClick={() => setPayAmount(prev => +(prev + v).toFixed(2))}>+{currency(v)}</Button>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="secondary" onClick={() => window.print?.()}><Printer className="h-4 w-4 mr-2"/>Imprimir prévia</Button>
            <Button onClick={finalizePayment}><ReceiptText className="h-4 w-4 mr-2"/>Finalizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
