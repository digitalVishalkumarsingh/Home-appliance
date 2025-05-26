"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";


const Footer = () => {

  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Mobile Footer */}
        <div className="md:hidden">
          {/* Logo and Book Now */}
          <div className="flex flex-col items-center mb-6">
            <Image
              src="/Dizit-Solution.webp"
              alt="Dizit Solution Logo"
              className="w-32 h-auto mb-4"
              width={128}
              height={32}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="bg-blue-600 text-white py-2 px-6 rounded-full mt-2 hover:bg-orange-600 transition duration-300 w-full max-w-xs text-center"
              onClick={() => window.location.href = "tel:7324802379"}
            >
              Book Now @ 7324802379 (24/7)
            </motion.button>
          </div>

          {/* Accordion Sections */}
          <div className="space-y-4">
            {/* Company Section */}
            <div className="border-b border-gray-700 pb-4">
              <details className="group">
                <summary className="flex justify-between items-center cursor-pointer list-none">
                  <h3 className="text-lg font-semibold">Company</h3>
                  <span className="transition group-open:rotate-180">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </span>
                </summary>
                <ul className="mt-3 space-y-2 pl-2">
                  <li><Link href="/" className="block py-1 hover:text-yellow-500">Home</Link></li>
                  <li><Link href="/about" className="block py-1 hover:text-yellow-500">Company</Link></li>
                  <li><Link href="/services" className="block py-1 hover:text-yellow-500">Services</Link></li>
                  <li><Link href="/cases" className="block py-1 hover:text-yellow-500">Cases</Link></li>
                  <li><Link href="/news" className="block py-1 hover:text-yellow-500">News</Link></li>
                </ul>
              </details>
            </div>

            {/* Services Section */}
            <div className="border-b border-gray-700 pb-4">
              <details className="group">
                <summary className="flex justify-between items-center cursor-pointer list-none">
                  <h3 className="text-lg font-semibold">Services</h3>
                  <span className="transition group-open:rotate-180">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </span>
                </summary>
                <ul className="mt-3 space-y-2 pl-2">
                  <li><Link href="/acrepair" className="block py-1 hover:text-yellow-500">AC Services</Link></li>
                  <li><Link href="/washing-machine-services" className="block py-1 hover:text-yellow-500">Washing Machine Services</Link></li>
                  <li><Link href="/refrigerator-services" className="block py-1 hover:text-yellow-500">Refrigerator Services</Link></li>
                  <li><Link href="/ro-purifier-services" className="block py-1 hover:text-yellow-500">RO Purifier Services</Link></li>
                  <li><Link href="/geyser-services" className="block py-1 hover:text-yellow-500">Geyser Services</Link></li>
                </ul>
              </details>
            </div>

            {/* Contact Section */}
            <div className="border-b border-gray-700 pb-4">
              <details className="group">
                <summary className="flex justify-between items-center cursor-pointer list-none">
                  <h3 className="text-lg font-semibold">Contact Us</h3>
                  <span className="transition group-open:rotate-180">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </span>
                </summary>
                <div className="mt-3 space-y-2 pl-2">
                  <p className="py-1"><strong>Phone:</strong> 07324802379</p>
                  <p className="py-1">
                    <strong>Email:</strong>{" "}
                    <Link href="mailto:dizitsolution@gmail.com" className="hover:text-yellow-500">
                      dizitsolution@gmail.com
                    </Link>
                  </p>
                  <p className="py-1"><strong>Address:</strong> Near Sunbeam School, Lahartara, Varanasi – 221002</p>
                </div>
              </details>
            </div>

            {/* Social Media Section */}
            <div className="pb-4">
              <h3 className="text-lg font-semibold mb-3">Follow Us</h3>
              <div className="grid grid-cols-2 gap-2">
                <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="py-2 px-3 bg-gray-700 rounded text-center hover:bg-gray-600 hover:text-yellow-500">
                  Facebook
                </Link>
                <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="py-2 px-3 bg-gray-700 rounded text-center hover:bg-gray-600 hover:text-yellow-500">
                  Twitter
                </Link>
                <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="py-2 px-3 bg-gray-700 rounded text-center hover:bg-gray-600 hover:text-yellow-500">
                  Instagram
                </Link>
                <Link href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="py-2 px-3 bg-gray-700 rounded text-center hover:bg-gray-600 hover:text-yellow-500">
                  LinkedIn
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Footer */}
        <div className="hidden md:grid md:grid-cols-3 md:gap-8">
          {/* Company Information */}
          <div>
            <Image
              src="/Dizit-Solution.webp"
              alt="Dizit Solution Logo"
              className="w-32 h-auto mb-4"
              width={128}
              height={32}
            />
            <h3 className="text-xl font-semibold mb-4">Company</h3>
            <ul>
              <li>
                <Link href="/" className="hover:text-yellow-500">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-yellow-500">
                  Company
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-yellow-500">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/cases" className="hover:text-yellow-500">
                  Cases
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-yellow-500">
                  News
                </Link>
              </li>
            </ul>
          </div>

          {/* Services Offered */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Services</h3>
            <ul>
              <li>
                <Link href="/acrepair" className="hover:text-yellow-500">
                  AC Services
                </Link>
              </li>
              <li>
                <Link href="/washing-machine-services" className="hover:text-yellow-500">
                  Washing Machine Services
                </Link>
              </li>
              <li>
                <Link href="/refrigerator-services" className="hover:text-yellow-500">
                  Refrigerator Services
                </Link>
              </li>
              <li>
                <Link href="/ro-purifier-services" className="hover:text-yellow-500">
                  RO Purifier Services
                </Link>
              </li>
              <li>
                <Link href="/geyser-services" className="hover:text-yellow-500">
                  Geyser Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social Media */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
            <p className="mb-2">
              <strong>Phone No.</strong>: 07324802379 (24/7 Service)
            </p>
            <p className="mb-2">
              <strong>Email</strong>:{" "}
              <Link href="mailto:dizitsolution@gmail.com" className="hover:text-yellow-500">
                dizitsolution@gmail.com
              </Link>
            </p>
            <p className="mb-4">
              <strong>Address</strong>: Near Sunbeam School, Lahartara, Varanasi – 221002
            </p>

            <h3 className="text-xl font-semibold mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500">
                Facebook
              </Link>
              <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500">
                Twitter
              </Link>
              <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500">
                Instagram
              </Link>
              <Link href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500">
                LinkedIn
              </Link>
            </div>

            {/* Call-to-Action */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              className="bg-blue-600 text-white py-3 px-6 rounded-full mt-4 hover:bg-orange-600 transition duration-300"
              onClick={() => window.location.href = "tel:7324802379"}
            >
              Book Now @ 7324802379
            </motion.button>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-6 border-t border-gray-600 pt-6 text-center">
          <p className="text-sm text-gray-400">
            Copyright © 2025 Dizit Solution. All Rights Reserved.
          </p>
          <div className="flex justify-center space-x-8 mt-3">
            <Link href="/privacy-policy" className="hover:text-yellow-500">
              Privacy Policy
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-yellow-500">
              Terms and Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;