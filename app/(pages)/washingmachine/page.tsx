'use client';
import Image from "next/image";
import { motion } from 'framer-motion';
import Link from "next/link";
import { getCallNumber, getWhatsAppLink } from '@/app/utils/contactInfo';

// Washing Machine Service Data
interface Service {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price?: string;
}

const services: Service[] = [
  { id: 'washing-machine-repair', title: 'Washing Machine Repair', description: 'Expert repair services for all types and brands of washing machines. We fix common issues like leaking, not spinning, or not draining.', imageUrl: '/washingmachine.jpg', price: '₹499 onwards' },
  { id: 'washing-machine-installation', title: 'Washing Machine Installation', description: 'Professional installation services for all types of washing machines, ensuring proper setup and optimal performance.', imageUrl: '/washingpage.webp', price: '₹499 onwards' },
  { id: 'washing-machine-service', title: 'Washing Machine Service', description: 'Regular maintenance and servicing to keep your washing machine running efficiently and extend its lifespan.', imageUrl: '/whashingmachine.jpg', price: '₹449 onwards' },
  { id: 'washing-machine-drain-cleaning', title: 'Washing Machine Drain Cleaning', description: 'Specialized service to clean and unclog washing machine drains, preventing water backup and drainage issues.', imageUrl: '/whashingmaintaince.jpg', price: '₹299 onwards' },
  { id: 'washing-machine-parts-replacement', title: 'Washing Machine Parts Replacement', description: 'Replacement of faulty washing machine parts with genuine spares to restore optimal functionality.', imageUrl: '/installationwashingmachine.jpg', price: '₹599 onwards' },
];

const commonIssues: string[] = [
  "Machine not turning on", "Leaking water", "Not spinning or agitating", "Excessive noise or vibration",
  "Not draining properly", "Door or lid not locking", "Unpleasant odors", "Not completing cycles",
  "Error codes on display", "Clothes not getting clean", "Water not filling", "Drum not rotating"
];

export default function WashingMachineServices() {
  return (
    <>
      {/* Hero Section */}
      <div className="relative">
        {/* Background Image with Overlay */}
        <div className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-blue-700/50 z-10"></div>
          <Image
            src="/washingpage.webp"
            alt="Washing Machine Repair Service"
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
                Washing Machine Repair & Services in Varanasi
              </motion.h1>

              <motion.p
                className="text-lg text-white/90 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                We offer professional washing machine repair, servicing, and installation services in Varanasi at competitive prices. Our skilled technicians will arrive at your location at your preferred time.
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
                  href={`tel:${getCallNumber()}`}
                  className="bg-white text-blue-900 hover:bg-yellow-400 font-bold py-3 px-6 rounded-md transition duration-300 text-center flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  Call Now: {getCallNumber()}
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
          Our Washing Machine Services in Varanasi
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
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-blue-900">{service.title}</h3>
                  {service.price && (
                    <span className="text-green-600 font-semibold text-lg">{service.price}</span>
                  )}
                </div>
                <p className="text-gray-600 mb-6 flex-grow">{service.description}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link
                    href={`/washingmachine/${service.id}`}
                    className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-300 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    View Details
                  </Link>
                  <button
                    onClick={() => window.open(getWhatsAppLink(`Book Service: ${service.title}`), '_blank')}
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

      {/* Common Issues Section */}
      <div className="py-16 px-4 md:px-8 bg-gray-100">
        <div className="container mx-auto">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-12 text-blue-900"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Common Washing Machine Issues We Repair
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
              href={`tel:${getCallNumber()}`}
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-colors duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Call Now for Expert Washing Machine Repair: {getCallNumber()}
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
            Trust Dizit Solutions for All Your Washing Machine Repair Needs in Varanasi
          </motion.h2>
          <motion.p
            className="text-lg mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Our team of certified technicians is ready to provide you with prompt, reliable, and affordable washing machine repair services. We guarantee 100% customer satisfaction!
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <a
              href={`tel:${getCallNumber()}`}
              className="bg-white text-blue-900 hover:bg-yellow-400 font-bold py-3 px-6 rounded-md transition duration-300 text-center flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Call: {getCallNumber()}
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
