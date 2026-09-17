'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { xFetch } from '@/utility/xFetch';
import { Corporate } from '@/utility/TinyDB';

export default function Preferences() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [receiptEmailEnabled, setReceiptEmailEnabled] = useState(false);

    useEffect(() => {
        let isMounted = true;

        xFetch({
            path: '/getCorporatePreferences.php'
        })
            .then(data => {
                if (!isMounted) return;
                setReceiptEmailEnabled(Boolean(Number(data?.payment_tracking)));            })
            .catch(error => {
                console.error('Error loading payment preferences', error);
                toast.error('Unable to load preferences, Try again');
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const toggleReceiptEmail = () => {
        const nextValue = !receiptEmailEnabled;
        const previousValue = receiptEmailEnabled;

        // optimistic update
        setReceiptEmailEnabled(nextValue);
        setSaving(true);

        xFetch({
            method: 'POST',
            path: '/updateCorporatePreferences.php',
            isFormData: true,
            payload: new URLSearchParams({
                payment_tracking: nextValue ? 1 : 0
            })
        })
            .then(() => {
                toast(`Receipt Email Notification ${nextValue ? 'enabled' : 'disabled'}`);
            })
            .catch(error => {
                console.error('Error updating payment preferences', error);
                toast.error('Unable to update preference, Try again');
                setReceiptEmailEnabled(previousValue); // rollback
            })
            .finally(() => {
                setSaving(false);
            });
    };

    if (loading) {
        return <div className="text-gray-500 text-sm">Loading preferences...</div>;
    }

    return (
        <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Preferences</h2>

            <div className="flex items-center justify-between border rounded-md p-4 bg-white">
                <div className="pr-4">
                    <div className="font-medium text-gray-800">Receipt Email Notification</div>
                    <div className="text-gray-500 text-sm mt-1">
                        Send receipt email when any installment is paid.
                    </div>
                </div>

                <button
                    role="switch"
                    aria-checked={receiptEmailEnabled}
                    disabled={saving}
                    onClick={toggleReceiptEmail}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                        receiptEmailEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    } ${saving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            receiptEmailEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
            </div>
        </div>
    );
}