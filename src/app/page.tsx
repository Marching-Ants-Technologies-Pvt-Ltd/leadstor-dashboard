import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Pricing from "@/components/Pricing";
import Customers from "@/components/Customers";
import Button from '@/components/elements/Button';
import ProductInfo from '@/components/ProductInfo';

export default function Home() {
  return (
    <>
      <Navbar />

      <header className="border-gray-200 bg-gray-50">
        <div className="container pt-8 mx-auto px-4 max-w-screen-xl h-85vh">
          <div className="grid grid-cols-1 gap-10 py-10 lg:py-24 px-5 sm:px-10 xl:gap-20 xl:px-0 lg:grid-cols-2">
            <div className="m-auto">
              <h1 className="text-2xl sm:text-5xl hero-text-color font-bold text-gray-800 ">AI-Powered Lead Management & Sales Automation to Close 2X More Leads</h1>
              <p className="mt-8 text-base sm:text-lg text-gray-600">Capture, qualify, assign, and follow up with every lead automatically. LeadStor helps sales teams streamline lead management, automate lead distribution and follow-ups, and convert more prospects into customers—without hiring more salespeople.</p>
              <div className="flex justify-start items-center gap-4">
                <Button className="text-white bg-gradient-to-r from-gray-600 to-gray-800 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-gary-300 dark:focus:ring-gray-800 font-medium rounded-md text-sm px-5 py-4 text-center m mt-16 uppercase" href='/contact '>Book a demo</Button>
                <Button className="text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-md text-sm px-5 py-4 text-center me-2 mt-16 uppercase" href='/signup '>CREATE A FREE ACCOUNT</Button>
              </div>
              <p className="mt-4 text-gray-500 text-sm">Respond faster. Follow up automatically. Convert more leads before they go cold.</p>
            </div>
            <div className='order-first lg:order-none'>
              <Image
                className="mix-blend-multiply"
                placeholder='empty'
                src="/banners/hero-image-sm.webp"
                width={1000}
                height={604}
                alt="Leadstor Hero banner"
                priority
              />
            </div>
          </div>
        </div>
      </header>

      <Customers />

      <main className="container mx-auto px-4 max-w-screen-xl">

        <div id='why-leadstor' className="py-14 cursor-default lg:py-20 px-5 sm:px-10 xl:px-0 poppins">
          <div className="flex justify-center align-middle">
            <h2 className="bg-blue-100 px-6 py-2 rounded-full text-sm text-gray-800 font-medium uppercase">Lead Management</h2>
          </div>

          <div className="grid">
            <div className='m-auto'>
              <Image
                className="mix-blend-multiply"
                placeholder='empty'
                src="/banners/lead-360-view.webp"
                width={1216}
                height={600}
                alt="Leadstor Hero banner"
                priority
              />
            </div>
          </div>

          <h3 className="text-center text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-700 mt-12">Every Minute You Delay, Another Lead Goes Cold</h3>
          <p className="text-center px-0 md:px-10 lg:px-40 xl:px-60 text-gray-600 mt-4">When leads aren&apos;t contacted quickly, conversion opportunities disappear. LeadStor automatically captures and assigns new leads, alerts your sales team, and keeps follow-ups on track—helping you respond faster and turn more leads into customers.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-10 sm:mt-20 bg-gray-200 gap-px">
            {/* Card #1 */}
            <div className="bg-gray-50 p-8 hover:shadow-2xl cursor-pointer">
              <div className="h-12 w-12 bg-blue-500 text-white flex justify-center items-center rounded-md pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none">
                  <path d="M6.57757 15.4816C5.1628 16.324 1.45336 18.0441 3.71266 20.1966C4.81631 21.248 6.04549 22 7.59087 22H16.4091C17.9545 22 19.1837 21.248 20.2873 20.1966C22.5466 18.0441 18.8372 16.324 17.4224 15.4816C14.1048 13.5061 9.89519 13.5061 6.57757 15.4816Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16.5 6.5C16.5 8.98528 14.4853 11 12 11C9.51472 11 7.5 8.98528 7.5 6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5Z" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <h4 className="mt-4 mb-3 text-xl font-semibold text-gray-700 pointer-events-none">Lead Generation</h4>
              <p className="text-base text-justify text-gray-600 pointer-events-none">
                Capture every lead instantly — from Website, Facebook, Google etc — without manual dependency. Never miss a follow up as LeadStor sends real time reminder to your team.
              </p>
            </div>

            {/* Card #2 */}
            <div className="bg-gray-50 p-8 hover:shadow-2xl cursor-pointer">
              <div className="h-12 w-12 bg-blue-500 text-white flex justify-center items-center rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none">
                  <path d="M20.4371 12.5061C23.4219 7.00258 22.0614 3.26685 16.9548 3C13.2433 3.07086 9.41471 5.07063 6.35871 8.16433C3.79408 10.7606 1.26891 14.479 2.1959 18.018C2.40059 18.7994 2.79969 19.3318 3.43015 19.8328C5.12441 21.1791 6.7874 21.2976 9.99031 20.5113C13.2339 19.5257 15.2448 18.0408 16.9404 16.5217M16.9404 16.5217C16.9421 16.5201 16.9439 16.5185 16.9457 16.5169C16.9489 16.5141 16.9468 16.5087 16.9425 16.5087C16.9393 16.5087 16.937 16.512 16.9381 16.515C16.9389 16.5173 16.9396 16.5195 16.9404 16.5217ZM16.9404 16.5217C17.3108 17.6169 17.0762 18.5944 16.4385 20.5113" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h4 className="mt-4 mb-3 text-xl font-semibold text-gray-700">360-Degree View of Leads</h4>
              <p className="text-base text-justify text-gray-600">Gain a 360-degree view of each contact&apos;s journey through all lifecycle stages. With Leadstor, your sales team can monitor, engage, and nurture leads in real-time, improving sales efficiency and driving conversions.</p>
            </div>

            {/* Card #3 */}
            <div className="bg-gray-50 p-8 hover:shadow-2xl cursor-pointer">
              <div className="h-12 w-12 bg-blue-500 text-white flex justify-center items-center rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none">
                  <path d="M2 11C4.3317 8.55783 7.64323 8.44283 10 11M8.49509 4.5C8.49509 5.88071 7.37421 7 5.99153 7C4.60885 7 3.48797 5.88071 3.48797 4.5C3.48797 3.11929 4.60885 2 5.99153 2C7.37421 2 8.49509 3.11929 8.49509 4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M14 22C16.3317 19.5578 19.6432 19.4428 22 22M20.4951 15.5C20.4951 16.8807 19.3742 18 17.9915 18C16.6089 18 15.488 16.8807 15.488 15.5C15.488 14.1193 16.6089 13 17.9915 13C19.3742 13 20.4951 14.1193 20.4951 15.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M3 14C3 17.87 6.13 21 10 21L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 3H21M15 6H21M15 9H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h4 className="mt-4 mb-3 text-xl font-semibold text-gray-700">Lead Distribution</h4>
              <p className="text-base text-justify text-gray-600">Effortlessly track and distribute leads to the right teams with automated assignment based on criteria like requirements or territory. Save time, boost efficiency, and optimize lead handling for faster conversions.</p>
            </div>

            {/* Card #4 */}
            <div className="bg-gray-50 p-8 hover:shadow-2xl cursor-pointer">
              <div className="h-12 w-12 bg-blue-500 text-white flex justify-center items-center rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none">
                  <path d="M13 15C10.7083 21 4.29167 15 2 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15.5 15H17.0013C19.3583 15 20.5368 15 21.2691 14.2678C22.0013 13.5355 22.0013 12.357 22.0013 10V8C22.0013 5.64298 22.0013 4.46447 21.2691 3.73223C20.5368 3 19.3583 3 17.0013 3H13.0013C10.6443 3 9.46576 3 8.73353 3.73223C8.11312 4.35264 8.01838 5.29344 8.00391 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="7.5" cy="12.5" r="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 7H18M18 11H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h4 className="mt-4 mb-3 text-xl font-semibold text-gray-700">Lead Nurturing</h4>
              <p className="text-base text-justify text-gray-600">Nurture leads with targeted campaigns across the sales and marketing funnels. Leadstor helps you create personalized experiences that guide leads through their journey, boosting conversion chances.</p>
            </div>

            {/* Card #5 */}
            <div className="bg-gray-50 p-8 hover:shadow-2xl cursor-pointer">
              <div className="h-12 w-12 bg-blue-500 text-white flex justify-center items-center rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none">
                  <path d="M14.9263 2.91103L8.27352 6.10452C7.76151 6.35029 7.21443 6.41187 6.65675 6.28693C6.29177 6.20517 6.10926 6.16429 5.9623 6.14751C4.13743 5.93912 3 7.38342 3 9.04427V9.95573C3 11.6166 4.13743 13.0609 5.9623 12.8525C6.10926 12.8357 6.29178 12.7948 6.65675 12.7131C7.21443 12.5881 7.76151 12.6497 8.27352 12.8955L14.9263 16.089C16.4534 16.8221 17.217 17.1886 18.0684 16.9029C18.9197 16.6172 19.2119 16.0041 19.7964 14.778C21.4012 11.4112 21.4012 7.58885 19.7964 4.22196C19.2119 2.99586 18.9197 2.38281 18.0684 2.0971C17.217 1.8114 16.4534 2.17794 14.9263 2.91103Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11.4581 20.7709L9.96674 22C6.60515 19.3339 7.01583 18.0625 7.01583 13H8.14966C8.60978 15.8609 9.69512 17.216 11.1927 18.197C12.1152 18.8012 12.3054 20.0725 11.4581 20.7709Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7.5 12.5V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h4 className="mt-4 mb-3 text-xl font-semibold text-gray-700">Lead Automation</h4>
              <p className="text-base text-justify text-gray-600">Responding within 1 minute can increase conversions by 7X</p>
            </div>

            {/* Card #6 */}
            <div className="bg-gray-50 p-8 hover:shadow-2xl cursor-pointer">
              <div className="h-12 w-12 bg-blue-500 text-white flex justify-center items-center rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none">
                  <path d="M5.22576 11.3294L12.224 2.34651C12.7713 1.64397 13.7972 2.08124 13.7972 3.01707V9.96994C13.7972 10.5305 14.1995 10.985 14.6958 10.985H18.0996C18.8729 10.985 19.2851 12.0149 18.7742 12.6706L11.776 21.6535C11.2287 22.356 10.2028 21.9188 10.2028 20.9829V14.0301C10.2028 13.4695 9.80048 13.015 9.3042 13.015H5.90035C5.12711 13.015 4.71494 11.9851 5.22576 11.3294Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h4 className="mt-4 mb-3 text-xl font-semibold text-gray-700">Real-time Insights & Reports</h4>
              <p className="text-base text-justify text-gray-600">Access detailed, real-time insights to measure every aspect of your lead management process – from campaign performance to conversion rates. Make data-driven decisions with powerful analytics and reporting tools.</p>
            </div>

          </div>

          <div className="bg-white w-full mt-40 rounded-md flex gap-0 lg:gap-40">
            <div className="grow p-0 sm:pr-0">
              <h4 className="font-semibold text-4xl text-gray-700 select-none"><span className="foot-brush brush-yellow">Discover</span> Leadstor in Action</h4>
              <p className="mt-4 text-gray-600 mb-8 select-none">Watch our YouTube video to see how Leadstor simplifies lead management, boosts conversions, and streamlines your sales process.</p>
              <a href="https://youtu.be/FnJnWArLyV4" target="_blank"
                className="inline-flex items-center py-3 px-6 bg-red-50 hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-red-500 hover:text-white rounded-md transition duration-300">
                <span className="text-sm select-none">Watch Now</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <path d="M9.00005 6C9.00005 6 15 10.4189 15 12C15 13.5812 9 18 9 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
            <div className="hidden sm:flex min-w-[300px]">
              <Image
                className="mix-blend-multiply rounded-md pointer-events-none select-none"
                placeholder='empty'
                src="/banners/youtube-phone.webp"
                width={400}
                height={400}
                alt="Leadstor Hero banner"
                priority
              />
            </div>
          </div>

        </div>
      </main>

      <ProductInfo />
      <Pricing />
      <Footer />

    </>
  );
}
