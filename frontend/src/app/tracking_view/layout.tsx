'use client';
import dynamic from 'next/dynamic';
import { usePathname } from "next/navigation";
import { useRouter } from 'next/navigation';

import Aside from '@/components/tracking_view/aside';
import { useEffect, useState } from 'react';
import { pingService } from '@/services/auth/ping';
import useLogout from '@/hooks/auth/useLogout';
const ClientRouteMap = dynamic(() => import('@/components/tracking_view/mapRoute'), { ssr: false });
const ControlPanel = dynamic(() => import('@/components/tracking_view/controlPanel'), { ssr: false });
const ClientMap = dynamic(() => import('@/components/tracking_view/map'), { ssr: false });


export default function Layout({ children }: { children: React.ReactNode }) {
    const { logout } = useLogout();
    const pathname = usePathname()
    const router = useRouter();
    const [menu, setmenu] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            try {
                await pingService()
            } catch (error) {
                router.push('/')
            }
        }
        checkSession();

        const interval = setInterval(checkSession, 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, [])


    return (
        <main className="min-h-screen w-full">
            {pathname === '/tracking_view' ? (
                <>
                    <div className="grid lg:grid-rows-1 md:grid-rows-1 grid-rows-[5vh_95vh] h-screen w-full bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
                        <section className='lg:hidden md:hidden flex w-full p-4 text-white text-3xl justify-between bg-brand-blue items-center'>
                            <i className='bx bx-menu cursor-pointer' onClick={(e) => setmenu(!menu)}></i>
                            <i className='bx bx-door-open bg-red-500 p-1 rounded cursor-pointer' onClick={logout}></i>
                        </section>
                        <section className='grid lg:grid-cols-[35%_65%] md:grid-cols-2 grid-cols-1 w-full h-full'>
                            <Aside menu={menu}>
                                <ControlPanel />
                            </Aside>
                            <section className='p-4 overflow-hidden'>
                                <ClientMap />
                            </section>
                        </section>
                    </div>

                </>
            ) : pathname === '/tracking_view/route' ? (
                <div className="grid lg:grid-rows-1 md:grid-rows-1 grid-rows-[5vh_95vh] h-screen w-full bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
                    <section className='lg:hidden md:hidden flex w-full p-4 text-white text-3xl justify-between bg-brand-blue items-center'>
                        <i className='bx bx-menu cursor-pointer' onClick={(e) => setmenu(!menu)}></i>
                        <i className='bx bx-door-open bg-red-500 p-1 rounded cursor-pointer' onClick={logout}></i>
                    </section>
                    <section className='grid lg:grid-cols-[3%_97%] md:grid-cols-2 grid-cols-1 w-full h-full'>

                        <Aside menu={menu} />
                        <section className='p-4 overflow-hidden'>
                            <ClientRouteMap />
                        </section>
                    </section>
                </div>) :
                <div className="grid md:grid-rows-1 sm:grid-rows-[5vh_95vh] xs:grid-rows-[5vh_95vh] h-screen w-full bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
                    <section className='lg:hidden md:hidden flex w-full p-4 text-white text-3xl justify-between bg-brand-blue items-center'>
                        <i className='bx bx-menu cursor-pointer' onClick={(e) => setmenu(!menu)}></i>
                        <i className='bx bx-door-open bg-red-500 p-1 rounded cursor-pointer' onClick={logout}></i>
                    </section>
                    <section className='grid lg:grid-cols-[3%_97%] md:grid-cols-2 grid-cols-1 w-full h-full'>
                        <Aside menu={menu} />
                        {children}
                    </section>
                </div>
            }
        </main>
    );
}