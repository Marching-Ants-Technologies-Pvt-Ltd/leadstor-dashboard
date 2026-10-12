
import Image from "next/image";

export default function Customers() {

    const banners = [
        "AsquareTechnologies.png",
        "CambridgeAcademyofEnglish.png",
        "CokonetAcademy.jpg",
        "EdwiseUpgradeInfotech.jpeg",
        "IIPCPune.png",
        "JehangirCentreforLearning.png",
        "LuminarTechnolab.jpg",
        "NewWingsITPune.png",
        "Protouch.jpeg",
        "TIFAJaipur.png"
    ];

    return (
        <>
            <section id='customer' className="bg-white pt-6">
                <div className="hidden justify-center align-middle">
                    <h2 className="bg-blue-100 px-6 py-2 rounded-full font-medium text-sm text-gray-800 uppercase">Our Customers</h2>
                </div>
                <h3 className="mb-16 mt-10 poppins text-gray-700 text-center text-xl px-3 sm:text-3xl font-semibold">Trusted by over 100+ organizations around the world</h3>

                <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
                    <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll">
                        {banners.map((image, index) => (
                            <li key={index} className="h-[70px]">
                                <img
                                    alt={(image.split(".")[0])}
                                    loading="lazy"
                                    className="mix-blend-color h-full object-cover overflow-hidden"
                                    src={`/banners/customers/${image}`} />
                            </li>
                        ))}
                    </ul>
                    <ul className="flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll" aria-hidden="true">
                        {banners.map((image, index) => (
                            <li key={index} className="h-[70px]">
                                <img
                                    alt={(image.split(".")[0])}
                                    loading="lazy"
                                    className="mix-blend-color h-full object-cover overflow-hidden"
                                    src={`/banners/customers/${image}`} />
                            </li>
                        ))}
                    </ul>
                </div>

            </section>
        </>
    );
}