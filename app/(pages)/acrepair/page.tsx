'use client';
import Image from "next/image";
import { motion } from 'framer-motion';
import Link from "next/link";

// AC Service Data
interface Service {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

const services: Service[] = [
  { id: 'split-ac-repair', title: 'Split AC Repair', description: 'Installation, uninstallation, and servicing for indoor & outdoor units. Our expert technicians ensure efficient and long-lasting repair solutions.', imageUrl: '/splitacrepair.webp' },
  { id: 'multi-split-ac-repair', title: 'Multi-Split AC Repair', description: 'Expert repair services for all brands of built-in multi-split AC systems, ensuring optimal cooling for multiple rooms.', imageUrl: '/multisplit.webp' },
  { id: 'window-ac-repair', title: 'Window AC Repair', description: 'Installation, uninstallation, and servicing of window AC units. Our technicians will quickly identify and fix any issues.', imageUrl: '/windowac.webp' },
  { id: 'ac-gas-filling', title: 'AC Gas Filling', description: 'Professional gas refilling to restore optimal cooling performance using high-quality refrigerants.', imageUrl: '/fillinggas.webp' },
  { id: 'ac-installation', title: 'AC Installation', description: 'Professional AC installation services for all types of AC units, ensuring precise and safe installation.', imageUrl: '/iacinstallation.webp' },
  { id: 'ac-service', title: 'AC Service', description: 'Expert installation, maintenance, and repair services for all types of air conditioning units.', imageUrl: '/ac2.jpeg' },
];

const commonIssues: string[] = [
  "AC not turning on", "AC not cooling properly", "AC blowing warm air", "Water leaking from AC",
  "AC making strange noises", "AC not blowing air", "Frozen evaporator coils", "Frequent cycling on and off",
  "Bad odors from the AC", "AC not responding to thermostat", "High energy bills", "AC tripping the circuit breaker"
];

export default function ACServices() {
  return (
    <>
      {/* Hero Section */}
      <div className="relative">
        {/* Background Image with Overlay */}
        <div className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-blue-700/50 z-10"></div>
          <Image
            src="/acrepair.jpg"
            alt="AC Repair Service"
            fill
            style={{ objectFit: 'cover' }}
            className="z-0"
            priority
          />
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 z-20 flex items-center">
          <div className="container mx-auto px-4 md:px-8">
            <motion.div
              className="max-w-2xl bg-blue-900/40 backdrop-blur-sm p-6 md:p-8 rounded-lg shadow-2xl"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h1
                className="text-3xl md:text-5xl font-bold mb-4 text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                AC Repair & Services in Varanasi
              </motion.h1>

              <motion.p
                className="text-lg text-white/90 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                We offer top-notch AC repair, servicing, and installation services in Varanasi at competitive prices. Our skilled technicians will arrive at your location at your preferred time.
              </motion.p>

              <motion.div
                className="bg-yellow-400 text-blue-900 font-bold py-3 px-4 rounded-md inline-block mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                100% Customer Satisfaction Guarantee!
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <a
                  href="tel:7324802379"
                  className="bg-white text-blue-900 hover:bg-yellow-400 font-bold py-3 px-6 rounded-md transition duration-300 text-center flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  Call Now: 7324802379
                </a>
                <Link
                  href="#services"
                  className="bg-blue-500 text-white hover:bg-blue-600 font-bold py-3 px-6 rounded-md transition duration-300 text-center"
                >
                  View Services
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div id="services" className="py-16 px-4 md:px-8 bg-gradient-to-r from-blue-900 to-blue-700">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center mb-12 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Our AC Services in Varanasi
        </motion.h2>

        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 h-full flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="relative h-60 w-full">
                <Image
                  src={service.imageUrl}
                  alt={service.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="transition-transform duration-300 hover:scale-110"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-blue-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-6 flex-grow">{service.description}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link
                    href={`/acrepair/${service.id}`}
                    className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    View Details
                  </Link>
                  <button
                    onClick={() => window.open(`https://wa.me/7324802379?text=${encodeURIComponent(`Book Service: ${service.title}`)}`, '_blank')}
                    className="mt-auto w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    Book Now
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Common AC Issues Section */}
      <div className="py-16 px-4 md:px-8 bg-gray-100">
        <div className="container mx-auto">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-12 text-blue-900"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Common AC Issues We Repair
          </motion.h2>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {commonIssues.map((issue, index) => (
              <motion.div
                key={index}
                className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-600 hover:shadow-lg transition-shadow duration-300"
                whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 8px 10px -6px rgba(59, 130, 246, 0.1)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-700 font-medium">{issue}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <a
              href="tel:7324802379"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-colors duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Call Now for Expert AC Repair: 7324802379
            </a>
          </motion.div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="py-12 px-4 md:px-8 bg-blue-900 text-white text-center">
        <div className="container mx-auto">
          <motion.h2
            className="text-2xl md:text-3xl font-bold mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Trust Dizit Solutions for All Your AC Repair Needs in Varanasi
          </motion.h2>
          <motion.p
            className="text-lg mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Our team of certified technicians is ready to provide you with prompt, reliable, and affordable AC repair services. We guarantee 100% customer satisfaction!
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <a
              href="tel:7324802379"
              className="bg-white text-blue-900 hover:bg-yellow-400 font-bold py-3 px-6 rounded-md transition duration-300 text-center flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Call: 7324802379
            </a>
            <Link
              href="/"
              className="bg-yellow-400 text-blue-900 hover:bg-yellow-500 font-bold py-3 px-6 rounded-md transition duration-300 text-center"
            >
              Back to Home
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  );
}