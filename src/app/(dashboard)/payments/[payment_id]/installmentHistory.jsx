"use client"

import { xFetch } from '@/utility/xFetch';
import { useEffect, useState } from 'react';

export default function InstallmentHistory({
    currency = '₹',
    trackingId = '',
    onClose = (e) => { },
}) {

    const [installments, setInstallments] = useState([]);
    const [includeDeleted, setIncludeDeleted] = useState(false)

    useEffect(() => {
        xFetch({
            path: '/services/joinees/getInstallmentTimeLine',
            payload: { trackingId: trackingId }
        }).then(data => {
            setInstallments(data);
        });
    }, [trackingId])

    return (
        <div className='absolute top-0 left-0 w-full h-full flex justify-center items-center bg-black/10'>
            <div className='max-w-[800px] bg-white rounded-md p-4 shadow-md'>
                <div className='flex justify-between items-center border-b border-gray-200 pb-3'>
                    <div className='font-semibold text-lg'>Installment TimeLine | History</div>
                    <div className='flex justify-center items-center gap-4'>
                        <button onClick={() => setIncludeDeleted(prev => !prev)} className='border border-gray-200 bg-gray-50 py-1 px-4 rounded-full text-sm text-gray-500'>{includeDeleted ? 'Hide' : 'Show'} Deleted Records</button>
                        <button onClick={onClose} className='text-xs cursor-pointer'>❌</button>
                    </div>
                </div>

                <span className='bg-gray-100 border-gray-200 '></span>
                <span className='bg-white border-rose-200'></span>

                <div className='flex flex-col gap-2 my-2 h-[60vh] overflow-y-auto'>
                    {installments
                        .filter(item => includeDeleted || item.active !== false)
                        .map((item) => (
                            <div key={item.id} className={`border border-gray-200 p-2 rounded-md ${item.active ? '' : ' bg-rose-50'}`}>
                                <div className='text-xs text-gray-500'>
                                    {item.date_time}
                                    {!item.active && <span className='font-semibold text-rose-500 border-l border-gray-200 pl-2 ml-2'>Deleted Record</span>}
                                </div>
                                <div className='text-base text-gray-600'>
                                    {item.title.replace(/\{\{currency\}\}/g, currency)}
                                </div>
                                <div className='flex justify-start items-center gap-1 text-xs text-gray-600 mt-2'>
                                    <div className={`${item.active ? 'bg-gray-100' : 'bg-white'} p-1 rounded-sm`}>#{item.installment}</div>
                                    <div className={`${item.active ? 'bg-gray-100' : 'bg-white'} p-1 rounded-sm`}>👤 {item.owner}</div>
                                    <div className={`${item.active ? 'bg-gray-100' : 'bg-white'} p-1 rounded-sm`}>📅 {item.date_time}</div>
                                </div>
                            </div>
                        ))}

                </div>
            </div>
        </div>
    );
}