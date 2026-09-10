"use client"

import Image from "next/image";
import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import {
    FiAlertCircle,
    FiArrowLeft,
    FiCheckCircle,
    FiClock,
    FiHelpCircle,
    FiInfo,
    FiMessageCircle,
    FiShield,
} from "react-icons/fi";

import QRCode from "react-qr-code";
import { PiCurrencyInrBold } from "react-icons/pi";
import { AiOutlineBank } from "react-icons/ai";
import { SiPhonepe } from "react-icons/si";
import { BiSolidZap } from "react-icons/bi";

import { toast } from 'react-toastify';
import {
    WHATSAPP_SUPPORT,
    bankDetails,
    upiDetails,
    type BankDetailsType,
    type UpiDetailsType
} from "@/data/constant";

type PaymentMode = "bank" | "upi" | null;

interface BusinessInfo {
    name: string;
    plan: string;
    amount: string;
    dueDate: string;
    invoice: string;
    utr: string;
    signature: string;
    gateway: PaymentMode;
}

interface InfoRowProps {
    label: string;
    value: string;
    valueClass?: string;
}

interface PaymentMethodProps {
    title: string;
    description: string;
    icon: ReactNode;
    recommended: boolean;
    onClick: () => void;
}

interface BankDetailsProps {
    details: BankDetailsType;
    amount: string;
}

interface BankRowProps {
    label: string;
    value: string;
    last?: boolean;
}

interface UpiDetailsProps {
    details: UpiDetailsType;
    amount: string;
    invoice: string;
}

export default function PaymentOverduePage() {
    const [paymentMode, setPaymentMode] = useState<PaymentMode>(null);
    const [utr, setUtr] = useState<string>("");
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [status, setStatus] = useState<string>('checking');

    const [business, setBusiness] = useState<BusinessInfo>({
        name: "Boom Pvt. Ltd.",
        plan: "Leadstor SaaS",
        amount: "1,999",
        dueDate: "07 Sep 2026",
        invoice: "LS-2026-0904",
        signature: "",
        utr: "",
        gateway: "upi",
    });

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedUtr = utr.trim();

        if (!trimmedUtr || !paymentMode) {
            return;
        }

        try {
            const token: string = localStorage.getItem('LEADSTOR_SESSION_TOKEN') || "";
            const payload = {
                paymentMode,
                utr: trimmedUtr,
                signature: business.signature,
            }

            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("Authorization", "Bearer " + token);

            const response = await fetch(`${process.env.NEXT_PUBLIC_LEADSTOR_REST}/services/invoice/overdueInfo`, {
                method: "POST",
                headers: myHeaders,
                body: JSON.stringify(payload),
                redirect: "follow"
            });

            const result = await response.json();

            if (result.error || response.status !== 200) {
                let _txt = `EC-${response.status}`;
                if (result?.error) {
                    console.log('[Leadstor]', result?.error ?? 'Unknown Error Occurred');
                    _txt = `EC-${response.status}. ${result.error}`;
                    toast.error(result.error);
                }

                throw new Error(`Failed to update overdue balance ${_txt}`);
            }

            setSubmitted(true);

        } catch (error) {
            console.error('[LEADSTOR] Submit Payment', error);
        }
    };

    const resetPayment = (): void => {
        setPaymentMode(null);
        setUtr("");
    };

    useEffect(() => {
        const init = async () => {

            try {
                const token: string = localStorage.getItem('LEADSTOR_SESSION_TOKEN') || "";

                const myHeaders = new Headers();
                myHeaders.append("Content-Type", "application/json");
                myHeaders.append("Authorization", "Bearer " + token);

                const response = await fetch(`${process.env.NEXT_PUBLIC_LEADSTOR_REST}/services/invoice/overdueInfo`, {
                    method: "GET",
                    headers: myHeaders,
                    redirect: "follow"
                });

                if (response.status !== 200) {
                    throw new Error(`Failed to fetch overdue balance EC-${response.status}`);
                }

                const data: BusinessInfo = await response.json();

                // Is already requested
                if (data.utr.length > 9) {
                    setUtr(data.utr);
                    setPaymentMode(data.gateway);
                    setSubmitted(true);
                }

                setBusiness(data);
                setStatus('Found');

            } catch (error) {
                console.error('[LEADSTOR]', error);
                setStatus('Failed');
            }
        }

        init();

    }, [])

    return (

        <main>
            <div className="mb-8">

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Payment required to restore access
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                    Your Leadstor subscription is currently overdue. Complete
                    the payment below and submit your UTR to get your account
                    access restored.
                </p>

            </div>

            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                {/* LEFT SIDE */}
                <div className="space-y-5">
                    {/* Overdue alert */}
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                        <div className="flex gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                <FiAlertCircle size={19} />
                            </div>

                            <div>
                                <p className="font-semibold text-red-900">
                                    Payment overdue
                                </p>

                                <p className="mt-1 text-sm leading-5 text-red-700">
                                    Your access to Leadstor has been temporarily
                                    restricted because your subscription payment
                                    is overdue.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Business information */}
                    {status === 'Found' ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Account
                            </p>

                            <div className="mt-4 flex items-center gap-4">

                                <Image
                                    src={`https://api.dicebear.com/10.x/initials/png?size=50&seed=${business.name}`}
                                    alt={business.name}
                                    width={50}
                                    height={50}
                                    className="h-12 w-12 rounded-xl"
                                />

                                <div className="min-w-0">
                                    <h2 className="truncate text-lg font-bold text-slate-900">
                                        {business.name}
                                    </h2>

                                    <p className="text-sm text-slate-500">
                                        {business.plan}
                                    </p>
                                </div>
                            </div>

                            <div className="my-5 h-px bg-slate-100" />

                            <div className="space-y-4">
                                <InfoRow
                                    label="Amount due"
                                    value={business.amount}
                                    valueClass="font-bold text-slate-900"
                                />

                                <InfoRow
                                    label="Due date"
                                    value={business.dueDate}
                                    valueClass="text-red-600"
                                />

                                <InfoRow
                                    label="Invoice"
                                    value={business.invoice}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Checking Account
                            </p>

                            <div className="mt-4 flex items-center gap-4">

                                <div className="relative overflow-hidden bg-gray-200 w-12 h-12 rounded">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                                </div>

                                <div className="min-w-0">

                                    <div className="relative overflow-hidden bg-gray-200 min-w-40 h-5 rounded">
                                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                                    </div>

                                    <div className="relative overflow-hidden bg-gray-200 min-w-20 h-2 mt-1.5 rounded">
                                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                                    </div>

                                </div>
                            </div>

                        </div>
                    )}

                    {/* Why payment */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex gap-3">
                            <div className="mt-0.5 text-slate-400">
                                <FiShield size={18} />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    Why do I need to make this payment?
                                </p>

                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Your Leadstor subscription needs to be
                                    active to continue using your workspace,
                                    leads and other SaaS features.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Support */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                                <FiHelpCircle size={18} />
                            </div>

                            <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800">
                                    Need help with your payment?
                                </p>

                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    If you believe this payment is already
                                    made or you have any questions, our
                                    support team can help you.
                                </p>

                                <Link
                                    href="/support"
                                    target="_self"
                                    rel="noreferrer"
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-100"
                                >
                                    <FiMessageCircle size={15} />
                                    Contact Support Team
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE */}
                {status === 'Found' ? (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {!submitted ? (
                            <form onSubmit={handleSubmit}>
                                {/* Card header */}
                                <div className="border-b border-slate-100 p-6">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900">
                                                Complete your payment
                                            </h2>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Pay the outstanding amount and
                                                submit your UTR for verification.
                                            </p>
                                        </div>

                                        <div className="hidden shrink-0 rounded-md bg-zinc-50 px-5 py-2 text-right sm:block">
                                            <p className="text-xs text-zinc-500">
                                                Amount
                                            </p>

                                            <p className="text-lg font-bold text-zinc-700 flex justify-center items-center">
                                                <PiCurrencyInrBold size={15} />
                                                {business.amount}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {/* Select payment method */}
                                    {!paymentMode && (
                                        <>
                                            <p className="mb-3 text-sm font-semibold text-slate-800">
                                                Select payment method
                                            </p>

                                            <div className="grid gap-3 sm:grid-cols-2">

                                                <PaymentMethod
                                                    title="UPI"
                                                    description="Pay using any UPI app"
                                                    icon={
                                                        <div className="flex items-center gap-1 text-purple-600">
                                                            <SiPhonepe size={20} />
                                                        </div>
                                                    }
                                                    recommended={true}
                                                    onClick={() =>
                                                        setPaymentMode("upi")
                                                    }
                                                />
                                                
                                                <PaymentMethod
                                                    title="Bank Transfer"
                                                    description="Pay using NEFT / IMPS / RTGS"
                                                    icon={
                                                        <AiOutlineBank size={22} />
                                                    }
                                                    recommended={false}
                                                    onClick={() =>
                                                        setPaymentMode("bank")
                                                    }
                                                />
                                            </div>

                                            <div className="mt-6 flex gap-2 rounded-xl bg-slate-50 p-4">
                                                <FiInfo
                                                    className="mt-0.5 shrink-0 text-slate-400"
                                                    size={16}
                                                />

                                                <p className="text-xs leading-5 text-slate-500">
                                                    After making the payment,
                                                    keep your transaction/UTR
                                                    number ready. You will need
                                                    it in the next step.
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {/* Payment details */}
                                    {paymentMode && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={resetPayment}
                                                className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                                            >
                                                <FiArrowLeft size={15} />
                                                Change payment method
                                            </button>

                                            {paymentMode === "bank" ? (
                                                <BankDetails
                                                    details={bankDetails}
                                                    amount={business.amount}
                                                />
                                            ) : (
                                                <UPIDetails
                                                    details={upiDetails}
                                                    amount={business.amount}
                                                    invoice={business.invoice}
                                                />
                                            )}

                                            {/* UTR */}
                                            <div className="mt-7">
                                                <label
                                                    htmlFor="utr"
                                                    className="mb-2 block text-sm font-semibold text-slate-800"
                                                >
                                                    Enter UTR / Transaction ID
                                                </label>

                                                <input
                                                    id="utr"
                                                    name="utr"
                                                    type="text"
                                                    value={utr}
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setUtr(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. 123456789012"
                                                    autoComplete="off"
                                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                                />

                                                <p className="mt-2 text-xs text-slate-400">
                                                    You can find the UTR /
                                                    transaction ID in your bank
                                                    or UPI payment confirmation.
                                                </p>
                                            </div>

                                            {/* Warning */}
                                            <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                                <FiAlertCircle
                                                    className="mt-0.5 shrink-0 text-amber-600"
                                                    size={17}
                                                />

                                                <div>
                                                    <p className="text-xs font-bold text-amber-800">
                                                        Important
                                                    </p>

                                                    <p className="mt-1 text-xs leading-5 text-amber-700">
                                                        Please make sure the UTR
                                                        number is correct. An
                                                        incorrect UTR may require
                                                        additional verification
                                                        and could take longer to
                                                        restore your access.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Submit */}
                                            <button
                                                type="submit"
                                                disabled={!utr.trim()}
                                                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Submit Payment Verification
                                            </button>

                                            <p className="mt-3 text-center text-[11px] text-slate-400">
                                                Your payment will be manually
                                                verified before access is restored.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </form>
                        ) : (
                            /* SUCCESS */
                            <div className="flex min-h-[600px] flex-col items-center justify-center px-6 py-12 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                                    <FiCheckCircle size={32} />
                                </div>

                                <h2 className="mt-6 text-2xl font-bold text-slate-900">
                                    Thank you!
                                </h2>

                                <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                                    We have received your payment verification
                                    request. Our team will review your payment
                                    and it may take a few hours to get confirmed
                                    and restore your Leadstor access.
                                </p>

                                <div className="mt-6 flex max-w-md items-start gap-3 rounded-xl bg-slate-50 p-4 text-left">
                                    <FiClock
                                        className="mt-0.5 shrink-0 text-slate-400"
                                        size={17}
                                    />

                                    <p className="text-xs leading-5 text-slate-500">
                                        Meanwhile, if you have any questions or
                                        believe your payment requires urgent
                                        attention, please reach out to our
                                        customer support team.
                                    </p>
                                </div>

                                <a
                                    href={WHATSAPP_SUPPORT}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                                >
                                    <FiMessageCircle size={18} />
                                    Chat with Support on WhatsApp
                                </a>

                                <p className="mt-5 text-xs text-slate-400">
                                    Verification reference:{" "}
                                    <span className="font-medium text-slate-600">
                                        {utr}
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {status === 'checking' ? (
                            <div className="flex items-center justify-center gap-2 py-10 h-full w-full">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                <div className="text-sm text-zinc-400">It may take few seconds. Please wait</div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-3 py-10 h-full w-full">
                                <p className="text-xl font-semibold text-zinc-700">Something went wrong</p>
                                <p className="text-sm text-zinc-500 mx-40 text-center">We couldn&apos;t complete your request. Please try again or contact our support team if the issue persists.</p>
                                <Link
                                    href="/support"
                                    target="_self"
                                    rel="noreferrer"
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                                >
                                    Contact Support Team
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>

    );
}

function InfoRow({
    label,
    value,
    valueClass = "",
}: InfoRowProps) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-500">
                {label}
            </span>

            <span className={`text-sm ${valueClass || "text-slate-700"} flex justify-center items-center`}>
                {label.includes('Amount') && <PiCurrencyInrBold size={13} />}
                {value}
            </span>
        </div>
    );
}


function PaymentMethod({
    title,
    description,
    icon,
    recommended,
    onClick,
}: PaymentMethodProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm"
        >
            <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-blue-100 group-hover:text-blue-600">
                    {icon}
                </div>

                {recommended &&
                    <span className="flex justify-center gap-0.5 items-center text-[11px] bg-white text-blue-500 border border-blue-500 group-hover:text-white group-hover:bg-blue-500 font-semibold py-0.5 pl-1.5 pr-2 rounded-full">
                        <BiSolidZap size={13} />
                        Quick
                    </span>
                }
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-900">
                {title}
            </p>

            <p className="mt-1 text-xs text-slate-500">
                {description}
            </p>
        </button>
    );
}


function BankDetails({
    details,
    amount,
}: BankDetailsProps) {
    return (
        <div>
            <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-bold text-slate-900">
                        Bank Transfer
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        Transfer exactly {amount} to the account below.
                    </p>
                </div>

                <div className="shrink-0 flex justify-center items-center rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                    <PiCurrencyInrBold size={12} className="relative top-px" />
                    {amount}
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
                <BankRow
                    label="Account Name"
                    value={details.accountName}
                />

                <BankRow
                    label="Account Number"
                    value={details.accountNumber}
                />

                <BankRow
                    label="IFSC Code"
                    value={details.ifsc}
                />

                <BankRow
                    label="Bank"
                    value={details.bankName}
                />

                <BankRow
                    label="Branch"
                    value={details.branch}
                    last
                />
            </div>
        </div>
    );
}


function BankRow({
    label,
    value,
    last = false,
}: BankRowProps) {
    return (
        <div
            className={`flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${!last ? "border-b border-slate-100" : ""
                }`}
        >
            <span className="text-xs text-slate-400">
                {label}
            </span>

            <span className="text-sm font-semibold text-slate-800">
                {value}
            </span>
        </div>
    );
}


function UPIDetails({
    details,
    amount,
    invoice,
}: UpiDetailsProps) {
    return (
        <div>
            <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-bold text-slate-900">
                        Pay using UPI
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        Scan the QR code using any UPI app.
                    </p>
                </div>

                <div className="shrink-0 flex justify-center items-center rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                    <PiCurrencyInrBold size={12} className="relative top-px" />
                    {amount}
                </div>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex h-48 w-48 items-center justify-center overflow-hidden rounded-xl border bg-white p-4 shadow-sm">

                    <QRCode
                        size={256}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        value={`upi://pay?pa=${upiDetails.upiId}&pn=${upiDetails.name}&am=${amount}&tn=${invoice}&cu=INR`}
                        viewBox={`0 0 256 256`}
                    />

                </div>

                <p className="mt-4 text-xs text-slate-400">
                    Scan to pay
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900">
                    {details.upiId}
                </p>

                <p className="mt-1 text-center text-xs text-slate-500">
                    Name shown on payment:{" "}
                    <span className="font-semibold text-slate-700">
                        {details.name}
                    </span>
                </p>
            </div>
        </div>
    );
}

