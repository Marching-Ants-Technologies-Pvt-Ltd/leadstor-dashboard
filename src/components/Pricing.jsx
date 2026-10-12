
import Image from 'next/image';
import Button from '@/components/elements/Button';

const plans = [
    {
        name: 'Starter',
        description: 'For small businesses looking to increase sales',
        price: '₹2,199/month',
        primaryButton: 'Grow my sales',
        secondaryButton: null,
        headerClass: 'bg-gray-50',
        featuresIntro: 'Intrgration with your lead sources',
        features: [
            {
                title: 'No Sales Person Login Restriction',
            },
            {
                title: 'Manage Upto 1500 leads/month',
            },
            {
                title: 'Lead Capture',
                children: [
                    'Capture Leads from Facebook, Website, GoogleAds, Sulekha, Justdial, UrbanPro, Webhook/API etc.',
                    'Zero Lead SPill',
                ],
            },
            {
                title: 'Lead Management',
                children: [
                    'Realtime Lead Capture',
                    'Auto Assign Leads to User',
                    'Lead Tracking',
                    'Duplicate Lead Blocking',
                    'FollowUp Reminders to User',
                    'Lead Analytics',
                    'Track Users',
                ],
            },
        ],
        rounded: 'rounded-tl-xl',
        buttonClass: 'bg-gray-700 hover:bg-gray-800',
    },
    {
        name: 'Basic',
        badge: 'Popular',
        description: 'For SMBs with marketing team and hungry for growth',
        price: '₹5,199/month',
        primaryButton: 'Put Me In Growth Phase',
        secondaryButton: 'Contact Sales',
        headerClass: 'bg-blue-50',
        featuresIntro: 'Everything in Starter, plus',
        features: [
            {
                title: 'Manage Upto 5,000 leads/month',
            },
            {
                title: 'Payments Management',
                children: [
                    'Automated Payment FollowUp Reminders',
                    'Automated Receipt Generation',
                    'Payment Reports',
                ],
            },
        ],
        buttonClass: 'bg-blue-600 hover:bg-blue-700',
    },
    {
        name: 'Growth',
        badge: 'Popular',
        description: 'For businesses which are at expanding stage like starting with franchise or internal team',
        price: '₹9,999/month',
        primaryButton: 'Organize My Business',
        secondaryButton: 'Contact Sales',
        headerClass: 'bg-blue-50',
        featuresIntro: 'Everything in Basic, plus',
        features: [
            {
                title: 'Manage Upto 12,000 leads/month',
            },
            {
                title: 'Placement Management',
            },
            {
                title: 'Batch & Attendance Management',
            },
            {
                title: 'Lead Nurturing',
            },
            {
                title: 'Customization',
            },
            {
                note: '*Minor customization, which will align with our general flow.',
            },
        ],
        buttonClass: 'bg-blue-600 hover:bg-blue-700',
    },
    {
        name: 'Pro',
        badge: 'Popular',
        description: 'For high volume business',
        price: '₹14,999/month',
        primaryButton: 'Accelarate My Sales',
        secondaryButton: 'Contact Sales',
        headerClass: 'bg-blue-50',
        featuresIntro: 'Everything in Growth, plus',
        features: [
            {
                title: 'Manage Upto 25,000 leads/month',
            },
        ],
        buttonClass: 'bg-blue-600 hover:bg-blue-700',
    },
    {
        name: 'Scale',
        description: 'For multi franchise or branches',
        price: '₹24,999/month',
        primaryButton: 'Organize And Push My Sales',
        secondaryButton: null,
        headerClass: 'bg-green-50',
        featuresIntro: 'Everything in Pro, plus',
        features: [
            {
                title: 'Manage Upto 50,000 leads/month',
            },
        ],
        rounded: 'rounded-tr-xl',
        buttonClass: 'bg-blue-600 hover:bg-blue-700',
    },
    {
        name: 'Enterprise',
        badge: 'Popular',
        description: 'For for big corporations',
        price: 'Custom pricing',
        primaryButton: 'Evaluate US',
        secondaryButton: 'Contact Sales',
        headerClass: 'bg-blue-50',
        featuresIntro: 'Everything in Scale, plus',
        features: [
            {
                title: 'Direct access to management/month',
            },
            {
                title: 'Custom solution',
            },
        ],
        buttonClass: 'bg-blue-600 hover:bg-blue-700',
    },
];

export default function Pricing() {
    return (
        <section
            id="pricing"
            className="container mx-auto max-w-screen-xl px-4"
        >
            <div className="py-14 cursor-default">

                {/* Heading */}
                <div className="flex justify-center">
                    <h2 className="rounded-full bg-blue-100 px-6 py-2 text-sm font-medium uppercase text-gray-800">
                        Pricing Plans
                    </h2>
                </div>

                <h3 className="mt-10 text-center text-4xl font-semibold poppins">
                    Grow with the right plan
                </h3>

                <p className="mx-auto mt-4 max-w-3xl text-center text-sm text-gray-500 poppins sm:text-base">
                    Discover the best leads, boost customer engagement, and drive
                    deals to closure with a smart, comprehensive solution.
                </p>

                {/* Pricing Grid */}
                <div className="mt-10 grid grid-cols-1 overflow-hidden rounded-xl border border-[#b5b8bc] bg-white md:grid-cols-2 lg:grid-cols-3">

                    {plans.map((plan, index) => (
                        <div
                            key={plan.name}
                            className={`
                                flex min-w-0 flex-col
                                border-b border-[#b5b8bc]
                                ${index % 2 !== 1 ? 'md:border-r' : ''}
                                lg:border-r
                                ${index === plans.length - 1 ? 'border-b-0' : ''}
                                ${index === 2 ? 'lg:border-r-0' : ''}
                                ${index === 4 ? 'lg:border-r-0' : ''}
                            `}
                        >
                            {/* Plan Header */}
                            <div
                                className={`
                                    relative flex min-h-[435px] w-full flex-col
                                    border-b border-[#b5b8bc]
                                    ${plan.headerClass}
                                    ${plan.rounded || ''}
                                `}
                            >
                                <div className="flex flex-1 flex-col px-6 py-6">

                                    <h4 className="text-left text-2xl font-semibold poppins">
                                        {plan.name}

                                        {plan.badge && (
                                            <span className="relative bottom-1 ml-2 rounded bg-[#bdd7ff] px-2 py-1 text-xs font-semibold uppercase text-black">
                                                {plan.badge}
                                            </span>
                                        )}
                                    </h4>

                                    <p className="mt-4 min-h-[48px] text-left text-sm font-normal text-gray-500 antialiased">
                                        {plan.description}
                                    </p>

                                    <div className="mt-6 text-left">
                                        <div className="text-2xl font-semibold poppins">
                                            {plan.price}
                                        </div>

                                        {plan.price !== 'Custom pricing' && (
                                            <div className="mt-1 text-sm">
                                                Discount on annual subscription
                                            </div>
                                        )}

                                        <div className="mt-10 space-y-3">
                                            <Button
                                                href="/signup?sub=bm"
                                                className={`
                                                    w-full rounded-lg px-6 py-3
                                                    text-sm font-medium text-white
                                                    transition duration-300
                                                    ${plan.buttonClass}
                                                `}
                                            >
                                                {plan.primaryButton}
                                            </Button>

                                            {plan.secondaryButton ? (
                                                <Button
                                                    href="/signup?sub=bm"
                                                    className="w-full rounded-lg bg-blue-transparent px-6 py-3 text-sm font-medium text-gray-600 transition duration-300 hover:bg-blue-100"
                                                >
                                                    {plan.secondaryButton}
                                                </Button>
                                            ) : (
                                                <div className="h-[46px]" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {plan.badge && (
                                    <Image
                                        className="absolute right-3 top-3 rounded-3xl bg-white p-[5px]"
                                        src="/icons/crown_32.svg"
                                        width={32}
                                        height={32}
                                        alt="leadstor Popular Plan"
                                    />
                                )}
                            </div>

                            {/* Features */}
                            <div className="flex-1 px-6 py-8 sm:px-10">
                                <p className="text-sm font-normal italic">
                                    {plan.featuresIntro}
                                </p>

                                <ul
                                    role="list"
                                    className="mt-6 space-y-4 text-left"
                                >
                                    {plan.features.map((feature, featureIndex) => (
                                        <li key={featureIndex}>
                                            {feature.note ? (
                                                <p className="text-sm italic">
                                                    {feature.note}
                                                </p>
                                            ) : (
                                                <>
                                                    <div className="flex items-start gap-2 sm:gap-3">
                                                        <Image
                                                            src="/icons/tick.svg"
                                                            width={22}
                                                            height={22}
                                                            alt="Tick"
                                                            className="mt-0.5 h-[22px] w-[22px] shrink-0"
                                                        />

                                                        <span
                                                            className={`
                                                                text-xs sm:text-sm
                                                                ${feature.children ? 'font-semibold' : ''}
                                                            `}
                                                        >
                                                            {feature.title}
                                                        </span>
                                                    </div>

                                                    {feature.children && (
                                                        <ul className="ml-9 mt-1 list-disc space-y-2 text-sm sm:ml-12">
                                                            {feature.children.map(
                                                                (child, childIndex) => (
                                                                    <li key={childIndex}>
                                                                        {child}
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    )}
                                                </>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}

                </div>

                {/* Integrations */}
                <div className="mt-28 mb-8 flex w-full flex-col gap-8 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 py-20 lg:flex-row lg:items-center">

                    <div className="flex-1 pl-14">
                        <h4 className="text-xl font-semibold text-gray-700 poppins sm:text-3xl">
                            Sales Communication Integrations
                        </h4>

                        <div className="mt-4 pr-20 text-base font-normal text-gray-500 antialiased">
                            If you have subscribed to third-party services with active
                            Webhooks or APIs and want to integrate them with Leadstor,
                            we are here to assist you. Our team will ensure a seamless
                            integration process, enhancing your lead management
                            experience. Even if you are not tech-savvy, we will guide
                            you every step of the way to make the process simple and
                            effective. We currently offer Email, SMS, Whatsapp Message
                            Service, IVR Phone Call Tracking.
                        </div>

                        <Button
                            className="rounded border mt-10 border-gray-400 px-6 py-3 text-sm text-gray-600 hover:border-gray-500 hover:text-gray-800 poppins"
                        >
                            View All Integrations
                        </Button>
                    </div>

                    <div className="flex min-h-[200px] items-center justify-end">
                        <img
                            className="h-auto w-full max-w-[500px] object-contain"
                            src="/banners/third-party-integrations.png"
                            alt="integrations banner"
                            loading="lazy"
                        />
                    </div>
                </div>

            </div>
        </section>
    );
}