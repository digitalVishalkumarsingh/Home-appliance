"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCalendarPlus, FaTimes, FaPhone } from "react-icons/fa";
import Link from "next/link";

const PHONE_NUMBER: string = process.env.NEXT_PUBLIC_PHONE || "9112564731";

export default function QuickBookingButton() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.button
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
          isOpen ? "bg-red-500" : "bg-blue-600"
        } text-white`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleOpen}
        aria-label={isOpen ? "Close booking options" : "Open booking options"}
      >
        {isOpen ? <FaTimes size={24} /> : <FaCalendarPlus size={24} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-16 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-64"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Quick Booking
            </h3>
            
            <div className="space-y-3">
              <Link
                href="/booking-instructions"
                className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-center transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Book Online
              </Link>
              
              <a
                href={`tel:${PHONE_NUMBER}`}
                className="flex items-center justify-center w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md text-center transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <FaPhone className="mr-2" />
                Call {PHONE_NUMBER}
              </a>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                24/7 service available
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
