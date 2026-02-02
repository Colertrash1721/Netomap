"use client"
import React from 'react'
import useInputState from '@/hooks/auth/useInputState'
import ItemListLayout from './itemListLayout';

export default function ControlPanel() {
    const [value, setValue] = React.useState<string>("");
    const hadValue = useInputState(value, "Buscar dispositivo");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
    };
    return (
        <>
            <div className="flex flex-col w-full h-full justify-around items-start bg-gray-100 dark:bg-gray-800">
                <div className="relative flex p-4 items-center justify-start w-full min-w-[400px]">
                    <label className={`absolute t-0 ${hadValue.hadValue ? 'text-transparent' : 'text-black'} pointer-events-none`}><i className='bx bx-search ml-2 flex items-center mr-2'></i>Buscar dispositivo</label>
                    <input type="text" className='bg-gray-200 rounded-lg p-4 w-full shadow-lg' onChange={e => handleInputChange(e)} />
                </div>
                <div className="list flex flex-col justify-start w-full h-full p-3 overflow-y-auto">
                    <ItemListLayout filter={value}/>
                </div>
            </div>
        </>
    )
}
