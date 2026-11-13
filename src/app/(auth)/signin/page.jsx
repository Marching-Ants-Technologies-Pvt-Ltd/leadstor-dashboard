"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Bounce, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/ReactToastify.min.css';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import Loading from '@/components/elements/Loading';

const signinFormSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email format'),
    password: z
        .string()
        .min(1, 'Password is required')
});

const BENEFITS = [
    'Capture leads from every source',
    'Never miss a follow-up',
    'See your pipeline at a glance',
];

// Static sample rows for the decorative preview card (not real data)
const PREVIEW_LEADS = [
    { initials: 'PS', name: 'Priya Sharma', company: 'Acme Corp', status: 'New', pill: 'bg-blue-50 text-blue-700', avatar: 'bg-blue-100 text-blue-700' },
    { initials: 'RV', name: 'Rahul Verma', company: 'Northwind', status: 'Follow up', pill: 'bg-amber-50 text-amber-700', avatar: 'bg-amber-100 text-amber-700' },
    { initials: 'MI', name: 'Meera Iyer', company: 'Globex', status: 'Won', pill: 'bg-green-50 text-green-700', avatar: 'bg-green-100 text-green-700' },
];

const FIELD_CLASSES =
    "mt-1 block w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 shadow-sm " +
    "placeholder:text-gray-400 outline-none transition " +
    "focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-gray-50";

function EyeIcon({ off }) {
    return off ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a2 2 0 002.8 2.8" />
            <path d="M9.9 5.1A9.8 9.8 0 0112 5c5 0 9 4.5 10 7a11.6 11.6 0 01-3.2 4.3M6.1 6.1A11.7 11.7 0 002 12c1 2.5 5 7 10 7a9.7 9.7 0 004.1-.9" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
            <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function Spinner() {
    return (
        <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-90" />
        </svg>
    );
}

export default function SignIn() {

    const today = new Date();
    const router = useRouter();
    const { status } = useSession();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [capsLockOn, setCapsLockOn] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        }

        if (status === 'unauthenticated') {
            showErrorFromAddressBar();
        }

    }, [status, router]);

    if (status === 'loading') {
        console.log('Checking session...');
        return <Loading />;
    }

    if (status === 'authenticated') {
        console.log('Session restored, taking you to next page');
        return <Loading />;
    }

    function handleForgotPassword() {
        toast.error("Unavailable to process!");
    }

    //On show error message appeared on address bar and update url
    function showErrorFromAddressBar() {
        const params = new URLSearchParams(window.location.search);
        let error = params.get('error');

        if (!error) return;
        try {
            error = JSON.parse(decodeURIComponent(error));
            console.error(error);
        } catch (e) {
            console.log('Invalid JSON');
        }

        const newURL = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newURL);

        setTimeout(() => {
            toast.error('Failed to sign in, please try again later');
        }, 100);
    }

    function handleSocialSignIn(provider) {
        setIsSubmitting(true);
        signIn(provider);
    }

    function handlePasswordKey(event) {
        setCapsLockOn(event.getModifierState && event.getModifierState('CapsLock'));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (isSubmitting) return;

        const formData = new FormData(event.target);
        const inputs = Object.fromEntries(formData);

        const parsed = signinFormSchema.safeParse(inputs);
        if (!parsed.success) {
            toast.error(parsed.error.issues[0].message);
            return;
        }

        setIsSubmitting(true);

        try {
            const signInData = await signIn('credentials', {
                email: parsed.data.email,
                password: parsed.data.password,
                redirect: false
            });

            if (signInData?.error) {
                let message = 'Incorrect email or password';
                try {
                    message = JSON.parse(signInData.error).error || message;
                } catch (e) {
                    // error was not JSON, keep the generic message
                }
                toast.error(message);
            }
            // on success, session status flips to 'authenticated' and the effect above redirects
        } catch (error) {
            toast.error(error?.message || 'Something went wrong, please try again');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div>
            <ToastContainer
                position="top-center"
                autoClose={2000}
                hideProgressBar={true}
                theme="light"
                transition={Bounce}
            />
            <section className="relative flex min-h-screen flex-col overflow-hidden bg-[#EEF3FA]">

                {/* faint corner rings, purely decorative */}
                <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
                    <circle cx="0" cy="0" r="160" fill="none" stroke="#85B7EB" strokeOpacity="0.35" />
                    <circle cx="0" cy="0" r="280" fill="none" stroke="#85B7EB" strokeOpacity="0.25" />
                    <circle cx="0" cy="0" r="400" fill="none" stroke="#85B7EB" strokeOpacity="0.18" />
                    <circle cx="100%" cy="100%" r="160" fill="none" stroke="#85B7EB" strokeOpacity="0.35" />
                    <circle cx="100%" cy="100%" r="280" fill="none" stroke="#85B7EB" strokeOpacity="0.25" />
                    <circle cx="100%" cy="100%" r="400" fill="none" stroke="#85B7EB" strokeOpacity="0.18" />
                </svg>

                <div className="relative mx-auto flex w-full max-w-7xl flex-1 items-center justify-center gap-16 px-6 py-8 lg:justify-between lg:px-16 xl:px-24">

                    {/* Left: sign-in form */}
                    <div className="w-full max-w-md">

                        <header>
                            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Sign in</h1>
                            <p className="mt-1 text-sm text-gray-600">Welcome back. Sign in to manage your leads.</p>
                        </header>

                        {/* Primary: email + password */}
                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

                            <div>
                                <label htmlFor="Email" className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    id="Email"
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                    placeholder="you@company.com"
                                    disabled={isSubmitting}
                                    className={FIELD_CLASSES}
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between">
                                    <label htmlFor="Password" className="block text-sm font-medium text-gray-700">Password</label>
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        className="rounded text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
                                    >
                                        Forgot password?
                                    </button>
                                </div>

                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="Password"
                                        name="password"
                                        autoComplete="current-password"
                                        disabled={isSubmitting}
                                        onKeyUp={handlePasswordKey}
                                        onKeyDown={handlePasswordKey}
                                        onBlur={() => setCapsLockOn(false)}
                                        className={`${FIELD_CLASSES} pr-12`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        aria-pressed={showPassword}
                                        className="absolute inset-y-0 right-0 mt-1 flex items-center rounded-r-md px-3 text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
                                    >
                                        <EyeIcon off={showPassword} />
                                    </button>
                                </div>

                                {capsLockOn && (
                                    <p className="mt-1 text-xs text-amber-600" role="status">Caps Lock is on</p>
                                )}
                            </div>

                            <label htmlFor="RememberDevice" className="flex cursor-pointer items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="RememberDevice"
                                    name="remember"
                                    className="size-5 rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-600"
                                />
                                <span className="text-sm text-gray-700">Remember this device for 30 days</span>
                            </label>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isSubmitting ? (<><Spinner /> Signing in...</>) : 'Sign in'}
                            </button>
                        </form>

                        {/* Secondary: social sign-in */}
                        <div className="mt-5 flex items-center gap-4">
                            <div className="h-px flex-1 bg-gray-300/70"></div>
                            <span className="select-none text-xs text-gray-500">or continue with</span>
                            <div className="h-px flex-1 bg-gray-300/70"></div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => handleSocialSignIn('google')}
                                disabled={isSubmitting}
                                className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <Image
                                    placeholder='empty'
                                    src="/icons/google.svg"
                                    width={0}
                                    height={0}
                                    alt=""
                                    priority={false}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                Google
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSocialSignIn('facebook')}
                                disabled={isSubmitting}
                                className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <Image
                                    placeholder='empty'
                                    src="/icons/facebook.svg"
                                    width={20}
                                    height={20}
                                    alt=""
                                    priority={false}
                                />
                                Facebook
                            </button>
                        </div>

                        {/* Sign-up prompt */}
                        <p className="mt-6 text-center text-sm text-gray-700">
                            New to Leadstor?{' '}
                            <Link
                                href="/signup"
                                className="rounded font-semibold text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
                            >
                                Create an account
                            </Link>
                        </p>

                    </div>

                    {/* Right: message + preview, floating on the same background (desktop only) */}
                    <div className="hidden max-w-lg flex-1 lg:block">
                        <h2 className="text-4xl font-semibold leading-tight text-[#1d3461]">
                            Every lead, one place
                        </h2>
                        <p className="mt-3 text-lg leading-relaxed text-gray-700">
                            Capture, follow up, and close without the spreadsheet.
                        </p>

                        <ul className="mt-8 space-y-3 text-[#1d3461]">
                            {BENEFITS.map((benefit) => (
                                <li key={benefit} className="flex items-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0" aria-hidden="true">
                                        <path d="M5 12l5 5L20 7" />
                                    </svg>
                                    {benefit}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm" aria-hidden="true">
                            <ul className="space-y-3">
                                {PREVIEW_LEADS.map((lead) => (
                                    <li key={lead.name} className="flex items-center gap-3">
                                        <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${lead.avatar}`}>
                                            {lead.initials}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium text-gray-900">{lead.name}</span>
                                            <span className="block truncate text-xs text-gray-500">{lead.company}</span>
                                        </span>
                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${lead.pill}`}>{lead.status}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                </div>

                {/* Footer: one centred line across the page */}
                <footer className="relative flex flex-wrap items-center justify-center gap-x-6 gap-y-1 px-6 pb-5 pt-2 text-xs text-gray-500 sm:text-sm">
                    <span className="cursor-default whitespace-nowrap">
                        Copyright © {today.getFullYear()}{' '}
                        <a href="https://leadstor.in" className="hover:underline">Leadstor.in</a>
                    </span>

                    <ul className="flex items-center gap-x-4 whitespace-nowrap">
                        <li><a href="https://leadstor.in/contact" className="hover:underline">Contact Us</a></li>
                        <li><a href="https://leadstor.in/terms-of-use" className="hover:underline">Terms Of Service</a></li>
                        <li><a href="https://leadstor.in/privacy-policy" className="hover:underline">Privacy Policy</a></li>
                    </ul>
                </footer>
            </section>
        </div>
    );
}