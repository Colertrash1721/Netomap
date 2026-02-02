'use client';

import React from "react";

type InfoCardsProps = {
    title?: string;
    description?: string;
    headers: string[];
    data: any[];
    buttonText: string;
    buttonOnclick: (event: React.MouseEvent) => void;
    renderRow: (row: any) => React.ReactNode;
};

export default function InfoCards({
    title,
    description,
    headers,
    data,
    buttonText,
    buttonOnclick,
    renderRow,
}: InfoCardsProps) {
    return (
        <section className="text-black dark:text-white flex flex-col h-screen justify-center gap-4 items-center">
            <div className="w-[90%] flex justify-end gap-4">
                <button className="p-3 bg-black text-white rounded-lg flex flex-row justify-center items-center gap-1 cursor-pointer" onClick={buttonOnclick}><i className="bx bx-plus-circle"></i>{buttonText}</button>
            </div>
            <div className="w-[90%] h-4/5 bg-white shadow-md p-6 rounded-md overflow-y-auto">
                {title && <h1 className="text-2xl font-bold mb-2">{title}</h1>}
                {description && <p>{description}</p>}

                <table className="w-full mt-6 border-collapse">
                    <thead>
                        <tr className="border-b border-gray-300 text-gray-500">
                            {headers.map((h) => (
                                <th key={h} className="p-4">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i} className="border-b border-gray-300">
                                {renderRow(row)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
