"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { getCallNumber, getPhoneNumber } from "@/app/utils/contactInfo";

interface FormData {
  name: string;
  phone: string;
  service: string;
  description: string;
}

interface FormErrors {
  name: string;
  phone: string;
  service: string;
}

function Page() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    service: "",
    description: "",
  });

  const [errors, setErrors] = useState<FormErrors>({ name: "", phone: "", service: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        setIsLoggedIn(true);
        setUserData(parsedUser);
        // Pre-fill form with user data
        setFormData(prev => ({
          ...prev,
          name: parsedUser.name || "",
          phone: parsedUser.phone || "",
        }));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = { name: "", phone: "", service: "" };
    let valid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    }

    if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit phone number";
      valid = false;
    }

    if (!formData.service.trim()) {
      newErrors.service = "Please select a service";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      // Ask user to login first
      Swal.fire({
        title: "Login Required",
        text: "Please login to book a service",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Login",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          // Save form data to session storage to restore after login
          sessionStorage.setItem("pendingBooking", JSON.stringify(formData));
          router.push("/login");
        }
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get user ID from token if available
      let userId = null;
      const user = localStorage.getItem("user");
      if (user) {
        try {
          const userData = JSON.parse(user);
          userId = userData._id || userData.userId;
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }

      // Add user ID to form data if available
      const bookingData = {
        ...formData,
        userId: userId,
      };

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();
      setIsLoading(false);

      if (response.ok && result.success) {
        Swal.fire({
          title: "Success!",
          text: "Booking request sent successfully!",
          icon: "success",
          confirmButtonText: "View My Bookings",
          showCancelButton: true,
          cancelButtonText: "Close",
        }).then((result) => {
          if (result.isConfirmed) {
            router.push("/profile/orders");
          } else {
            // Reset form only if not navigating away
            setFormData({ name: "", phone: "", service: "", description: "" });
          }
        });
      } else {
        Swal.fire({
          title: "Error!",
          text: result.error || "Something went wrong. Try again.",
          icon: "error",
          confirmButtonText: "Retry",
        });
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error submitting booking:", error);
      Swal.fire({
        title: "Error!",
        text: "Network error. Try again.",
        icon: "error",
        confirmButtonText: "Retry",
      });
    }
  };

  return (
    <div className="bg-gray-100 py-12 px-6 md:px-20 mt-16">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center">
        <div className="w-full md:w-1/2 p-6 bg-gray-100 rounded-lg shadow-lg">
          <motion.h2
            className="text-3xl font-bold text-orange-600 mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            Contacts
            <br />
            <span className="text-xl text-gray-600">How to Find Us</span>
          </motion.h2>
          <motion.p
            className="text-lg text-gray-700 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.3 }}
          >
            If you have any questions or need assistance, feel free to contact us. We’re happy to help!
          </motion.p>
          <motion.p
            className="text-lg text-gray-700 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.5 }}
          >
            Contact us at <span className="font-bold text-blue-600">{getPhoneNumber()}</span> or{" "}
            <span className="font-bold text-blue-600">dizitsolution@gmail.com</span>.
          </motion.p>
          <motion.p
            className="text-lg text-gray-700 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.7 }}
          >
            Our office is located near Sunbeam School, Lahartara, Varanasi – 221002.
          </motion.p>
        </div>

        <div className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow-lg mt-8 md:mt-0">
          <h3 className="text-xl font-semibold text-center mb-6">Book a Technician</h3>
          <motion.form
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.7 }}
            onSubmit={handleSubmit}
          >
            <div>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
              {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
            </div>
            <div>
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
              {errors.phone && <p className="text-red-600 text-sm">{errors.phone}</p>}
            </div>
            <div>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">- Select Service -</option>
                <option value="ac">AC Repair</option>
                <option value="washing_machine">Washing Machine Repair</option>
                <option value="fridge">Refrigerator Repair</option>
              </select>
              {errors.service && <p className="text-red-600 text-sm">{errors.service}</p>}
            </div>
            <div>
              <textarea
                name="description"
                placeholder="Describe Your Problem (Optional)"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <motion.button
                type="submit"
                className="w-full bg-orange-600 text-white p-2 rounded font-semibold hover:bg-orange-700 transition duration-200"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Book Technician"}
              </motion.button>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}

export default Page;