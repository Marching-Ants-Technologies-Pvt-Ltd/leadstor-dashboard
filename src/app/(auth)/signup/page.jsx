'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bounce, Slide, ToastContainer, Zoom, toast } from 'react-toastify';
import 'react-toastify/ReactToastify.min.css';
import * as z from 'zod';
import Loading from '@/components/elements/Loading';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

export default function SignUp() {

    const router = useRouter();
    let { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/profile');
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

    const signUpFormSchema = z.object({
        first_name: z
            .string()
            .min(3, 'First name is required'),
        email: z
            .string()
            .min(1, 'Email is required')
            .email('Invalid email format'),
        password: z
            .string()
            .min(1, 'Password is required')
            .min(8, 'Password must be at least 8 characters'),
        password_confirmation: z
            .string()
            .min(1, 'Password confirmation is required')
            .min(8, 'Password must be at least 8 characters'),
    }).refine((data) => data.password === data.password_confirmation, {
        path: ['password_confirmation'],
        message: 'Password do not match',
    });

    async function handleSubmit(event) {

        event.preventDefault();

        const formData = new FormData(event.target);
        const inputs = Object.fromEntries(formData);

        try {

            const payload = await signUpFormSchema.parse(inputs);
            const signInData = await signIn('credentials', {
                email: payload.email,
                password: payload.password,
                first_name: payload.first_name,
                last_name: inputs.last_name,
                redirect: false
            });

            if (signInData?.error) {
                let errorMessage = JSON.parse(signInData.error);
                toast.error(`${errorMessage.error}`);
            }

        } catch (error) {

            let errorMessage = error.message;
            if (!signUpFormSchema.success) {
                errorMessage = JSON.parse(error.message)[0].message;
            }

            toast.error(errorMessage);
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
            <section className="bg-white">
                <div className="lg:grid lg:min-h-screen lg:grid-cols-12">

                    <aside className="relative block h-16 lg:order-last lg:col-span-5 lg:h-full xl:col-span-6">
                        <div className="absolute inset-0 h-full w-full object-cover bg-[url('/banners/modern.jpg')]">
                            <div className="max-lg:hidden bg-gradient-to-r from-white from-10% w-full h-full"></div>
                        </div>
                    </aside>

                    <main className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-24 lg:py-12 xl:col-span-6">
                        <div className="max-w-xl lg:max-w-3xl">

                            <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl">SignUp</h1>
                            <p className="mt-6 text-sm leading-relaxed text-gray-500">Welcome to Leadstor. Unlock the potential of Leadstor with a free trial</p>
                            <p className="mt-0 text-sm leading-relaxed text-gray-500">receive 10 leads and 1 integration, all with no credit card required.</p>

                            <div className="mt-8 grid grid-cols-6 gap-6">

                                <div className="col-span-6 sm:col-span-3">
                                    <div onClick={() => signIn('google')} className='mt-1 border w-full rounded-md border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm grid cursor-pointer'>
                                        <div className='inline-flex items-center px-4 py-3 m-auto'>
                                            <Image
                                                placeholder='empty'
                                                src="/icons/google.svg"
                                                width={22}
                                                height={22}
                                                alt="Google Icon"
                                                priority={false}
                                            />
                                            <span className='ml-2'>Continue with Google</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <div onClick={() => signIn('facebook')} className='mt-1 border w-full rounded-md border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm grid cursor-pointer'>
                                        <div className='inline-flex items-center px-4 py-3 m-auto'>
                                            <Image
                                                placeholder='empty'
                                                src="/icons/facebook.svg"
                                                width={24}
                                                height={24}
                                                alt="Google Icon"
                                                priority={false}
                                            />
                                            <span className='ml-2'>Continue with Facebook</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-6">
                                    <div className='flex mt-2'>

                                        <div className='flex-1 inline-flex items-center'>
                                            <div className='w-full h-[1px] bg-gray-200'></div>
                                        </div>

                                        <div className='flex-none w-[60px] font-semibold font-lg text-center text-gray-600'>Or</div>

                                        <div className='flex-1 inline-flex items-center'>
                                            <div className='w-full h-[1px] bg-gray-200'></div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                            <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-6 gap-6">

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="FirstName" className="block text-sm font-medium text-gray-700">
                                        First Name
                                    </label>

                                    <input
                                        type="text"
                                        id="FirstName"
                                        name="first_name"
                                        className="mt-1 border w-full rounded-md border-gray-200 bg-white text-base text-gray-700 shadow-sm px-4 py-2"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="LastName" className="block text-sm font-medium text-gray-700">
                                        Last Name
                                    </label>

                                    <input
                                        type="text"
                                        id="LastName"
                                        name="last_name"
                                        className="mt-1 border w-full rounded-md border-gray-200 bg-white text-base text-gray-700 shadow-sm px-4 py-2"
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="Email" className="block text-sm font-medium text-gray-700"> Email </label>

                                    <input
                                        type="email"
                                        id="Email"
                                        name="email"
                                        className="mt-1 border w-full rounded-md border-gray-200 bg-white text-base text-gray-700 shadow-sm px-4 py-2"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="Password" className="block text-sm font-medium text-gray-700"> Password </label>

                                    <input
                                        type="password"
                                        id="Password"
                                        name="password"
                                        className="mt-1 border w-full rounded-md border-gray-200 bg-white text-base text-gray-700 shadow-sm px-4 py-2"
                                    />
                                </div>

                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="PasswordConfirmation" className="block text-sm font-medium text-gray-700">
                                        Password Confirmation
                                    </label>

                                    <input
                                        type="password"
                                        id="PasswordConfirmation"
                                        name="password_confirmation"
                                        className="mt-1 border w-full rounded-md border-gray-200 bg-white text-base text-gray-700 shadow-sm px-4 py-2"
                                    />
                                </div>

                                <div className="col-span-6">
                                    <label htmlFor="UserConcent" className="flex gap-4">
                                        <input
                                            type="checkbox"
                                            id="UserConcent"
                                            name="marketing_accept"
                                            className="size-5 rounded-md border-gray-200 bg-white shadow-sm"
                                        />

                                        <span className="text-sm text-gray-700">
                                            I want to receive emails about events, product updates and company announcements.
                                        </span>
                                    </label>
                                </div>

                                <div className="col-span-6">
                                    <p className="text-sm text-gray-500">
                                        By creating an account, you agree to our&nbsp; 
                                        <a href="/terms" className="text-gray-700 underline">terms</a>
                                        &nbsp;&amp;&nbsp;
                                        <a href="/privacy-policy" className="text-gray-700 underline">privacy policy</a>.
                                    </p>
                                </div>

                                <div className="col-span-6 sm:flex sm:items-center sm:gap-4">
                                    <button
                                        type='submit'
                                        className="inline-block shrink-0 rounded-md border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium text-white transition hover:bg-transparent hover:text-blue-600 focus:outline-none focus:ring active:text-blue-500"
                                    >
                                        Create an account
                                    </button>

                                    <p className="mt-4 text-sm text-gray-500 sm:mt-0">
                                        Already have an account?
                                        <a href="/signin" className="text-gray-700 underline ml-1">Sign in</a>.
                                    </p>
                                </div>


                                <div className="col-span-6">
                                    <div className="w-full mt-6 border-t pt-4 border-gray-300 md:flex md:items-center md:justify-between">

                                        <span className="cursor-default text-sm text-gray-600 sm:text-center dark:text-gray-400">Copyright © 2024 <Link href="/" className="hover:underline">Leadstor.in</Link>
                                        </span>

                                        <ul className="flex flex-wrap items-center mt-3 text-sm font-normal text-gray-600 dark:text-gray-400 sm:mt-0">
                                            <li>
                                                <Link href="/contact" className="hover:underline me-4">Contact Us</Link>
                                            </li>
                                            <li>
                                                <Link href="/terms" className="hover:underline me-4">Terms Of Service</Link>
                                            </li>
                                            <li>
                                                <Link href="/privacy-policy" className="hover:underline">
                                                Privacy Policy</Link>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                            </form>
                        </div>
                    </main>

                </div>
            </section>

        </div>
    );
}