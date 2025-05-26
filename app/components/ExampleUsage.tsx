// Example of how to replace MockRazorpayCheckout with RealPaymentModal

// OLD WAY (with mock data):
/*
import MockRazorpayCheckout from './MockRazorpayCheckout';

{showRazorpay && orderData && (
  <MockRazorpayCheckout
    isOpen={showRazorpay}
    onClose={() => setShowRazorpay(false)}
    onSuccess={handlePaymentSuccess}
    onFailure={handlePaymentFailure}
    amount={orderData.amount}
    currency={orderData.currency}
    orderId={orderData.id}
    name="Dizit Solutions"
    description={`Payment for ${serviceTitle}`}
    customerName={name}
    customerEmail={email}
    customerPhone={phone}
  />
)}
*/

// NEW WAY (with real payment):
/*
import RealPaymentModal from './RealPaymentModal';

<RealPaymentModal
  isOpen={isPaymentModalOpen}
  onClose={() => setIsPaymentModalOpen(false)}
  serviceTitle="AC Repair Service"
  servicePrice="₹499"
  onPaymentSuccess={(paymentId, orderId) => {
    console.log('Payment successful:', { paymentId, orderId });
    // Handle success - show confirmation, redirect, etc.
  }}
  userProfile={{
    name: "John Doe",
    email: "john@example.com",
    phone: "9876543210"
  }}
/>
*/

// Key differences:
// 1. No need to create Razorpay order beforehand
// 2. Handles both cash and online payments
// 3. Shows beautiful success animation
// 4. Real payment processing with proper validation
// 5. No mock data - everything is real

export default function ExampleUsage() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Payment Integration Guide</h2>
      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="text-sm text-gray-600">
          Replace your existing MockRazorpayCheckout with RealPaymentModal for real payment processing.
        </p>
      </div>
    </div>
  );
}
