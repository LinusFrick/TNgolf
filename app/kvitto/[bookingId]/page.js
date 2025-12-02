'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useTheme } from "../../components/useTheme";
import Link from "next/link";

const SERVICE_TYPES = {
  'golftraning': { name: 'Golfträning', description: 'Personlig golfträning för att förbättra ditt tekniska spel' },
  'mental-traning': { name: 'Mental träning (Golf & Mind)', description: 'Arbeta med din mentala styrka och fokus' },
  'gruppträning': { name: 'Gruppträning', description: 'Träna tillsammans med andra golfspelare' },
};

export default function ReceiptPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const theme = useTheme();
  const isLight = theme === 'light';

  const [booking, setBooking] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    if (status === "authenticated") {
      // Wait a bit for params to be ready
      const timer = setTimeout(() => {
        const bookingId = params?.bookingId;
        if (bookingId) {
          fetchReceipt();
        } else {
          console.error("Booking ID not found in params:", params);
          setError("Boknings-ID saknas");
          setLoading(false);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [status, params, router]);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const bookingId = params?.bookingId;
      if (!bookingId) {
        setError("Boknings-ID saknas");
        setLoading(false);
        return;
      }
      const response = await fetch(`/api/receipt/${bookingId}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Kunde inte hämta kvitto');
      }

      const data = await response.json();
      setBooking(data.booking);
      setReceiptData(data.receiptData);
    } catch (err) {
      setError(err.message || 'Något gick fel');
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isLight ? 'bg-white' : 'bg-gray-900'}`} role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
        <p className={`mt-4 text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
          Laddar kvitto...
        </p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (error || !booking) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isLight ? 'bg-white' : 'bg-gray-900'}`}>
        <div className={`max-w-md w-full p-6 rounded-lg ${isLight ? 'bg-red-50 border border-red-200' : 'bg-red-900/20 border border-red-700'}`}>
          <h2 className={`text-xl font-bold mb-2 ${isLight ? 'text-red-800' : 'text-red-300'}`}>
            Kunde inte ladda kvitto
          </h2>
          <p className={`${isLight ? 'text-red-700' : 'text-red-400'}`}>
            {error || 'Kvittot kunde inte hittas eller du har inte behörighet att visa det.'}
          </p>
          <Link
            href="/boka"
            className={`mt-4 inline-block px-4 py-2 rounded-lg font-semibold transition-colors ${
              isLight
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-700 hover:bg-blue-600 text-white'
            }`}
          >
            Tillbaka till bokningar
          </Link>
        </div>
      </div>
    );
  }

  const service = SERVICE_TYPES[booking.serviceType] || { name: booking.serviceType, description: '' };
  // Parse date correctly to avoid timezone issues
  const bookingDate = new Date(booking.date);
  // Get date components in local timezone
  const year = bookingDate.getFullYear();
  const month = bookingDate.getMonth();
  const day = bookingDate.getDate();
  const localDate = new Date(year, month, day);
  const dateStr = localDate.toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const bgColor = isLight ? 'bg-white' : 'bg-gray-900';
  const textColor = isLight ? 'text-gray-900' : 'text-white';
  const cardBg = isLight ? 'bg-gray-50' : 'bg-gray-800';
  const borderColor = isLight ? 'border-gray-300' : 'border-gray-600';

  // Calculate if cancellation is free (24h before booking)
  // Parse date correctly to avoid timezone issues
  const bookingDateTime = booking ? (() => {
    const date = new Date(booking.date);
    // Get date components in local timezone
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const localDate = new Date(year, month, day);
    if (booking?.time) {
      const [hours, minutes] = booking.time.split(':');
      localDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    return localDate;
  })() : null;
  
  const now = new Date();
  const hoursUntilBooking = bookingDateTime 
    ? Math.floor((bookingDateTime - now) / (1000 * 60 * 60))
    : null;
  // Only allow cancellation if more than 48 hours remain
  const canCancel = hoursUntilBooking !== null && hoursUntilBooking > 48;
  const isPastBooking = hoursUntilBooking !== null && hoursUntilBooking < 0;

  const handleCancelBooking = async () => {
    if (!booking) return;
    
    if (!confirm('Är du säker på att du vill begära avbokning av denna bokning?')) {
      return;
    }

    setCancelling(true);
    setCancelMessage("");
    
    try {
      const response = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kunde inte skicka avbokningsförfrågan');
      }

      setCancelMessage("Avbokningsförfrågan har skickats till admin. Du kommer att få svar via e-post.");
      // Refresh booking data
      fetchReceipt();
    } catch (err) {
      setCancelMessage(err.message || 'Något gick fel vid avbokningsförfrågan');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} py-8 sm:py-12 px-4`}>
      <div className="max-w-3xl mx-auto">
        {/* Receipt Card - White background for print */}
        <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} p-6 sm:p-8 md:p-10 rounded-xl shadow-xl border-2 ${borderColor} mb-6 print:shadow-none print:border-0`}>
          {/* Company Header */}
          <div className={`mb-8 pb-6 border-b-2 ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-1">Golfmind</h1>
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                  Bokningsbekräftelse
                </p>
              </div>
              <div className={`text-right ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                <p className="text-xs">Kvitto #</p>
                <p className="text-sm font-mono">{booking.id.slice(-8).toUpperCase()}</p>
              </div>
            </div>
            <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
              <p>Utfärdat: {new Date(booking.createdAt).toLocaleDateString('sv-SE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>

          {/* Booking Information */}
          <div className="mb-8">
            <h2 className={`text-xl font-bold mb-6 pb-2 border-b ${isLight ? 'border-gray-200 text-gray-900' : 'border-gray-700 text-gray-100'}`}>
              Bokningsinformation
            </h2>
            <div className={`${isLight ? 'bg-gray-50' : 'bg-gray-900/50'} p-5 rounded-lg space-y-4`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm mb-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Tjänst</p>
                  <p className={`font-semibold text-lg ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>{service.name}</p>
                </div>
                <div>
                  <p className={`text-sm mb-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Datum</p>
                  <p className={`font-semibold text-lg ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>{dateStr}</p>
                </div>
                <div>
                  <p className={`text-sm mb-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Tid</p>
                  <p className={`font-semibold text-lg ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>{booking.time}</p>
                </div>
                <div>
                  <p className={`text-sm mb-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    booking.status === 'confirmed'
                      ? isLight ? 'bg-green-100 text-green-800' : 'bg-green-900/30 text-green-300'
                      : isLight ? 'bg-yellow-100 text-yellow-800' : 'bg-yellow-900/30 text-yellow-300'
                  }`}>
                    {booking.status === 'confirmed' ? 'Bekräftad' : 'Väntar på bekräftelse'}
                  </span>
                </div>
              </div>
              {booking.notes && (
                <div className={`mt-4 pt-4 border-t ${borderColor}`}>
                  <p className={`text-sm font-semibold mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Anteckningar</p>
                  <p className={`${isLight ? 'text-gray-800' : 'text-gray-200'}`}>{booking.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          {receiptData && (
            <div className={`mb-8 pt-6 border-t-2 ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
              <h2 className={`text-xl font-bold mb-6 pb-2 border-b ${isLight ? 'border-gray-200 text-gray-900' : 'border-gray-700 text-gray-100'}`}>
                Betalningsinformation
              </h2>
              <div className={`${isLight ? 'bg-gray-50' : 'bg-gray-900/50'} p-5 rounded-lg space-y-3`}>
                {receiptData.paymentDate && (
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Betalningsdatum</span>
                    <span className={`font-semibold ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>{receiptData.paymentDate}</span>
                  </div>
                )}
                {receiptData.paymentMethod && (
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Betalningsmetod</span>
                    <span className={`font-semibold ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>{receiptData.paymentMethod}</span>
                  </div>
                )}
                {receiptData.paymentIntentId && (
                  <div className={`flex justify-between items-start pt-3 border-t ${borderColor}`}>
                    <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Betalnings-ID</span>
                    <span className="font-mono text-xs text-right break-all max-w-[60%]">{receiptData.paymentIntentId}</span>
                  </div>
                )}
                {receiptData.chargeId && (
                  <div className="flex justify-between items-start">
                    <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Transaktions-ID</span>
                    <span className="font-mono text-xs text-right break-all max-w-[60%]">{receiptData.chargeId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Total Amount - Highlighted */}
          <div className={`pt-6 border-t-2 ${isLight ? 'border-gray-300' : 'border-gray-600'}`}>
            <div className={`${isLight ? 'bg-blue-50' : 'bg-blue-900/20'} p-6 rounded-lg`}>
              <div className="flex justify-between items-center">
                <span className="text-xl sm:text-2xl font-bold">Totalt betalat</span>
                <span className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {booking.amount ? booking.amount.toLocaleString('sv-SE') : '0'} kr
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation Information - Only show if more than 48h remain */}
        {booking && booking.status !== 'cancelled' && booking.cancellationRequest !== 'pending' && canCancel && (
          <div className={`mb-6 pt-6 border-t-2 ${isLight ? 'border-gray-200' : 'border-gray-700'} print:hidden`}>
            <div className={`${isLight ? 'bg-yellow-50 border-yellow-200' : 'bg-yellow-900/20 border-yellow-800/50'} border-2 rounded-lg p-4`}>
              <h3 className={`text-lg font-semibold mb-2 ${isLight ? 'text-yellow-900' : 'text-yellow-300'}`}>
                Avbokningspolicy
              </h3>
              <p className={`text-sm mb-3 ${isLight ? 'text-yellow-800' : 'text-yellow-200'}`}>
                Du kan avboka denna bokning eftersom det är mer än 48 timmar kvar till bokningen.
              </p>
              {hoursUntilBooking !== null && (
                <p className={`text-xs mb-4 ${isLight ? 'text-yellow-700' : 'text-yellow-300'}`}>
                  Tid kvar till bokning: {hoursUntilBooking} timmar
                </p>
              )}
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className={`min-h-[44px] px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isLight
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-red-700 hover:bg-red-600 text-white'
                }`}
              >
                {cancelling ? 'Skickar...' : 'Begär avbokning'}
              </button>
            </div>
          </div>
        )}

        {/* Cancellation Status Messages */}
        {cancelMessage && (
          <div className={`mb-6 print:hidden ${
            cancelMessage.includes('skickats') 
              ? isLight ? 'bg-green-50 border-green-200' : 'bg-green-900/20 border-green-800/50'
              : isLight ? 'bg-red-50 border-red-200' : 'bg-red-900/20 border-red-800/50'
          } border-2 rounded-lg p-4`}>
            <p className={`text-sm ${
              cancelMessage.includes('skickats')
                ? isLight ? 'text-green-800' : 'text-green-200'
                : isLight ? 'text-red-800' : 'text-red-200'
            }`}>
              {cancelMessage}
            </p>
          </div>
        )}

        {booking?.cancellationRequest === 'pending' && (
          <div className={`mb-6 print:hidden ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-800/50'} border-2 rounded-lg p-4`}>
            <p className={`text-sm ${isLight ? 'text-blue-800' : 'text-blue-200'}`}>
              Din avbokningsförfrågan är skickad och väntar på svar från admin.
            </p>
          </div>
        )}

        {/* Actions - Hidden when printing */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center print:hidden">
          <Link
            href="/boka"
            className={`min-h-[44px] px-6 py-3 rounded-lg font-semibold text-center transition-colors ${
              isLight
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-700 hover:bg-blue-600 text-white'
            }`}
          >
            Tillbaka till bokningar
          </Link>
          <button
            onClick={() => window.print()}
            className={`min-h-[44px] px-6 py-3 rounded-lg font-semibold transition-colors ${
              isLight
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            Skriv ut / Spara som PDF
          </button>
        </div>

        {/* Footer Note - Only show when printing */}
        <div className={`mt-8 text-center text-sm print:block hidden ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
          <p>Detta kvitto är en bekräftelse på din bokning och betalning.</p>
          <p className="mt-1">För frågor, kontakta oss via e-post.</p>
        </div>
      </div>
    </div>
  );
}

