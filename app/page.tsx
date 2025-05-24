"use client";

import { useForm } from "react-hook-form";
import { JSX, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaRegUser, FaShieldAlt, FaDollarSign, FaClock } from "react-icons/fa";
import Link from "next/link";

// Import static services as fallback
import { services as staticServices, Service, Testimonial, Pricing } from "@/app/lib/services";

interface FormData {
  name: string;
  phone: string;
  service: string;
  problem?: string;
}

interface FeatureCard {
  icon: JSX.Element;
  title: string;
  desc: string;
  bg: string;
  text?: string;
}

interface Brand {
  name: string;
  src: string;
}

const descriptionTexts: string[] = [
  "Welcome to Dizit Solution, your one-stop solution for all your home appliance repair needs in Varanasi!",
  "At Dizit Solution, we understand how important it is to have properly functioning home appliances. A malfunctioning appliance not only disrupts your daily routine but can also lead to unexpected expenses. That's why we are committed to providing reliable, efficient, and affordable repair services for all your home appliances.",
  "We specialize in AC Repair in Varanasi and offer a range of services for all types of air conditioners, from window units to central air systems. Our team of skilled technicians can diagnose and repair any AC problem, from refrigerant leaks to compressor failures, and get your AC up and running in no time. We also offer Refrigerator repair services to ensure your food stays fresh and safe to consume. Our technicians are trained to handle all kinds of refrigerator issues, from faulty compressors to broken door seals, and can repair all major brands and models of refrigerators.",
  "In addition to AC and refrigerator repairs, we also offer comprehensive home appliance repair services. Our team of experts can repair and service all kinds of home appliances, including washing machines, dishwashers, ovens, and more.",
  "At Dizit Solution, we believe in providing our customers with the highest level of service. Our technicians are certified and experienced, and we use only genuine parts for all our repairs. We also offer competitive pricing and provide a 100% satisfaction guarantee on all our services.",
];

const featureCards: FeatureCard[] = [
  { icon: <FaClock />, title: "On Time Services", desc: "Punctual service with minimal wait time.", bg: "bg-yellow-400" },
  { icon: <FaRegUser />, title: "Trained Professionals", desc: "Certified technicians for all repairs.", bg: "bg-blue-400", text: "text-white" },
  { icon: <FaShieldAlt />, title: "Assured Quality", desc: "High-standard servicing, guaranteed.", bg: "bg-green-400" },
  { icon: <FaDollarSign />, title: "No Extra Charges", desc: "Transparent pricing with no hidden fees.", bg: "bg-red-400" },
];

const brands: Brand[] = [
  { name: "Mitsubishi Electric", src: "/Mitsubishi_Electric_logo.svg.webp" },
  { name: "Samsung", src: "/samsung-logo.webp" },
  { name: "Panasonic", src: "/Panasonic_Group_logo.svg.webp" },
  { name: "Blue Star", src: "/blustar_logo.webp" },
  { name: "Sony", src: "/sony.webp" },
  { name: "Daikin", src: "/dekin-logo.webp" },
  { name: "Sharp", src: "/sharp-logo.webp" },
  { name: "Whirlpool", src: "/whirlpool.webp" },
  { name: "Haier", src: "/haire-logo.webp" },
  { name: "Electrolux", src: "/Electrolux-.webp" },
  { name: "Bosch", src: "/bosch-logo.webp" },
  { name: "LG", src: "/lg-logo.webp" },
];

const PHONE_NUMBER: string = process.env.NEXT_PUBLIC_PHONE || "9112564731";

export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  const [services, setServices] = useState<Service[]>(staticServices);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services");
        if (response.ok) {
          const data = await response.json();
          if (data.services && Array.isArray(data.services) && data.services.length > 0) {
            setServices(data.services);
            console.log(`Loaded ${data.services.length} services from ${data.source}`);
          }
        } else {
          console.error("Failed to fetch services, using static services");
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSubmitted(true);
        reset();
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        console.error("Failed to submit form:", await response.text());
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  return (
    <>
      <div className="bg-blue-900 text-white py-0 pt-16 md:pt-16 px-6 md:px-20 mt-0">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-between items-center space-y-8 md:space-y-0">
          <motion.div
            className="w-full md:w-1/2 text-center md:text-left p-4 md:p-6"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, type: "spring", stiffness: 50 }}
          >
            <h2 className="text-3xl font-bold mb-6">Home Appliances Repair & Services</h2>
            <motion.p
              className="mt-4 text-lg mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.5 }}
            >
              Dizit Solution is a reputable Home Appliances repair service in Varanasi, offering AC, Washing Machine, Refrigerator, and RO repair.
            </motion.p>
            <motion.p
              className="text-yellow-300 font-bold mt-2 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 1 }}
            >
              100% Customer Satisfaction Guarantee…
            </motion.p>
            <motion.button
              className="mt-4 bg-yellow-500 px-6 py-2 rounded-lg font-semibold transition-all duration-300"
              whileHover={{ scale: 1.1, backgroundColor: "#f59e0b" }}
              transition={{ duration: 0.3 }}
              onClick={() => (window.location.href = `tel:${PHONE_NUMBER}`)}
            >
              BOOK NOW @ {PHONE_NUMBER}
            </motion.button>
          </motion.div>

          <div className="w-full md:w-1/2 bg-white text-black p-6 rounded-lg mt-8 md:mt-0 shadow-lg">
            <h3 className="text-xl font-semibold text-center mb-6">Book a Technician</h3>
            {submitted && (
              <p className="text-green-600 text-center mb-4">Request Submitted Successfully!</p>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <input
                {...register("name", { required: "Name is required" })}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Name"
                aria-invalid={errors.name ? "true" : "false"}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}

              <input
                {...register("phone", {
                  required: "Phone number is required",
                  pattern: { value: /^\d{10}$/, message: "Enter a valid 10-digit phone number" },
                })}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Phone Number"
                aria-invalid={errors.phone ? "true" : "false"}
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}

              <select
                {...register("service", { required: "Please select a service" })}
                className="w-full p-2 border border-gray-300 rounded"
                aria-invalid={errors.service ? "true" : "false"}
              >
                <option value="">- Select Services -</option>
                {services.map((service) => (
                  <option key={service.id} value={service.title}>
                    {service.title}
                  </option>
                ))}
              </select>
              {errors.service && <p className="text-red-500 text-sm mt-1">{errors.service.message}</p>}

              <textarea
                {...register("problem")}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Describe Your Problem (Optional)"
              />

              <motion.button
                type="submit"
                className="w-full bg-orange-500 text-white p-2 rounded font-semibold hover:bg-orange-600 transition duration-200"
                whileHover={{ scale: 1.05 }}
              >
                BOOK TECHNICIAN
              </motion.button>
            </form>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="bg-yellow-300 text-yellow-900 font-semibold text-lg py-3">
          Book A Technician @ Call Now - {PHONE_NUMBER} | On Time Services
        </p>
        <motion.div
          className="relative w-full mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className="relative"
            whileHover={{ rotate: 5, scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <img
              src="/for-sale.webp"
              alt="Experienced Home Appliance Technician"
              className="w-full h-auto mx-auto rounded-lg shadow-lg transition-transform duration-300"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black opacity-20 rounded-lg"></div>
        </motion.div>
      </div>

      <div className="bg-gray-100 py-12 px-6 md:px-20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h2
            className="text-3xl font-bold text-blue-800 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            About Dizit Solution
          </motion.h2>

          <motion.p
            className="text-lg text-gray-700 mb-6 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
          >
            Dizit Solution is your trusted provider for a wide range of home appliance services in Varanasi. Our dedicated team of professionals offers on-demand solutions for all your household needs, including installation, repair, and maintenance services for a variety of appliances. We cater to a diverse range of products, ensuring that you can rely on us for split or window ACs, refrigerators, washing machines, microwaves, induction cooktops, geysers, water purifiers, mixers, chimneys, and more.
          </motion.p>

          <motion.p
            className="text-lg text-gray-700 mb-6 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 1, ease: "easeOut" }}
          >
            Our expertise extends to servicing models from top brands such as LG, Samsung, Sony, Bajaj, Daikin, Blue Star, Voltas, Prestige, Carrier, General, Panasonic, Mitsubishi, Haier, Whirlpool, Videocon, Godrej, Onida, Kenstar, and many others. We are committed to providing prompt and hassle-free services so that you can enjoy a seamless experience with your home appliances.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            {featureCards.map((item, index) => (
              <motion.div
                key={index}
                className={`flex items-center space-x-4 ${item.bg} p-4 rounded-lg shadow-lg text-center`}
                whileHover={{ scale: 1.05, boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <span className={`text-3xl text-blue-900`}>{item.icon}</span>
                <div>
                  <h3 className={`font-semibold text-xl text-blue-900 ${item.text || ""}`}>{item.title}</h3>
                  <p className={`text-gray-700 mt-2 ${item.text ? "text-gray-100" : ""}`}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p
            className="text-xl text-blue-900 font-semibold mt-8 bg-yellow-300 p-4 rounded-lg shadow-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 1.5, ease: "easeOut" }}
            whileHover={{ scale: 1.05 }}
          >
            Book A Technician @ Call Now – <span className="text-red-600">{PHONE_NUMBER}</span> | On Time Services
          </motion.p>
        </div>
      </div>

      <div id="services" className="bg-gray-100 py-12 px-6 md:px-20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h2
            className="text-3xl font-bold text-blue-800 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            Home Appliance Services in Varanasi
          </motion.h2>

          <motion.p
            className="text-lg text-gray-700 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.5 }}
          >
            We provide a wide range of home appliance services in Varanasi, including installation, repair, and maintenance for various appliances.
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {loading ? (
              Array(4).fill(0).map((_, index) => (
                <div key={index} className="flex flex-col items-center space-y-4 bg-white p-4 rounded-lg shadow-lg border border-neutral-200 animate-pulse">
                  <div className="w-full h-48 bg-gray-300 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-full"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                  <div className="h-10 bg-gray-300 rounded w-1/2 mt-4"></div>
                </div>
              ))
            ) : (
              services.map((service) => (
                <motion.div
                  key={service.id}
                  className="flex flex-col items-center space-y-4 bg-white p-4 rounded-lg shadow-lg border border-neutral-200 dark:border-slate-800"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src={service.img}
                    alt={`${service.title} Service`}
                    className="w-full h-48 object-cover mb-4 rounded-lg"
                  />
                  <h3 className="font-semibold text-lg">{service.title}</h3>
                  <p className="text-gray-700 text-center">{service.desc}</p>
                  <Link href={`/servicedetails/${service.id}`} prefetch={true}>
                    <motion.button
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      Learn More
                    </motion.button>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-100 py-12 px-6 md:px-20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h2
            className="text-4xl font-bold text-blue-800 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            Home Appliances Repair & Services in Varanasi
          </motion.h2>

          {descriptionTexts.map((text, index) => (
            <motion.p
              key={index}
              className="text-lg text-gray-700 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.5 + index * 0.2 }}
            >
              {text
                .split(/(AC Repair|Refrigerator repair|repair services|home appliance repair)/gi)
                .map((part, idx) =>
                  ["AC Repair", "Refrigerator repair", "repair services", "home appliance repair"].includes(
                    part
                  ) ? (
                    <span key={idx} className="font-semibold text-yellow-500">
                      {part}
                    </span>
                  ) : (
                    part
                  )
                )}
            </motion.p>
          ))}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 1.5 }}
          >
            <p className="text-xl font-semibold text-blue-900">
              Contact us today to schedule your{" "}
              <span className="font-semibold text-yellow-500">AC Repair</span> in Varanasi,{" "}
              <span className="font-semibold text-yellow-500">Refrigerator Repair</span>,{" "}
              <span className="font-semibold text-yellow-500">Washing Machine Repair</span>, or any other
              home appliance repair service. We are available 24/7 to provide you with prompt and reliable
              service.
            </p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              className="bg-blue-600 text-white py-3 px-6 rounded-full mt-4 hover:bg-orange-600 transition duration-300"
              onClick={() => (window.location.href = `tel:${PHONE_NUMBER}`)}
            >
              <span className="font-bold text-white">Book Now @ {PHONE_NUMBER}</span>
            </motion.button>
          </motion.div>
        </div>
      </div>

      <div className="bg-gray-100 py-12 px-6 md:px-20">
        <div className="max-w-7xl mx-auto text-center md:flex md:items-center">
          <div className="md:w-1/2 mb-8 md:mb-0 text-left">
            <motion.h2
              className="text-4xl font-bold text-blue-800 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              Why Choose Dizit Solution
            </motion.h2>

            <motion.p
              className="text-lg text-gray-700 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.5 }}
            >
              At <span className="font-semibold text-yellow-500">Dizit Solution</span>, we pride ourselves
              on being one of the most reliable and trustworthy home appliance repair service providers in
              Varanasi. Here are some reasons why you should choose us for your{" "}
              <span className="font-semibold text-yellow-500">AC services</span>,{" "}
              <span className="font-semibold text-yellow-500">refrigerator services</span>, and other home
              appliance repairs.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 1 }}
              className="mb-8"
            >
              <h3 className="text-2xl font-semibold text-blue-900 mb-4">Skilled and Experienced Technicians</h3>
              <p className="text-lg text-gray-700">
                Our team of technicians is highly skilled, experienced, and trained to handle all kinds of
                home appliance repairs. They have extensive knowledge of all major brands and models and can
                diagnose and repair any issue quickly and efficiently.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 1.3 }}
              className="mb-8"
            >
              <h3 className="text-2xl font-semibold text-blue-900 mb-4">Quality Service You Can Trust</h3>
              <p className="text-lg text-gray-700">
                We ensure the highest standards of repair by using only genuine parts and the latest tools.
                Our technicians diagnose the issue meticulously and explain the repair process to you,
                ensuring complete transparency.
              </p>
            </motion.div>
          </div>

          <div className="md:w-1/2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 1.5 }}
            >
              <img
                src="/technician-repairing-home-appliance.webp"
                alt="Dizit Solution Technician Repairing Home Appliance"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </motion.div>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 py-12 px-6 md:px-20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h2
            className="text-4xl font-bold text-blue-900 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            Brands We Repair
          </motion.h2>

          <motion.p
            className="text-lg text-gray-700 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.5 }}
          >
            We repair a wide range of major brands, makes, and models, regardless of where they were purchased.
          </motion.p>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
            {brands.map((brand) => (
              <motion.div
                key={brand.name}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center items-center cursor-pointer"
              >
                <img
                  src={brand.src}
                  alt={`${brand.name} Logo`}
                  className="h-20 object-contain"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}