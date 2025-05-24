// import { NextResponse, NextRequest } from "next/server";
// import { connectToDatabase } from "@/app/lib/mongodb";
// import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
// import { ObjectId } from "mongodb";

// // Get technician earnings data
// export async function GET(request: Request) {
//   try {
//     // Verify technician authentication
//     const token = getTokenFromRequest(request);

//     if (!token) {
//       return NextResponse.json(
//         { success: false, message: "Authentication required" },
//         { status: 401 }
//       );
//     }

//     const decoded = verifyToken(token);

//     if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
//       return NextResponse.json(
//         { success: false, message: "Invalid token" },
//         { status: 401 }
//       );
//     }

//     const userId = (decoded as { userId: string }).userId;

//     // Connect to MongoDB
//     const { db } = await connectToDatabase();

//     // Find technician
//     const technician = await db.collection("technicians").findOne({
//       $or: [
//         { _id: ObjectId.isValid(userId) ? new ObjectId(userId) : userId },
//         { userId: userId }
//       ]
//     });

//     if (!technician) {
//       return NextResponse.json(
//         { success: false, message: "Technician not found" },
//         { status: 404 }
//       );
//     }

//     // Get all completed bookings for this technician
//     const bookings = await db.collection("bookings").find({
//       technicianId: technician._id.toString(),
//       status: "completed"
//     }).toArray();

//     // Calculate earnings summary
//     let totalEarnings = 0;
//     let pendingEarnings = 0;
//     let paidEarnings = 0;
//     let lastPayoutDate = null;
//     let lastPayoutAmount = 0;

//     // Get all payouts for this technician
//     const payouts = await db.collection("payouts").find({
//       technicianId: technician._id.toString()
//     }).sort({ createdAt: -1 }).toArray();

//     if (payouts.length > 0) {
//       lastPayoutDate = payouts[0].createdAt;
//       lastPayoutAmount = payouts[0].amount;
//     }

//     // Get all earnings transactions
//     const transactions = [];

//     for (const booking of bookings) {
//       // Calculate technician earnings with admin commission
//       let technicianAmount = 0;

//       if (booking.earnings && booking.earnings.technicianEarnings) {
//         // Use pre-calculated earnings if available
//         technicianAmount = booking.earnings.technicianEarnings;
//       } else {
//         // Get the admin commission rate from settings
//         const settingsDoc = await db.collection("settings").findOne({ key: "commission" });
//         const adminCommissionPercentage = settingsDoc?.value || 30; // Default to 30% if not set

//         // Calculate earnings if not already calculated
//         const totalAmount = booking.amount || 0;
//         const adminCommission = Math.round((totalAmount * adminCommissionPercentage) / 100);
//         technicianAmount = totalAmount - adminCommission;
//       }

//       totalEarnings += technicianAmount;

//       // Check if this booking has been paid out
//       const payout = payouts.find(p =>
//         p.bookingIds && p.bookingIds.includes(booking._id.toString())
//       );

//       const transaction = {
//         _id: booking._id.toString(),
//         bookingId: booking.bookingId || booking.id || booking._id.toString(),
//         serviceType: booking.service,
//         customerName: booking.customerName,
//         amount: technicianAmount, // Use technician's earnings amount
//         status: payout ? "paid" : "pending",
//         serviceDate: booking.completedAt || booking.date || booking.createdAt,
//         location: booking.location || { address: `${booking.city}, ${booking.state}` }
//       };

//       if (payout) {
//         paidEarnings += technicianAmount;
//         transaction.payoutDate = payout.createdAt;
//         transaction.transactionId = payout._id.toString();
//       } else {
//         pendingEarnings += technicianAmount;
//       }

//       transactions.push(transaction);
//     }

//     // If there are no bookings but technician has earnings data
//     if (bookings.length === 0 && technician.earnings) {
//       totalEarnings = technician.earnings.total || 0;
//       pendingEarnings = technician.earnings.pending || 0;
//       paidEarnings = totalEarnings - pendingEarnings;
//     }

//     return NextResponse.json({
//       success: true,
//       summary: {
//         totalEarnings,
//         pendingEarnings,
//         paidEarnings,
//         lastPayoutDate,
//         lastPayoutAmount
//       },
//       transactions
//     });
//   } catch (error) {
//     console.error("Error fetching technician earnings:", error);
//     return NextResponse.json(
//       { success: false, message: "Failed to fetch earnings data" },
//       { status: 500 }
//     );
//   }
// }

// // Request payout
// export async function POST(request: Request) {
//   try {
//     // Verify technician authentication
//     const token = getTokenFromRequest(request);

//     if (!token) {
//       return NextResponse.json(
//         { success: false, message: "Authentication required" },
//         { status: 401 }
//       );
//     }

//     const decoded = verifyToken(token);

//     if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
//       return NextResponse.json(
//         { success: false, message: "Invalid token" },
//         { status: 401 }
//       );
//     }

//     const userId = (decoded as { userId: string }).userId;

//     // Get payout request data
//     const { paymentMethod, accountDetails } = await request.json();

//     if (!paymentMethod) {
//       return NextResponse.json(
//         { success: false, message: "Payment method is required" },
//         { status: 400 }
//       );
//     }

//     // Connect to MongoDB
//     const { db } = await connectToDatabase();

//     // Find technician
//     const technician = await db.collection("technicians").findOne({
//       $or: [
//         { _id: ObjectId.isValid(userId) ? new ObjectId(userId) : userId },
//         { userId: userId }
//       ]
//     });

//     if (!technician) {
//       return NextResponse.json(
//         { success: false, message: "Technician not found" },
//         { status: 404 }
//       );
//     }

//     // Check if technician has pending earnings
//     if (!technician.earnings || technician.earnings.pending <= 0) {
//       return NextResponse.json(
//         { success: false, message: "No pending earnings to withdraw" },
//         { status: 400 }
//       );
//     }

//     // Get all unpaid bookings for this technician
//     const unpaidBookings = await db.collection("bookings").find({
//       technicianId: technician._id.toString(),
//       status: "completed",
//       // No associated payout
//       payoutId: { $exists: false }
//     }).toArray();

//     if (unpaidBookings.length === 0) {
//       return NextResponse.json(
//         { success: false, message: "No unpaid bookings found" },
//         { status: 400 }
//       );
//     }

//     // Calculate total amount to be paid (technician's earnings after admin commission)
//     const totalAmount = unpaidBookings.reduce((sum, booking) => {
//       if (booking.earnings && booking.earnings.technicianEarnings) {
//         // Use pre-calculated earnings if available
//         return sum + booking.earnings.technicianEarnings;
//       } else {
//         // Get the admin commission rate from settings
//         const settingsDoc = await db.collection("settings").findOne({ key: "commission" });
//         const adminCommissionPercentage = settingsDoc?.value || 30; // Default to 30% if not set

//         // Calculate earnings if not already calculated
//         const bookingAmount = booking.finalAmount || booking.amount || 0;
//         const adminCommission = Math.round((bookingAmount * adminCommissionPercentage) / 100);
//         const technicianEarnings = bookingAmount - adminCommission;
//         return sum + technicianEarnings;
//       }
//     }, 0);

//     // Create payout request
//     const payoutRequest = {
//       technicianId: technician._id.toString(),
//       technicianName: technician.name,
//       amount: totalAmount,
//       bookingIds: unpaidBookings.map(booking => booking._id.toString()),
//       paymentMethod,
//       accountDetails,
//       status: "pending",
//       createdAt: new Date(),
//       updatedAt: new Date()
//     };

//     const result = await db.collection("payoutRequests").insertOne(payoutRequest);

//     // Update bookings with payout request ID
//     await db.collection("bookings").updateMany(
//       { _id: { $in: unpaidBookings.map(booking => booking._id) } },
//       { $set: { payoutRequestId: result.insertedId.toString() } }
//     );

//     // Create notification for admin
//     const notification = {
//       recipientType: "admin",
//       title: "New Payout Request",
//       message: `Technician ${technician.name} has requested a payout of ₹${totalAmount}`,
//       technicianId: technician._id.toString(),
//       payoutRequestId: result.insertedId.toString(),
//       status: "unread",
//       createdAt: new Date()
//     };

//     await db.collection("notifications").insertOne(notification);

//     return NextResponse.json({
//       success: true,
//       message: "Payout request submitted successfully",
//       payoutRequest: {
//         _id: result.insertedId,
//         ...payoutRequest
//       }
//     });
//   } catch (error) {
//     console.error("Error requesting payout:", error);
//     return NextResponse.json(
//       { success: false, message: "Failed to submit payout request" },
//       { status: 500 }
//     );
//   }
// }
import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get technician earnings data
export async function GET(request: Request) {
  try {
    // Verify technician authentication
    const token = getTokenFromRequest(new NextRequest(request));

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = (decoded as { userId: string }).userId;

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find technician
    const orFilters = ObjectId.isValid(userId)
      ? [{ _id: new ObjectId(userId) }, { userId: userId }]
      : [{ userId: userId }];
    const technician = await db.collection("technicians").findOne({
      $or: orFilters
    });

    if (!technician) {
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    // Get all completed bookings for this technician
    const bookings = await db.collection("bookings").find({
      technicianId: technician._id.toString(),
      status: "completed"
    }).toArray();

    // Get the admin commission rate from settings (fetch once)
    const settingsDoc = await db.collection("settings").findOne({ key: "commission" });
    const adminCommissionPercentage = settingsDoc?.value || 30; // Default to 30% if not set

    // Calculate earnings summary
    let totalEarnings = 0;
    let pendingEarnings = 0;
    let paidEarnings = 0;
    let lastPayoutDate = null;
    let lastPayoutAmount = 0;

    // Get all payouts for this technician
    const payouts = await db.collection("payouts").find({
      technicianId: technician._id.toString()
    }).sort({ createdAt: -1 }).toArray();

    if (payouts.length > 0) {
      lastPayoutDate = payouts[0].createdAt;
      lastPayoutAmount = payouts[0].amount;
    }

    // Get all earnings transactions
    const transactions = [];

    for (const booking of bookings) {
      // Calculate technician earnings with admin commission
      let technicianAmount = 0;

      if (booking.earnings && booking.earnings.technicianEarnings) {
        // Use pre-calculated earnings if available
        technicianAmount = booking.earnings.technicianEarnings;
      } else {
        // Calculate earnings if not already calculated
        const totalAmount = booking.amount || 0;
        const adminCommission = Math.round((totalAmount * adminCommissionPercentage) / 100);
        technicianAmount = totalAmount - adminCommission;
      }

      totalEarnings += technicianAmount;

      // Check if this booking has been paid out
      const payout = payouts.find(p =>
        p.bookingIds && p.bookingIds.includes(booking._id.toString())
      );

      const transaction: any = {
        _id: booking._id.toString(),
        bookingId: booking.bookingId || booking.id || booking._id.toString(),
        serviceType: booking.service,
        customerName: booking.customerName,
        amount: technicianAmount, // Use technician's earnings amount
        status: payout ? "paid" : "pending",
        serviceDate: booking.completedAt || booking.date || booking.createdAt,
        location: booking.location || { address: `${booking.city}, ${booking.state}` }
      };

      if (payout) {
        paidEarnings += technicianAmount;
        transaction.payoutDate = payout.createdAt;
        transaction.transactionId = payout._id.toString();
      } else {
        pendingEarnings += technicianAmount;
      }

      transactions.push(transaction);
    }

    // If there are no bookings but technician has earnings data
    if (bookings.length === 0 && technician.earnings) {
      totalEarnings = technician.earnings.total || 0;
      pendingEarnings = technician.earnings.pending || 0;
      paidEarnings = totalEarnings - pendingEarnings;
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalEarnings,
        pendingEarnings,
        paidEarnings,
        lastPayoutDate,
        lastPayoutAmount
      },
      transactions
    });
  } catch (error) {
    console.error("Error fetching technician earnings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch earnings data" },
      { status: 500 }
    );
  }
}

// Request payout
export async function POST(request: Request) {
  try {
    // Verify technician authentication
    const token = getTokenFromRequest(new NextRequest(request));

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = (decoded as { userId: string }).userId;

    // Get payout request data
    const { paymentMethod, accountDetails } = await request.json();

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, message: "Payment method is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find technician
    const technician = await db.collection("technicians").findOne({
      $or: [
        ...(ObjectId.isValid(userId) ? [{ _id: new ObjectId(userId) }] : []),
        { userId: userId }
      ]
    });

    if (!technician) {
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    // Check if technician has pending earnings
    if (!technician.earnings || technician.earnings.pending <= 0) {
      return NextResponse.json(
        { success: false, message: "No pending earnings to withdraw" },
        { status: 400 }
      );
    }

    // Get all unpaid bookings for this technician
    const unpaidBookings = await db.collection("bookings").find({
      technicianId: technician._id.toString(),
      status: "completed",
      // No associated payout
      payoutId: { $exists: false }
    }).toArray();

    if (unpaidBookings.length === 0) {
      return NextResponse.json(
        { success: false, message: "No unpaid bookings found" },
        { status: 400 }
      );
    }

    // Get the admin commission rate from settings (fetch once)
    const settingsDoc = await db.collection("settings").findOne({ key: "commission" });
    const adminCommissionPercentage = settingsDoc?.value || 30; // Default to 30% if not set

    // Calculate total amount to be paid (technician's earnings after admin commission)
    const totalAmount = unpaidBookings.reduce((sum, booking) => {
      if (booking.earnings && booking.earnings.technicianEarnings) {
        // Use pre-calculated earnings if available
        return sum + booking.earnings.technicianEarnings;
      } else {
        // Calculate earnings if not already calculated
        const bookingAmount = booking.finalAmount || booking.amount || 0;
        const adminCommission = Math.round((bookingAmount * adminCommissionPercentage) / 100);
        const technicianEarnings = bookingAmount - adminCommission;
        return sum + technicianEarnings;
      }
    }, 0);

    // Create payout request
    const payoutRequest = {
      technicianId: technician._id.toString(),
      technicianName: technician.name,
      amount: totalAmount,
      bookingIds: unpaidBookings.map(booking => booking._id.toString()),
      paymentMethod,
      accountDetails,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("payoutRequests").insertOne(payoutRequest);

    // Update bookings with payout request ID
    await db.collection("bookings").updateMany(
      { _id: { $in: unpaidBookings.map(booking => booking._id) } },
      { $set: { payoutRequestId: result.insertedId.toString() } }
    );

    // Create notification for admin
    const notification = {
      recipientType: "admin",
      title: "New Payout Request",
      message: `Technician ${technician.name} has requested a payout of ₹${totalAmount}`,
      technicianId: technician._id.toString(),
      payoutRequestId: result.insertedId.toString(),
      status: "unread",
      createdAt: new Date()
    };

    await db.collection("notifications").insertOne(notification);

    return NextResponse.json({
      success: true,
      message: "Payout request submitted successfully",
      payoutRequest: {
        _id: result.insertedId,
        ...payoutRequest
      }
    });
  } catch (error) {
    console.error("Error requesting payout:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit payout request" },
      { status: 500 }
    );
  }
}
