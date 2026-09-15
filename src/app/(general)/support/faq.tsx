"use client"

import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

export default function SupportFAQ() {
    return (
        <div className="mt-28 border-t">
            <div className="mb-4 mt-12">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Frequently asked questions
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                    Some quick answers to common questions.
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <FaqItem
                    question="How long does it take to restore access after payment?"
                    answer="Once your payment is verified, access is generally restored shortly afterwards. Manual verification can take a few hours."
                />

                <FaqItem
                    question="I made a payment but my account is still locked"
                    answer="Please submit your UTR through the payment verification page. You can also contact our support team on WhatsApp."
                />

                <FaqItem
                    question="Where can I find my UTR number?"
                    answer="Your UTR or transaction ID can usually be found in your bank statement, UPI app or payment confirmation."
                />

                <FaqItem
                    question="Can I request a feature?"
                    answer="Absolutely. Select Feature Request above and tell us what you'd like Leadstor to do."
                />
            </div>
        </div>
    )
}


function FaqItem({
    question,
    answer,
}: {
    question: string;
    answer: string;
}) {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <div className="rounded-xl border border-slate-200 bg-white">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="flex w-full items-center justify-between gap-4 p-4 text-left"
            >
                <span className="text-sm font-medium text-slate-800">
                    {question}
                </span>

                <FiChevronDown
                    size={17}
                    className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""
                        }`}
                />
            </button>

            {open && (
                <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                    <p className="text-xs leading-5 text-slate-500">
                        {answer}
                    </p>
                </div>
            )}
        </div>
    );
}
