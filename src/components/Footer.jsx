import Link from 'next/link';
import Image from 'next/image';

export default function Footer({
    showSignupBanner = true
}) {
    return (
        <footer className="bg-white">
            {(showSignupBanner) &&
                <div className="footer-bg py-6">
                    <div className="container mx-auto px-4 max-w-screen-md pt-24 text-center pb-[150px]">
                        <h3 className="text-xl sm:text-3xl leading-2 sm:leading-10 font-semibold sm:font-bold text-gray-800">Nurture leads efficiently with Leadstor, the best lead management software.</h3>
                        <p className="mt-3 text-sm sm:text-base text-slate-600">Start with 10 free leads &amp; 1 integration. No credit card required. No strings attached.</p>
                        <div className="relative inline-flex group mt-8">
                            <div className="absolute transitiona-all duration-1000 opacity-10 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-xl blur-lg filter group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200"></div>
                            <a href="/signup" target="_self" title="" role="button" className="relative inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white transition-all duration-200 bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 hover:bg-gray-800 rounded">CREATE A FREE ACCOUNT</a>
                        </div>
                        <p className="mt-3 text-gray-400 text-sm">Get full access to the product, no credit card required</p>
                    </div>
                </div>
            }

            <div className="container mx-auto px-4 py-20 max-w-screen-xl">
                <Image
                    className="mb-8"
                    placeholder='empty'
                    src="/icons/leadstor.png"
                    width={64}
                    height={64}
                    alt="Leadstor Site Icon"
                    priority
                />
                <div className="flex gap-20">
                    <div className="max-w-none md:max-w-[312px] lg:max-w-[512px]">
                        <h4 className="text-gray-800 poppins text-xl">Leadstor.in &mdash; Simplified Lead Management & CRM</h4>
                        <p className="text-gray-500 pr-20 text-sm mt-4 text-justify">
                            Capture, manage, and convert leads effortlessly with Leadstor.
                            Manage your sales pipeline, automate follow-ups, and keep your
                            team focused on closing more deals.
                        </p>
                        <div className="text-gray-700 text-base font-semibold mt-8">Follow Us On</div>
                        <div className="flex gap-3">
                            <a href="https://www.facebook.com/profile.php?id=61565472072220" target="_blank" className="h-8 w-8 mt-4 border border-gray-800 rounded-full flex justify-center align-middle">
                                <Image
                                    placeholder='empty'
                                    src="/icons/footer-icon-1.svg"
                                    width={8}
                                    height={8}
                                    alt="Leadstor Footer Icon"
                                    priority
                                />
                            </a>
                            <a href="https://www.linkedin.com/company/leadstor-in/" target="_blank" className="h-8 w-8 mt-4 border border-gray-800 rounded-full flex justify-center align-middle">
                                <Image
                                    placeholder='empty'
                                    src="/icons/footer-icon-2.svg"
                                    width={12}
                                    height={12}
                                    alt="Leadstor Footer Icon"
                                    priority
                                />
                            </a>
                            <a href="https://www.instagram.com/leadstor.in" target="_blank" className="h-8 w-8 mt-4 border border-gray-800 rounded-full flex justify-center align-middle">
                                <Image
                                    placeholder='empty'
                                    src="/icons/footer-icon-3.svg"
                                    width={16}
                                    height={16}
                                    alt="Leadstor Footer Icon"
                                    priority
                                />
                            </a>
                            <a href="https://x.com/leadstor" target="_blank" className="h-8 w-8 mt-4 border border-gray-800 rounded-full flex justify-center align-middle">
                                <Image
                                    placeholder='empty'
                                    src="/icons/footer-icon-4.svg"
                                    width={16}
                                    height={16}
                                    alt="Leadstor Footer Icon"
                                    priority
                                />
                            </a>
                            <a href="https://www.youtube.com/@LeadStor" target="_blank" className="h-8 w-8 mt-4 border border-gray-800 rounded-full flex justify-center align-middle">
                                <Image
                                    placeholder='empty'
                                    src="/icons/footer-icon-5.svg"
                                    width={18}
                                    height={18}
                                    alt="Leadstor Footer Icon"
                                    priority
                                />
                            </a>
                        </div>
                    </div>
                    <div className="grow hidden xl:block"></div>
                    <div className="pl-10 poppins hidden md:block">
                        <h5 className="text-lg text-gray-800 font-semibold">Quick links</h5>
                        <p className="mt-2 text-gray-500"><Link href="/#why-leadstor">Features</Link></p>
                        <p className="mt-2 text-gray-500"><Link href="/#pricing">Pricing</Link></p>
                        <p className="mt-2 text-gray-300 cursor-default">Leadstor API</p>
                        <p className="mt-2 text-gray-500"><Link href="/career">Careers</Link></p>
                        <p className="mt-2 text-gray-300 cursor-default">Leadstor v/s Other CRMs</p>
                    </div>
                    <div className="poppins hidden md:block">
                        <h5 className="text-white pointer-events-none">- - -</h5>
                        <p className="mt-2 text-gray-500"><Link href="/about">About Us</Link></p>
                        <p className="mt-2 text-gray-500"><Link href="/contact">Contact Us</Link></p>
                        <p className="mt-2 text-gray-300 cursor-default">Resources</p>
                        <p className="mt-2 text-gray-300 cursor-default">Support</p>
                        <p className="mt-2 text-gray-300 cursor-default">Media</p>
                    </div>
                </div>
            </div>

            <section className="border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <div className="container mx-auto px-4 max-w-screen-xl">
                    <div className="w-full mx-auto max-w-screen-xl py-6 md:flex md:items-center md:justify-between">
                        <div className="cursor-default poppins text-sm text-gray-500 sm:text-center dark:text-gray-400">All Rights Reserved | Copyright &copy; {new Date().getFullYear()} Leadstor.in
                        </div>
                        <ul className="flex poppins flex-wrap items-center mt-3 text-sm font-normal text-gray-500 dark:text-gray-400 sm:mt-0">
                            <li>
                                <Link href="/terms" className="hover:underline me-4 md:me-6">Terms Of Service</Link>
                            </li>
                            <li>
                                <Link href="/privacy-policy" className="hover:underline me-4 md:me-6">Privacy Policy</Link>
                            </li>
                            <li>
                                <Link href="/refund-cancellation" className="hover:underline">Refund &amp; Cancellation</Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>
        </footer>
    );
}