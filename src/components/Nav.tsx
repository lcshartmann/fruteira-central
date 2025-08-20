import clsx from "clsx";

interface NavProps {
    currentTab: string,
    setCurrentTab: (s:string) => void;
}

interface NavBtnProps {
    tabName: string,
    currentTab: string,
    setCurrentTab: (s:string) => void;
}

function NavBtn({tabName, currentTab, setCurrentTab}: NavBtnProps){
    return(
        <button 
            onClick={()=>setCurrentTab(tabName)}
            className={clsx("cursor-pointer font-semibold w-1/5 transition-transform duration-20 ease-in-out hover:bg-opacity-80 hover:underline ", currentTab == tabName && 'border-b-white' )}
            >   
            {tabName}
        </button>
    )
}

function Nav({currentTab, setCurrentTab}: NavProps){
    return(
        <div className="h-1/12 w-full bg-primary flex">
            <NavBtn tabName="Sales" currentTab={currentTab} setCurrentTab={setCurrentTab}/>
            <NavBtn tabName="Products" currentTab={currentTab} setCurrentTab={setCurrentTab}/>
            <NavBtn tabName="Reports" currentTab={currentTab} setCurrentTab={setCurrentTab}/>
            <NavBtn tabName="Settings" currentTab={currentTab} setCurrentTab={setCurrentTab}/>
        </div>
    )
}

export default Nav