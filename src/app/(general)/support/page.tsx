"use client"

import Image from "next/image";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import {
    FiAlertCircle,
    FiArrowRight,
    FiBookOpen,
    FiCheckCircle,
    FiClock,
    FiHelpCircle,
    FiLifeBuoy,
    FiMail,
    FiMessageCircle,
    FiSend,
} from "react-icons/fi";

import { WHATSAPP_SUPPORT, EMAIL_SUPPORT } from "@/data/constant";
import { decodeJwt } from "@/lib/jwt";

import SupportFAQ from "./faq";

type SupportCategory =
    | "Technical Issue"
    | "Billing & Payment"
    | "Account & Access"
    | "Feature Request"
    | "Other";

interface BusinessInfo {
    name: string;
    plan: string;
    email: string;
    accountId: string;
}

interface CategoryOptionProps {
    title: SupportCategory;
    description: string;
    icon: ReactNode;
    selected: boolean;
    onClick: () => void;
}

interface SupportCardProps {
    icon: ReactNode;
    title: string;
    description: string;
    action: string;
    href?: string;
    onClick?: () => void;
}

const supportCategories: {
    title: SupportCategory;
    description: string;
    icon: ReactNode;
}[] = [
        {
            title: "Technical Issue",
            description: "Something isn't working as expected",
            icon: <FiAlertCircle size={20} />,
        },
        {
            title: "Billing & Payment",
            description: "Payment, invoice or subscription help",
            icon: <FiLifeBuoy size={20} />,
        },
        {
            title: "Account & Access",
            description: "Login, access or account related issues",
            icon: <FiHelpCircle size={20} />,
        },
        {
            title: "Feature Request",
            description: "Suggest something you'd like to see",
            icon: <FiBookOpen size={20} />,
        },
        {
            title: "Other",
            description: "Something else? We're happy to help",
            icon: <FiMessageCircle size={20} />,
        },
    ];



export default function SupportPage() {
    const [category, setCategory] = useState<SupportCategory | null>(null);
    const [subject, setSubject] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [submitted, setSubmitted] = useState<boolean>(false);

    const [status, setStatus] = useState<string>('checking');
    const [business, setBusiness] = useState<BusinessInfo>({
        name: "XYZ Pvt. Ltd.",
        plan: "Leadstor SaaS",
        email: "admin@xyz.com",
        accountId: "LS-10293",
    });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!category || !subject.trim() || !message.trim()) {
            return;
        }

        console.log({
            business: business.name,
            accountId: business.accountId,
            category,
            subject: subject.trim(),
            message: message.trim(),
        });

        setSubmitted(true);
    };

    useEffect(() => {
        const init = async () => {

            try {
                const token: string = localStorage.getItem('LEADSTOR_SESSION_TOKEN') || "";
                const data = decodeJwt(token);
                setBusiness({
                    name: `${data.recruiter_name} ${data.recruiter_last_name}`.trim(),
                    plan: String(data.corporate_name),
                    email: String(data.corporateEmail),
                    accountId: `LS-${data.corporate_type}-${data.corporateId}`,
                });

                setStatus('Found');

            } catch (error) {
                console.error('[JWT]', error);
                setStatus('Failed');
            }
        }

        init();

    }, [])

    if (submitted) {
        return (
            <SupportSubmitted
                category={category}
                subject={subject}
            />
        );
    }
    return (

        <main>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    How can we help?
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                    Have a question or running into an issue? Tell us what
                    happened and our support team will help you get things
                    sorted.
                </p>
            </div>

            {/* Main */}
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                {/* LEFT */}
                <div className="space-y-5">
                    {/* Business */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Your account
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
                            <AccountRow
                                label="Account ID"
                                value={business.accountId}
                            />

                            <AccountRow
                                label="Email"
                                value={business.email}
                            />
                        </div>
                    </div>

                    {/* Quick support */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-sm font-semibold text-slate-900">
                            Need a quick answer?
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            You can reach our support team directly through
                            WhatsApp or email.
                        </p>

                        <div className="mt-4 grid gap-2">
                            <SupportCard
                                icon={<FiMessageCircle size={17} />}
                                title="WhatsApp Support"
                                description="Usually the fastest way to reach us"
                                action="Chat with us"
                                href={WHATSAPP_SUPPORT}
                            />

                            <SupportCard
                                icon={<FiMail size={17} />}
                                title="Email Support"
                                description="For detailed queries and requests"
                                action="Send email"
                                href={`mailto:${EMAIL_SUPPORT}`}
                            />
                        </div>
                    </div>

                    {/* Response time */}
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                        <div className="flex gap-3">
                            <div className="mt-0.5 text-blue-600">
                                <FiClock size={18} />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-blue-900">
                                    Typical response time
                                </p>

                                <p className="mt-1 text-xs leading-5 text-blue-700">
                                    Our team generally responds within a few
                                    hours during business hours.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <form onSubmit={handleSubmit}>
                        {/* Form header */}
                        <div className="border-b border-slate-100 p-6">
                            <h2 className="text-lg font-bold text-slate-900">
                                Contact support
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Choose a category and describe your issue.
                            </p>
                        </div>

                        <div className="p-6">
                            {/* Category */}
                            <div>
                                <label className="mb-3 block text-sm font-semibold text-slate-800">
                                    What can we help you with?
                                </label>

                                <div className="grid gap-2 sm:grid-cols-2">
                                    {supportCategories.map((item) => (
                                        <CategoryOption
                                            key={item.title}
                                            title={item.title}
                                            description={item.description}
                                            icon={item.icon}
                                            selected={
                                                category === item.title
                                            }
                                            onClick={() =>
                                                setCategory(item.title)
                                            }
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Subject */}
                            <div className="mt-6">
                                <label
                                    htmlFor="subject"
                                    className="mb-2 block text-sm font-semibold text-slate-800"
                                >
                                    Subject
                                </label>

                                <input
                                    id="subject"
                                    name="subject"
                                    type="text"
                                    value={subject}
                                    onChange={(event) =>
                                        setSubject(event.target.value)
                                    }
                                    placeholder="Briefly describe your issue"
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            {/* Message */}
                            <div className="mt-5">
                                <label
                                    htmlFor="message"
                                    className="mb-2 block text-sm font-semibold text-slate-800"
                                >
                                    Tell us more
                                </label>

                                <textarea
                                    id="message"
                                    name="message"
                                    rows={6}
                                    value={message}
                                    onChange={(event) =>
                                        setMessage(event.target.value)
                                    }
                                    placeholder="Please describe the problem you're facing. Include any relevant details that might help us understand the issue."
                                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />

                                <p className="mt-2 text-xs text-slate-400">
                                    The more details you provide, the faster
                                    we can help.
                                </p>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={
                                    !category ||
                                    !subject.trim() ||
                                    !message.trim()
                                }
                                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <FiSend size={16} />
                                Send to Support
                            </button>

                            <p className="mt-3 text-center text-[11px] text-slate-400">
                                Your request will be associated with your
                                Leadstor account.
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            {/* FAQ */}
            <SupportFAQ />
            
        </main>

    );
}


function AccountRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-500">
                {label}
            </span>

            <span className="truncate text-right text-sm font-medium text-slate-700">
                {value}
            </span>
        </div>
    );
}


function CategoryOption({
    title,
    description,
    icon,
    selected,
    onClick,
}: CategoryOptionProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group rounded-xl border p-4 text-left transition ${selected
                ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/40"
                }`}
        >
            <div className="flex items-start gap-3">
                <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${selected
                        ? "bg-blue-100 text-blue-600"
                        : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600"
                        }`}
                >
                    {icon}
                </div>

                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                        {title}
                    </p>

                    <p className="mt-1 text-[11px] leading-4 text-slate-500">
                        {description}
                    </p>
                </div>

                {selected && (
                    <FiCheckCircle
                        className="ml-auto shrink-0 text-blue-600"
                        size={17}
                    />
                )}
            </div>
        </button>
    );
}


function SupportCard({
    icon,
    title,
    description,
    action,
    href,
    onClick,
}: SupportCardProps) {
    const content = (
        <>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                {icon}
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800">
                    {title}
                </p>

                <p className="mt-0.5 text-[11px] text-slate-400">
                    {description}
                </p>
            </div>

            <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600">
                {action}
                <FiArrowRight size={12} />
            </span>
        </>
    );

    if (href) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-blue-200 hover:bg-blue-50/40"
            >
                {content}
            </a>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
        >
            {content}
        </button>
    );
}

function SupportSubmitted({
    category,
    subject,
}: {
    category: SupportCategory | null;
    subject: string;
}) {
    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
                <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <FiCheckCircle size={32} />
                    </div>

                    <h1 className="mt-6 text-2xl font-bold text-slate-900">
                        We&apos;ve received your request
                    </h1>

                    <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                        Thanks for reaching out to Leadstor support. Our team
                        has received your request and will get back to you as
                        soon as possible.
                    </p>

                    <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left">
                        <div className="flex items-start gap-3">
                            <FiClock
                                className="mt-0.5 shrink-0 text-slate-400"
                                size={17}
                            />

                            <div>
                                <p className="text-xs font-semibold text-slate-700">
                                    What happens next?
                                </p>

                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Our support team will review your request
                                    and contact you regarding your issue.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 p-4 text-left">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Request
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                            {subject}
                        </p>

                        {category && (
                            <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                                {category}
                            </span>
                        )}
                    </div>

                    <a
                        href={WHATSAPP_SUPPORT}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                        <FiMessageCircle size={17} />
                        Chat with Support
                    </a>

                    <p className="mt-5 text-xs text-slate-400">
                        If your issue is urgent, contacting us on WhatsApp maybe faster.
                    </p>
                </div>
            </div>
        </div>
    );
}