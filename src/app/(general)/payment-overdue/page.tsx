"use client"

import Image from "next/image";
import Link from "next/link";
import { FormEvent, ReactNode, useState } from "react";
import {
    FiAlertCircle,
    FiArrowLeft,
    FiCheckCircle,
    FiClock,
    FiCreditCard,
    FiHelpCircle,
    FiInfo,
    FiMessageCircle,
    FiShield,
} from "react-icons/fi";

import { SiGooglepay, SiPhonepe } from "react-icons/si";
import QRCode from "react-qr-code";

type PaymentMode = "bank" | "upi" | null;

interface BusinessInfo {
    name: string;
    plan: string;
    amount: string;
    dueDate: string;
    invoice: string;
}

interface BankDetailsType {
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
    branch: string;
}

interface UpiDetailsType {
    upiId: string;
    name: string;
    qrCode: string;
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
}

const business: BusinessInfo = {
    name: "XYZ Pvt. Ltd.",
    plan: "Leadstor SaaS",
    amount: "₹2,999",
    dueDate: "05 Sep 2026",
    invoice: "#LS-2026-0905",
};

const bankDetails: BankDetailsType = {
    accountName: "Leadstor Technologies Pvt. Ltd.",
    accountNumber: "123456789012",
    ifsc: "HDFC0001234",
    bankName: "HDFC Bank",
    branch: "Patna Main Branch",
};

const upiDetails: UpiDetailsType = {
    upiId: "payments@leadstor.com",
    name: "Leadstor Technologies Pvt. Ltd.",
    qrCode: "/images/leadstor-upi-qr.png",
};

export default function PaymentOverduePage() {
    const [paymentMode, setPaymentMode] = useState<PaymentMode>(null);
    const [utr, setUtr] = useState<string>("");
    const [submitted, setSubmitted] = useState<boolean>(false);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedUtr = utr.trim();

        if (!trimmedUtr || !paymentMode) {
            return;
        }

        console.log({
            business: business.name,
            paymentMode,
            utr: trimmedUtr,
            amount: business.amount,
        });

        setSubmitted(true);
    };

    const resetPayment = (): void => {
        setPaymentMode(null);
        setUtr("");
    };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="mb-16 flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center">
                            <Image
                                src="/icons/leadstor.png"
                                alt='Leadstor Logo'
                                width={200}
                                height={200}
                                className='h-7 w-7'
                            />
                        </div>

                        <span className=" text-lg font-medium text-slate-500">Leadstor</span>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Payment required to restore access
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                        Your Leadstor subscription is currently overdue. Complete
                        the payment below and submit your UTR to get your account
                        access restored.
                    </p>
                </div>

                {/* Main */}
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
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Account
                            </p>

                            <div className="mt-4 flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-lg font-bold text-purple-700">
                                    {business.name.charAt(0)}
                                </div>

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

                                        <div className="hidden shrink-0 rounded-xl bg-purple-50 px-4 py-2 text-right sm:block">
                                            <p className="text-xs text-purple-500">
                                                Amount
                                            </p>

                                            <p className="text-lg font-bold text-purple-700">
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
                                                    title="Bank Transfer"
                                                    description="Pay using NEFT / IMPS / RTGS"
                                                    icon={
                                                        <FiCreditCard size={22} />
                                                    }
                                                    onClick={() =>
                                                        setPaymentMode("bank")
                                                    }
                                                />

                                                <PaymentMethod
                                                    title="UPI"
                                                    description="Pay using any UPI app"
                                                    icon={
                                                        <div className="flex items-center gap-1">
                                                            {/* <SiGooglepay size={20} /> */}
                                                            <SiPhonepe size={20} />
                                                        </div>
                                                    }
                                                    onClick={() =>
                                                        setPaymentMode("upi")
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
                                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
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
                                                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                                    href="https://wa.me/919999999999"
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
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-slate-400">
                    © {new Date().getFullYear()} Leadstor. All rights reserved.
                </div>
            </div>
        </div>
    );
}


/* ============================================================
   Small Components
============================================================ */

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

            <span
                className={`text-sm ${valueClass || "text-slate-700"
                    }`}
            >
                {value}
            </span>
        </div>
    );
}


function PaymentMethod({
    title,
    description,
    icon,
    onClick,
}: PaymentMethodProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group rounded-xl border border-slate-200 p-4 text-left transition hover:border-purple-300 hover:bg-purple-50/50 hover:shadow-sm"
        >
            <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-purple-100 group-hover:text-purple-600">
                    {icon}
                </div>

                <span className="text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-purple-500">
                    →
                </span>
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

                <div className="shrink-0 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
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

                <div className="shrink-0 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
                    {amount}
                </div>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex h-48 w-48 items-center justify-center overflow-hidden rounded-xl border bg-white p-4 shadow-sm">
                    {/* <img
                        src={details.qrCode}
                        alt="UPI QR Code"
                        className="h-full w-full object-contain"
                    /> */}

                    <QRCode
                        size={256}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        value={`upi://pay?pa=marchingants@icici&pn=MARCHING ANTS TECHNOLOGIES PRIVATE LTD&am=500&tn=LS-2026-0905&cu=INR`}
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

