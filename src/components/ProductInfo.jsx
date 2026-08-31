import Image from "next/image";

export default function ProductInfo() {
    return (
        <>
            <section className="bg-white">
                <div className="container mx-auto px-4 max-w-screen-xl pt-16 cursor-default">
                    <div className="lg:flex gap-16 xl:gap-32">
                        <div className="flex-1 lg:flex justify-center hidden">
                            <Image
                                className="pointer-events-none select-none"
                                placeholder='empty'
                                src="/banners/about-light-01.webp"
                                width={588}
                                height={0}
                                alt="Leadstor banner"
                                priority
                            />
                        </div>
                        <div className="flex-1 px-4 sm:px-10 lg:px-0">
                            <h4 className="mt-8 flex uppercase poppins text-gray-500 text-base relative pl-20 sm:pl-24 font-semibold">
                                <span className="bg-green-500 text-white absolute left-0 py-1 px-4 rounded-3xl top-[-4px]">New</span>
                                start tracking leads
                            </h4>
                            <h3 className="text-4xl lg:text-5xl font-bold text-gray-700 mt-6">Know More About Our <span className="foot-brush brush-green">Product</span>.</h3>
                            <p className="text-gray-600 mt-4 lg:mt-8 font-normal text-lg">Explore how our solution can optimize your lead management, streamline processes, and drive better results for your business.</p>

                            <div className="flex mt-6 lg:mt-8 gap-4">
                                <div className="hidden sm:flex justify-center items-center border h-8 w-8 border-gray-300 rounded-full font-semibold text-base">
                                    01
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-xl text-gray-700">Online &amp; third-party leads</h4>
                                    <p className="text-base text-gray-600 pl-1">Website forms, chatbot, ads, social media, lead aggregators etc</p>
                                </div>
                            </div>
                            <div className="flex mt-4 lg:mt-8 gap-4">
                                <div className="hidden sm:flex justify-center items-center border h-8 w-8 border-gray-300 rounded-full font-semibold text-base">
                                    02
                                </div>
                                <div>
                                    <h4 className="font-semibold text-xl text-gray-700">Offline leads</h4>
                                    <p className="text-base text-gray-600 pl-1">list import, phone calls, voicemails</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:flex gap-16 xl:gap-32 pt-12 lg:pt-16">
                        <div className="flex-1 px-4 sm:px-10 lg:px-0">
                            <h4 className="mt-8 flex uppercase poppins text-gray-500 text-base font-semibold">grow your business faster</h4>
                            <h3 className="text-4xl lg:text-5xl font-bold text-gray-700 mt-2">Track Your Lead <span className="foot-brush brush-yellow">Activities</span></h3>
                            <p className="text-gray-600 mt-4 lg:mt-8 font-normal text-lg">Efficiently track audience activities in real-time, helping you make smarter decisions and accelerate business growth.</p>
                            <div className="mt-8 text-base text-gray-700 font-semibold">
                                <a className="flex items-center cursor-pointer">
                                    Know More
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="none" className="relative top-[2px] ml-2 pointer-events-none">
                                        <path d="M13.4767 9.16701L9.00668 4.69701L10.185 3.51868L16.6667 10.0003L10.185 16.482L9.00668 15.3037L13.4767 10.8337H3.33334V9.16701H13.4767Z" fill="black" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                        <div className="flex-1 lg:flex pt-8 xl:pt-0 justify-center hidden">
                            <Image
                                className="pointer-events-none select-none"
                                placeholder='empty'
                                src="/banners/about-light-02.webp"
                                width={588}
                                height={0}
                                alt="Leadstor banner"
                                priority
                            />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}