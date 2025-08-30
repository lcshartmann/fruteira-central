import { useState, type JSX } from 'react'
import Nav from './components/Nav'
import Products from './Products'
import { Toaster } from './components/ui/sonner'
import POSPage from './Sale'
import type { CartItem } from './lib/types'
import Settings from './Settings'


function App() {
  const [currentTab, setCurrentTab] = useState<string>('Sales')
  const [cart, setCart] = useState<CartItem[]>([]);
  const pages: Record<string, JSX.Element> = {
    Sales: <POSPage cart={cart} setCart={setCart}/>,
    Products: <Products/>,
    Settings: <Settings/>,
  }
  
  document.documentElement.classList.add('dark')
  return (
    <div className='flex flex-col h-screen w-screen'>
      <Toaster richColors position='top-center'/>
      <Nav currentTab={currentTab} setCurrentTab={setCurrentTab}/>
      {pages[currentTab] ?? <div>404</div>}
    </div>
  )
}

export default App
