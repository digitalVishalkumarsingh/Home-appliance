import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verify } from "jsonwebtoken";
import BookingDetailsClient from "./BookingDetailsClient";

interface Booking {
  id: string;
  bookingId: string;
  service: string;
  scheduledDate: string;
  amount: number;
  notes?: string;
  customerName: string;
  customerPhone: string;
  address: string;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  paymentStatus: "paid" | "pending";
  paymentMethod?: string;
  location: {
    coordinates?: { lat: number; lng: number };
  };
  earnings: {
    technicianEarnings: number;
    adminCommissionPercentage: number;
  };
}

interface BookingResponse {
  success: boolean;
  booking: Booking;
  message?: string;
}

interface CommissionResponse {
  success: boolean;
  commissionRate: number;
}

async function fetchBooking(id: string, token: string): Promise<Booking> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
  const response = await fetch(`${apiUrl}/technicians/bookings/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch booking: ${response.status}`);
  }

  const data: BookingResponse = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch booking");
  }

  return data.booking;
}

async function fetchCommissionRate(): Promise<number> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
  const response = await fetch(`${apiUrl}/admin/settings/commission`, {
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("Failed to fetch commission rate:", response.status);
    return 30; // Fallback to 30%
  }

  const data: CommissionResponse = await response.json();
  return data.success ? data.commissionRate : 30;
}

interface Props {
  id: string;
  initialBooking: Booking;
  initialCommissionRate: number;
  token: string;
}

export default async function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

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

  let booking: Booking | null = null;
  let commissionRate: number = 30;

  try {
    const secret = process.env.JWT_SECRET || "your-secret-key";
    verify(token, secret, { algorithms: ["HS256"] });
    booking = await fetchBooking(id, token);
    commissionRate = await fetchCommissionRate();
  } catch (error) {
    console.error("Error fetching booking:", error);
    redirect("/technician/bookings");
  }

  if (!booking) {
    redirect("/technician/bookings");
  }

  return (
    <BookingDetailsClient
      initialBookings={[booking]}
      initialCommissionRate={commissionRate}
      token={token}
    />
  );
}