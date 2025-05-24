import { ObjectId } from "mongodb";

// Define the Technician interface
export interface Technician {
  _id?: ObjectId | string;
  name: string;
  email: string;
  phone: string;
  userId?: ObjectId | string; // Reference to the user account for authentication
  specializations: string[];  // Array of service types they can handle
  status: "active" | "inactive" | "online" | "offline" | "busy";
  isAvailable?: boolean; // Flag to indicate if technician is available for new jobs
  location?: {
    address: string;
    coordinates?: [number, number]; // [longitude, latitude]
    serviceRadius?: number; // in kilometers
  };
  availability?: {
    monday?: { available: boolean; hours?: string };
    tuesday?: { available: boolean; hours?: string };
    wednesday?: { available: boolean; hours?: string };
    thursday?: { available: boolean; hours?: string };
    friday?: { available: boolean; hours?: string };
    saturday?: { available: boolean; hours?: string };
    sunday?: { available: boolean; hours?: string };
  };
  skills?: string[];
  rating?: number;
  completedBookings?: number;
  profileImage?: string;
  address?: string; // Legacy field, use location.address instead
  governmentId?: string;
  certifications?: string[];
  notes?: string;
  earnings?: {
    total: number;
    pending: number;
    lastPayout?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  lastActive?: Date;
  accountCreated?: boolean; // Flag to track if user account has been created
}

// Default availability template
export const defaultAvailability = {
  monday: { available: true, hours: "9:00 AM - 6:00 PM" },
  tuesday: { available: true, hours: "9:00 AM - 6:00 PM" },
  wednesday: { available: true, hours: "9:00 AM - 6:00 PM" },
  thursday: { available: true, hours: "9:00 AM - 6:00 PM" },
  friday: { available: true, hours: "9:00 AM - 6:00 PM" },
  saturday: { available: true, hours: "9:00 AM - 6:00 PM" },
  sunday: { available: false, hours: "" },
};

// Create a new technician object with default values
export function createTechnician(data: Partial<Technician>): Technician {
  return {
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    specializations: data.specializations || [],
    status: data.status || "inactive",
    isAvailable: data.isAvailable !== undefined ? data.isAvailable : true, // Default to available
    location: data.location || {
      address: data.address || "",
      coordinates: [0, 0],
      serviceRadius: 10
    },
    availability: data.availability || { ...defaultAvailability },
    skills: data.skills || [],
    rating: data.rating || 0,
    completedBookings: data.completedBookings || 0,
    profileImage: data.profileImage || "",
    address: data.address || "",
    governmentId: data.governmentId || "",
    certifications: data.certifications || [],
    notes: data.notes || "",
    earnings: data.earnings || {
      total: 0,
      pending: 0
    },
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    lastActive: data.lastActive || new Date(),
  };
}
