import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verify } from "jsonwebtoken";
import TechnicianBookingsClient from "./TechnicianBookingsClient";

interface Booking {
  _id: string;
  bookingId: string;
  service: string;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  customerName: string;
  customerPhone: string;
  address: string;
  amount: number;
  scheduledDate?: string;
  createdAt: string;
  notes?: string;
  urgency?: "normal" | "high" | "emergency";
}

interface BookingResponse {
  success: boolean;
  jobHistory?: Booking[];
  bookings?: Booking[];
  message?: string;
}

async function fetchBookings(token: string): Promise<Booking[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
  let response = await fetch(`${apiUrl}/technicians/jobs/history`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.log("Falling back to /api/bookings...");
    response = await fetch(`${apiUrl}/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch bookings: ${response.status}`);
  }

  const data: BookingResponse = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch bookings");
  }

  const bookingsData = data.jobHistory || data.bookings || [];
  return bookingsData.map((booking: any) => ({
    _id: booking._id || booking.id || `booking-${Math.random().toString(36).slice(2, 11)}`,
    bookingId: booking.bookingId || booking._id || booking.id || "Unknown",
    service: booking.service || booking.appliance || "Appliance Repair",
    status: booking.status || "pending",
    customerName: booking.customerName || booking.customer?.name || "Customer",
    customerPhone: booking.customerPhone || booking.customer?.phone || "",
    address: booking.address || booking.location?.address || "Customer Address",
    amount: booking.amount || booking.earnings?.total || 0,
    scheduledDate: booking.scheduledDate || booking.appointmentDate,
    createdAt: booking.createdAt || new Date().toISOString(),
    notes: booking.notes || booking.description,
    urgency: booking.urgency || "normal",
  }));
}

export default async function TechnicianBookingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const userStr = cookieStore.get("user")?.value;

  if (!token || !userStr) {
    redirect("/login");
  }

  let user;
  try {
    user = JSON.parse(userStr);
    if (user.role !== "technician") {
      redirect("/login");
    }
  } catch (error) {
    console.error("Error parsing user data:", error);
    redirect("/login");
  }

  let bookings: Booking[] = [];
  try {
    const secret = process.env.JWT_SECRET || "your-secret-key";
    verify(token, secret, { algorithms: ["HS256"] });
    bookings = await fetchBookings(token);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    redirect("/login");
  }

  return (
    <TechnicianBookingsClient
      initialBookings={bookings}
      token={token}
    />
  );
}