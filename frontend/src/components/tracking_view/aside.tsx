'use client'
import React, { useEffect, useState } from 'react'
import Icons from '../ui/icons'
import { usePathname } from 'next/navigation'
import useLogout from '@/hooks/auth/useLogout'

type props = {
    menu?: boolean
    children?: React.ReactNode
}

export default function Aside({ menu, children }: props) {
    const { logout } = useLogout();
    const pathname = usePathname();
    const [isHome, setisHome] = useState(true)
    const [admin, setAdmin] = useState(false)

    useEffect(() => {
        pathname === '/tracking_view' ? setisHome(true) : setisHome(false)
    }, [pathname])

     useEffect(() => {
        const rol = localStorage.getItem("rol");
        setAdmin(rol === "true");
    }, []);

    return (
        <>
            <section className={`text-black dark:text-white w-full h-screen block 
            ${menu ? 'translate-x-0 sm:translate-x-0 xs:translate-x-0' : 'translate-x-[-100%] sm:translate-x-[-100%] xs:translate-x-[-100%]'} transition-transform duration-300 absolute lg:static md:static lg:translate-x-0 md:translate-x-0 z-40`}>
                <div className={`${isHome ? "grid grid-cols-[10%_90%]" : ""} h-full w-full bg-gray-100 dark:bg-gray-900`}>
                    <aside className='bg-brand-blue flex flex-col items-center justify-between h-full min-w-[50px]'>
                        <div>
                            <Icons name="bxs-home" link='tracking_view/' />
                            <Icons name="bxs-devices" link='devices' />
                            <Icons name="bx-user-circle" link='drivers' />
                            {admin &&
                                <>
                                    <Icons name="bx-notepad" link='report' />
                                    <Icons name="bxs-truck" link='route' />
                                </> 
                            }
                        </div>
                        <div>
                            <Icons name="bx-door-open" bg={true} onClick={logout} />
                        </div>

                    </aside>
                    {isHome &&
                        <section className='overflow-y-auto custom-scrollbar'>
                            {children}
                        </section>
                    }
                </div>
            </section>
        </>
    )
}
