"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { FaBell, FaCheck, FaTimes, FaMapMarkerAlt, FaRupeeSign } from "react-icons/fa";

interface JobOffer {
  id: string;
  bookingId: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  address: string;
  amount: number;
  distance: number;
  urgency: "low" | "normal" | "high";
  scheduledDate: string;
  scheduledTime: string;
  description: string;
  customerLocation?: {
    lat: number;
    lng: number;
  };
}

export default function JobNotificationRinger() {
  const [currentJob, setCurrentJob] = useState<JobOffer | null>(null);
  const [isRinging, setIsRinging] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds to respond
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get user info
  const getUser = () => {
    if (typeof window !== "undefined") {
      try {
        const userStr = localStorage.getItem("user");
        return userStr ? JSON.parse(userStr) : null;
      } catch {
        return null;
      }
    }
    return null;
  };

  // Check if technician is on duty
  const isOnDuty = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dutyStatus") === "true";
    }
    return false;
  };

  // Get authentication token
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  // Fetch real job offers from database
  const fetchJobOffers = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/technicians/jobs/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data.success && data.pendingJob) {
        // Get the pending job offer
        const jobOffer = data.pendingJob;
        const formattedJob: JobOffer = {
          id: jobOffer.id,
          bookingId: jobOffer.bookingId,
          serviceName: jobOffer.appliance || "Service Request",
          customerName: jobOffer.customer?.name || "Customer",
          customerPhone: jobOffer.customer?.phone || "",
          address: jobOffer.location?.address || "Customer Address",
          amount: jobOffer.earnings?.total || 0,
          distance: jobOffer.location?.distance || 0,
          urgency: jobOffer.urgency || "normal",
          scheduledDate: new Date().toISOString().split('T')[0],
          scheduledTime: "ASAP",
          description: jobOffer.description || `${jobOffer.appliance} service requested`,
          customerLocation: jobOffer.location?.coordinates || null
        };

        // Only show notification if not already ringing
        if (!isRinging) {
          startRinging(formattedJob);
        }
      }
    } catch (error) {
      console.error('Error fetching job offers:', error);
    }
  };

  // Create notification sound
  const createNotificationSound = () => {
    if (typeof window !== "undefined" && !audioRef.current) {
      // Create audio context for notification sound
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        const createBeep = (frequency: number, duration: number) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = frequency;
          oscillator.type = 'sine';

          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + duration);
        };

        // Create ringing pattern
        const playRingTone = () => {
          createBeep(800, 0.2);
          setTimeout(() => createBeep(600, 0.2), 300);
          setTimeout(() => createBeep(800, 0.2), 600);
        };

        return playRingTone;
      } catch (error) {
        console.error("Audio context not supported:", error);
        return null;
      }
    }
    return null;
  };

  // Start ringing for new job
  const startRinging = (job: JobOffer) => {
    if (!isOnDuty()) {
      console.log("Technician is off duty, not showing job notification");
      return;
    }

    setCurrentJob(job);
    setIsRinging(true);
    setTimeLeft(30);

    // Play notification sound
    const playSound = createNotificationSound();
    if (playSound) {
      playSound();
      // Repeat sound every 3 seconds
      const soundInterval = setInterval(() => {
        if (isRinging) {
          playSound();
        } else {
          clearInterval(soundInterval);
        }
      }, 3000);
    }

    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-decline when time runs out
          handleDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Show toast notification
    toast.success(`🔔 New Job Available! ${job.serviceName}`, {
      duration: 5000,
    });
  };

  // Accept job
  const handleAccept = () => {
    if (!currentJob) return;

    setIsRinging(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    toast.success(`✅ Job Accepted! Booking ID: ${currentJob.bookingId}`);

    console.log("Job accepted:", currentJob);

    // In a real system, this would:
    // 1. Update job status in database
    // 2. Notify customer
    // 3. Add to technician's active jobs

    setCurrentJob(null);
  };

  // Decline job
  const handleDecline = () => {
    if (!currentJob) return;

    setIsRinging(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    toast.error(`❌ Job Declined: ${currentJob.bookingId}`);

    console.log("Job declined:", currentJob);

    // In a real system, this would:
    // 1. Offer job to next available technician
    // 2. Update job status

    setCurrentJob(null);
  };

  // Simulate receiving a new job (for testing)
  const simulateNewJob = () => {
    const testJob: JobOffer = {
      id: `job-${Date.now()}`,
      bookingId: `BK${Date.now()}`,
      serviceName: "AC Repair",
      customerName: "John Doe",
      customerPhone: "+91 9876543210",
      address: "123 Main Street, City Center",
      amount: 2500,
      distance: 2.5,
      urgency: "normal",
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: "14:00",
      description: "Air conditioner not cooling properly"
    };

    startRinging(testJob);
  };

  // Check for new jobs periodically
  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "technician") return;

    // Check for real job offers every 5 seconds
    const checkInterval = setInterval(() => {
      if (isOnDuty() && !isRinging) {
        fetchJobOffers();
      }
    }, 5000);

    return () => clearInterval(checkInterval);
  }, [isRinging]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Don't show for non-technicians
  const user = getUser();
  if (!user || user.role !== "technician") {
    return null;
  }

  return (
    <div>
      {/* Test button for demo */}
      <button
        onClick={simulateNewJob}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        🔔 Simulate New Job
      </button>

      {/* Job notification modal */}
      {isRinging && currentJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 animate-pulse">
            <div className="text-center mb-4">
              <FaBell className="text-4xl text-orange-500 mx-auto mb-2 animate-bounce" />
              <h2 className="text-xl font-bold text-gray-900">New Job Available!</h2>
              <div className="text-lg font-semibold text-red-600">
                Time Left: {timeLeft}s
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="bg-blue-50 p-3 rounded">
                <h3 className="font-semibold text-blue-900">{currentJob.serviceName}</h3>
                <p className="text-sm text-blue-700">Booking ID: {currentJob.bookingId}</p>
              </div>

              <div className="flex items-center justify-between text-gray-700">
                <div className="flex items-center">
                  <FaMapMarkerAlt className="text-red-500 mr-2" />
                  <span className="text-sm">{currentJob.address}</span>
                </div>
                {currentJob.customerLocation && (
                  <button
                    onClick={() => {
                      const { lat, lng } = currentJob.customerLocation!;
                      const url = `https://www.google.com/maps?q=${lat},${lng}`;
                      window.open(url, '_blank');
                    }}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                  >
                    View on Map
                  </button>
                )}
              </div>

              <div className="flex items-center text-gray-700">
                <FaRupeeSign className="text-green-500 mr-2" />
                <span className="font-semibold">₹{currentJob.amount}</span>
                <span className="text-sm text-gray-500 ml-2">({currentJob.distance} km away)</span>
              </div>

              <div className="text-sm text-gray-600">
                <strong>Customer:</strong> {currentJob.customerName}
              </div>

              <div className="text-sm text-gray-600">
                <strong>Scheduled:</strong> {currentJob.scheduledDate} at {currentJob.scheduledTime}
              </div>

              <div className="text-sm text-gray-600">
                <strong>Description:</strong> {currentJob.description}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleAccept}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center"
              >
                <FaCheck className="mr-2" />
                Accept Job
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center"
              >
                <FaTimes className="mr-2" />
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
