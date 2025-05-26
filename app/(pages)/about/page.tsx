'use client';
import { motion } from 'framer-motion';

interface Service {
  title: string;
  desc: string;
}

const About = () => {
  return (
    <div className="bg-blue-100 py-12 px-6 md:px-20 mt-0">
      <div className="max-w-7xl mx-auto text-center">
        {/* Page Heading */}
        <motion.h2
          className="text-4xl font-bold text-orange-600 mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          About Us
        </motion.h2>

        {/* Subheading */}
        <motion.h3
          className="text-2xl font-semibold text-blue-800 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
        >
          Home Appliances Repair in Varanasi
        </motion.h3>

        {/* Description */}
        <motion.p
          className="text-lg text-gray-600 mb-8 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.5 }}
        >
          Welcome to <span className="text-orange-600 font-bold">Dizit Solution</span> – Your Trusted Partner for <span className="text-blue-800 font-bold">Home Appliance Repair in Varanasi</span>! At Dizit Solution, we understand the importance of having your home appliances in top-notch condition. Whether it’s your <span className="text-blue-800 font-bold">air conditioner</span> or <span className="text-blue-800 font-bold">washing machine</span>, our dedicated team is here to provide reliable and efficient repair services in Varanasi and the surrounding areas.
        </motion.p>

        <motion.p
          className="text-lg text-gray-600 mb-8 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.7 }}
        >
          Dizit Solution recognizes the significance of having <span className="text-blue-800 font-bold">functional home appliances</span>. A faulty appliance can cause inconvenience and unforeseen costs. Therefore, we are dedicated to delivering dependable, effective, and reasonably priced repair solutions for all your household appliances.
        </motion.p>

        {/* Service Highlights */}
        <motion.div
          className="flex flex-wrap justify-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.9 }}
        >
          {[
            { title: "AC Repair", desc: "Expert AC repair services available 24/7 for all types of air conditioners." },
            { title: "Refrigerator Repair", desc: "24/7 refrigerator repair solutions to keep your food fresh." },
            { title: "Washing Machine Repair", desc: "Round-the-clock washing machine repair services for all brands." },
          ].map((service: Service, index: number) => (
            <div
              key={index}
              className="w-full sm:w-1/2 md:w-1/3 p-5 bg-white rounded-lg shadow-md m-4 border border-orange-200"
            >
              <h4 className="text-lg font-bold text-orange-600 mb-2">{service.title}</h4>
              <p className="text-gray-600">{service.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Commitment to Quality */}
        <motion.p
          className="text-lg text-gray-600 mb-8 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.1 }}
        >
          At Dizit Solution, we believe in providing our customers with the highest level of service. Our technicians are certified and experienced, and we use only <span className="text-orange-600 font-bold">genuine parts</span> for all our repairs. We also offer <span className="text-orange-600 font-bold">competitive pricing</span> and provide a 100% satisfaction guarantee on all our services.
        </motion.p>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 1.5 }}
        >
          <p className="text-xl font-semibold text-blue-800 mb-4">
            Contact us today to schedule your <span className="text-orange-600 font-bold">AC Repair in Varanasi</span>, <span className="text-blue-800 font-bold">Refrigerator Repair</span>, or any other home appliance repair service. We are available 24/7 to provide you with prompt and reliable service.
          </p>
          <button
            className="text-lg bg-orange-600 px-6 py-3 rounded-lg text-white hover:bg-orange-700 transition-transform transform hover:scale-105"
            onClick={() => window.location.href = 'tel:7324802379'}
          >
            Book Now @ <span className="font-bold">7324802379</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default About;