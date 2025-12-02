'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "../components/useTheme";
import Link from "next/link";
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe (client-side only)
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const SERVICE_TYPES = [
  { id: 'golftraning', name: 'Golfträning', description: 'Personlig golfträning för att förbättra ditt tekniska spel', price: 1079 },
  { id: 'mental-traning', name: 'Mental träning (Golf & Mind)', description: 'Arbeta med din mentala styrka och fokus', price: 1079 },
  { id: 'gruppträning', name: 'Gruppträning', description: 'Träna tillsammans med andra golfspelare', price: 1079 },
];

export default function BokaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const isLight = theme === 'light';

  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stripe"); // Default to Stripe
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [testingEmail, setTestingEmail] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [expandedDays, setExpandedDays] = useState(new Set());
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchMyBookings();
    }
  }, [session]);

  useEffect(() => {
    if (selectedService) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedService, currentWeekStart]);

  // Check for payment success/cancel in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const bookingId = urlParams.get('booking');

    if (paymentStatus === 'success' && bookingId) {
      setSuccess(true);
      fetchMyBookings();
      fetchAvailableSlots();
      // Clean URL
      window.history.replaceState({}, '', '/boka');
    } else if (paymentStatus === 'cancelled') {
      setError('Betalningen avbröts');
      window.history.replaceState({}, '', '/boka');
    }
  }, []);

  const fetchMyBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
      if (response.ok) {
        const data = await response.json();
        setMyBookings(data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedService) return;
    
    setIsLoadingSlots(true);
    try {
      const response = await fetch(`/api/bookings/available?serviceType=${selectedService}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data);
      } else {
        setError('Kunde inte hämta tillgängliga tider');
      }
    } catch (err) {
      console.error('Error fetching available slots:', err);
      setError('Kunde inte hämta tillgängliga tider');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    if (!selectedService || !selectedDate || !selectedTime) {
      setError("Vänligen välj tjänst, datum och tid");
      setIsSubmitting(false);
      return;
    }

    try {
      // Step 1: Create booking
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: selectedService,
          date: selectedDate,
          time: selectedTime,
          notes: notes || null,
          paymentMethod: paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bokning misslyckades');
      }

      // Step 2: If Stripe payment required, create checkout session
      if (data.requiresPayment && paymentMethod === 'stripe') {
        setIsProcessingPayment(true);
        
        const paymentResponse = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: data.id,
          }),
        });

        const paymentData = await paymentResponse.json();

        if (!paymentResponse.ok) {
          throw new Error(paymentData.error || 'Betalning misslyckades');
        }

        // Redirect to Stripe Checkout
        if (paymentData.url) {
          window.location.href = paymentData.url;
        } else {
          throw new Error('Kunde inte ladda Stripe Checkout');
        }
      } else {
        // Non-Stripe payment or no payment required
        setSuccess(true);
        resetForm();
      }
    } catch (err) {
      setError(err.message || 'Något gick fel');
      setIsProcessingPayment(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedDate("");
    setSelectedTime("");
    setNotes("");
    setPaymentMethod("stripe");
    setTimeout(() => setSuccess(false), 5000);
  };

  const testEmail = async (bookingId) => {
    setTestingEmail(bookingId);
    setError("");
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Kunde inte skicka test-e-post');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.message || 'Kunde inte skicka test-e-post');
    } finally {
      setTestingEmail(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get week dates (Monday to Sunday)
  const getWeekDates = () => {
    const dates = [];
    const start = new Date(currentWeekStart);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Navigate weeks
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  // Get available times for a specific date
  const getAvailableTimesForDate = (dateStr) => {
    const slot = availableSlots.find(s => s.date === dateStr);
    return slot ? slot.times : [];
  };

  // Get time range summary for a date
  const getTimeRangeSummary = (times) => {
    if (times.length === 0) return null;
    const sortedTimes = [...times].sort();
    const first = sortedTimes[0];
    const last = sortedTimes[sortedTimes.length - 1];
    return { first, last, count: times.length };
  };

  // Toggle day expansion
  const toggleDay = (dateStr) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateStr)) {
        newSet.delete(dateStr);
      } else {
        newSet.add(dateStr);
      }
      return newSet;
    });
  };

  // Expand all days
  const expandAllDays = () => {
    const allDates = getWeekDates().map(date => date.toISOString().split('T')[0]);
    setExpandedDays(new Set(allDates));
  };

  // Collapse all days
  const collapseAllDays = () => {
    setExpandedDays(new Set());
  };

  // Format week range for display
  const formatWeekRange = () => {
    const start = new Date(currentWeekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    const startMonth = start.toLocaleDateString('sv-SE', { month: 'short' });
    const endMonth = end.toLocaleDateString('sv-SE', { month: 'short' });
    const startDay = start.getDate();
    const endDay = end.getDate();
    
    if (startMonth === endMonth) {
      return `${startDay} - ${endDay} ${startMonth.toUpperCase()}`;
    }
    return `${startDay} ${startMonth.toUpperCase()} - ${endDay} ${endMonth.toUpperCase()}`;
  };

  // Get week number
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  if (status === "loading") {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isLight ? 'bg-white' : 'bg-gray-900'}`} role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
        <p className={`mt-4 text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
          Laddar...
        </p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const bgColor = isLight ? 'bg-white' : 'bg-gray-900';
  const textColor = isLight ? 'text-gray-900' : 'text-white';
  const cardBg = isLight ? 'bg-gray-50' : 'bg-gray-800';
  const inputBg = isLight ? 'bg-white' : 'bg-gray-700';
  const borderColor = isLight ? 'border-gray-300' : 'border-gray-600';

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} py-12 px-4 pt-40 sm:pt-44 md:pt-48 lg:pt-52`}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Boka en tid</h1>

        {success && (
          <div 
            role="alert" 
            aria-live="polite"
            className={`mb-6 p-4 rounded-lg border ${isLight ? 'bg-green-100 text-green-800 border-green-300' : 'bg-green-900/30 text-green-300 border-green-700'}`}
          >
            <p className="font-medium">✓ Bokning skapad framgångsrikt! Du kommer att få en bekräftelse via email.</p>
          </div>
        )}

        {error && (
          <div 
            role="alert" 
            aria-live="assertive"
            className={`mb-6 p-4 rounded-lg border ${isLight ? 'bg-red-100 text-red-800 border-red-300' : 'bg-red-900/30 text-red-300 border-red-700'}`}
          >
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Main Booking Section */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Booking Form - Full width when no service selected, narrower when calendar is shown */}
          <div className={`${cardBg} p-4 sm:p-6 rounded-xl shadow-lg ${selectedService ? 'lg:w-2/5' : 'w-full'}`}>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Välj tjänst och tid</h2>
              {!selectedService && (
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                  Välj en tjänst för att se tillgängliga tider
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Selection */}
              <fieldset>
                <legend className={`block text-sm font-semibold mb-4 ${textColor}`}>
                  Välj tjänst <span className="text-red-500" aria-label="obligatoriskt">*</span>
                </legend>
                <div className="space-y-3" role="radiogroup" aria-label="Välj tjänst">
                  {SERVICE_TYPES.map((service) => (
                    <label
                      key={service.id}
                      className={`flex items-start min-h-[44px] p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 ${
                        selectedService === service.id
                          ? isLight
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-blue-500 bg-blue-900/20 shadow-md'
                          : `${borderColor} ${cardBg} hover:border-blue-300 hover:shadow-sm`
                      }`}
                    >
                      <input
                        type="radio"
                        name="service"
                        value={service.id}
                        checked={selectedService === service.id}
                        onChange={(e) => {
                          setSelectedService(e.target.value);
                          setError("");
                        }}
                        className="mt-1 mr-4 w-5 h-5 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                        aria-describedby={`service-${service.id}-desc`}
                        required
                      />
                      <div className="flex-1">
                        <div className="font-bold text-base mb-1">{service.name}</div>
                        <div id={`service-${service.id}-desc`} className={`text-sm leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                          {service.description}
                        </div>
                        <div className={`text-sm font-semibold mt-2 ${
                          isLight ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          {service.price.toLocaleString('sv-SE')} kr
                        </div>
                      </div>
                      {selectedService === service.id && (
                        <div className={`ml-2 flex-shrink-0 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Selected time confirmation - shown in form when time is selected */}
              {selectedDate && selectedTime && (
                <div className={`p-4 rounded-lg border-2 ${
                  isLight 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'bg-blue-900/20 border-blue-600'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-xs font-semibold uppercase ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>
                      Vald tid
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate("");
                        setSelectedTime("");
                      }}
                      aria-label="Avmarkera vald tid"
                      className={`min-h-[28px] min-w-[28px] p-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isLight
                          ? 'hover:bg-blue-100 text-blue-700'
                          : 'hover:bg-blue-900/40 text-blue-300'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className={`text-base font-bold ${textColor}`}>
                    {formatDate(selectedDate)} kl {selectedTime}
                  </div>
                  {selectedService && (
                    <div className={`text-sm mt-1 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                      {SERVICE_TYPES.find(s => s.id === selectedService)?.name}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label htmlFor="notes" className={`block text-sm font-medium mb-2 ${textColor}`}>
                  Ytterligare information (valfritt)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  aria-label="Ytterligare information om bokningen"
                  className={`w-full min-h-[44px] px-4 py-2 rounded-lg ${inputBg} ${textColor} border ${borderColor} focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:ring-inset transition-colors resize-y`}
                  placeholder="Berätta om dina mål eller önskemål..."
                />
              </div>

              {/* Payment Method Selection */}
              {selectedDate && selectedTime && selectedService && (
                <div>
                  <fieldset>
                    <legend className={`block text-sm font-semibold mb-3 ${textColor}`}>
                      Betalningsmetod <span className="text-red-500" aria-label="obligatoriskt">*</span>
                    </legend>
                    <div className="space-y-2" role="radiogroup" aria-label="Välj betalningsmetod">
                      <label
                        className={`flex items-center min-h-[44px] p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          paymentMethod === 'stripe'
                            ? isLight
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-blue-500 bg-blue-900/20'
                            : `${borderColor} ${cardBg} hover:border-blue-300`
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="stripe"
                          checked={paymentMethod === 'stripe'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-3 w-5 h-5 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:ring-inset flex-shrink-0"
                          required
                        />
                        <div className="flex-1 flex items-center gap-3">
                          <div className={`text-2xl font-bold ${paymentMethod === 'stripe' ? 'text-blue-600 dark:text-blue-400' : textColor}`}>
                            Kortbetalning
                          </div>
                          <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                            Betala säkert med kort via Stripe
                          </div>
                        </div>
                        {paymentMethod === 'stripe' && (
                          <div className={`ml-2 flex-shrink-0 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </label>
                    </div>
                    {paymentMethod === 'stripe' && selectedService && (
                      <div className={`mt-3 p-4 rounded-lg ${isLight ? 'bg-blue-50 border border-blue-200' : 'bg-blue-900/20 border border-blue-700'}`}>
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${isLight ? 'bg-blue-100' : 'bg-blue-800/50'}`}>
                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold mb-1 ${isLight ? 'text-blue-800' : 'text-blue-300'}`}>
                              Säker kortbetalning
                            </p>
                            <p className={`text-xs ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>
                              Du omdirigeras till Stripe Checkout för säker betalning. Vi lagrar inte dina kortuppgifter.
                            </p>
                          </div>
                        </div>
                        <div className={`pt-3 border-t ${isLight ? 'border-blue-200' : 'border-blue-700'}`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                              Totalt att betala:
                            </span>
                            <span className={`text-lg font-bold ${isLight ? 'text-blue-900' : 'text-blue-200'}`}>
                              {SERVICE_TYPES.find(s => s.id === selectedService)?.price.toLocaleString('sv-SE')} kr
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </fieldset>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || isProcessingPayment || !selectedService || !selectedDate || !selectedTime || !paymentMethod}
                aria-busy={isSubmitting || isProcessingPayment}
                aria-label={isSubmitting || isProcessingPayment ? 'Skapar bokning...' : 'Boka vald tid'}
                className={`w-full min-h-[44px] py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isSubmitting || isProcessingPayment || !selectedService || !selectedDate || !selectedTime
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                } text-white`}
              >
                {isSubmitting || isProcessingPayment ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    {isProcessingPayment ? 'Öppnar betalning...' : 'Skapar bokning...'}
                  </span>
                ) : (
                  'Boka tid'
                )}
              </button>
            </form>
          </div>

          {/* Calendar View - Improved Design */}
          {selectedService && (
            <div className={`${cardBg} p-4 sm:p-6 rounded-xl shadow-lg lg:w-3/5`}>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">Tillgängliga tider</h2>
                <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                  Välj ett datum och tid för din bokning
                </p>
              </div>
              
              {isLoadingSlots ? (
                <div className="flex flex-col items-center justify-center py-16" role="status" aria-live="polite">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
                  <p className={`mt-4 text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                    Laddar tillgängliga tider...
                  </p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className={`py-12 text-center ${isLight ? 'bg-gray-50' : 'bg-gray-800/50'} rounded-lg`} role="status">
                  <p className={`text-base font-medium ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                    Inga tillgängliga tider för denna tjänst just nu.
                  </p>
                  <p className={`mt-2 text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                    Välj en annan vecka eller kontakta oss direkt.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Week Navigation Header - Improved */}
                  <div className={`flex items-center justify-between p-4 rounded-lg ${isLight ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-gray-700'}`}>
                    <button
                      type="button"
                      onClick={goToPreviousWeek}
                      aria-label="Gå till föregående vecka"
                      className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isLight
                          ? 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900'
                          : 'bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white'
                      }`}
                    >
                      <span className="hidden sm:inline">← Tidigare</span>
                      <span className="sm:hidden">←</span>
                    </button>
                    <div className="text-center flex-1 px-4">
                      <div className={`font-bold text-base sm:text-lg ${textColor}`}>
                        {formatWeekRange()}
                      </div>
                      <div className={`text-xs sm:text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                        Vecka {getWeekNumber(currentWeekStart)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={goToNextWeek}
                      aria-label="Gå till nästa vecka"
                      className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isLight
                          ? 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900'
                          : 'bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white'
                      }`}
                    >
                      <span className="hidden sm:inline">Senare →</span>
                      <span className="sm:hidden">→</span>
                    </button>
                  </div>

                  {/* Expand/Collapse Controls */}
                  {availableSlots.length > 0 && (
                    <div className="flex items-center justify-end gap-2 mb-4">
                      <button
                        type="button"
                        onClick={expandAllDays}
                        className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isLight
                            ? 'text-gray-700 hover:bg-gray-100'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        Expandera alla
                      </button>
                      <button
                        type="button"
                        onClick={collapseAllDays}
                        className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isLight
                            ? 'text-gray-700 hover:bg-gray-100'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        Dölj alla
                      </button>
                    </div>
                  )}

                  {/* Mobile-First Calendar: Day Cards with Collapsible Times */}
                  <div className="space-y-3">
                    {getWeekDates()
                      .map((date, dayIndex) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const availableTimes = getAvailableTimesForDate(dateStr);
                        return { date, dayIndex, dateStr, availableTimes };
                      })
                      .filter(({ availableTimes }) => availableTimes.length > 0)
                      .map(({ date, dayIndex, dateStr, availableTimes }) => {
                        const dayName = date.toLocaleDateString('sv-SE', { weekday: 'long' });
                        const dayNameShort = date.toLocaleDateString('sv-SE', { weekday: 'short' });
                        const dayNum = date.getDate();
                        const monthName = date.toLocaleDateString('sv-SE', { month: 'short' });
                        const isToday = dateStr === new Date().toISOString().split('T')[0];
                        const selectedServiceData = SERVICE_TYPES.find(s => s.id === selectedService);
                        const price = selectedServiceData?.price || 0;
                        const isExpanded = expandedDays.has(dateStr);
                        const timeSummary = getTimeRangeSummary(availableTimes);
                        
                        return (
                        <div
                          key={dayIndex}
                          className={`rounded-xl border-2 transition-all ${
                            isToday
                              ? isLight
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-blue-600 bg-blue-900/20'
                              : isLight
                              ? 'border-gray-200 bg-white'
                              : 'border-gray-700 bg-gray-800'
                          }`}
                        >
                          {/* Day Header - Clickable to expand/collapse */}
                          <button
                            type="button"
                            onClick={() => toggleDay(dateStr)}
                            className={`w-full p-4 border-b ${isLight ? 'border-gray-200' : 'border-gray-700'} transition-colors hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
                              isLight ? 'hover:bg-gray-50' : 'hover:bg-gray-700/50'
                            }`}
                            aria-expanded={isExpanded}
                            aria-label={`${isExpanded ? 'Dölj' : 'Visa'} tider för ${dayName} ${dayNum} ${monthName}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 text-left">
                                <div className={`text-sm font-semibold uppercase ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                                  <span className="hidden sm:inline">{dayName}</span>
                                  <span className="sm:hidden">{dayNameShort}</span>
                                </div>
                                <div className={`text-xl font-bold mt-1 ${textColor}`}>
                                  {dayNum} {monthName}
                                </div>
                                {timeSummary && (
                                  <div className={`text-sm mt-2 font-medium ${
                                    isLight ? 'text-gray-600' : 'text-gray-300'
                                  }`}>
                                    {timeSummary.count} tillgängliga tider: {timeSummary.first} - {timeSummary.last}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                {isToday && (
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    isLight
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-blue-900/50 text-blue-300'
                                  }`}>
                                    Idag
                                  </span>
                                )}
                                <svg
                                  className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''} ${
                                    isLight ? 'text-gray-400' : 'text-gray-500'
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </button>

                          {/* Time Slots for this Day - Collapsible */}
                          {isExpanded && (
                            <div className="p-4">
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {['10:00', '10:30', '10:45', '11:00', '11:30', '11:45', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'].map((time) => {
                                  const isAvailable = availableTimes.includes(time);
                                  const isSelected = selectedDate === dateStr && selectedTime === time;
                                  
                                  if (!isAvailable) return null;
                                  
                                  return (
                                    <button
                                      key={time}
                                      type="button"
                                      onClick={() => {
                                        setSelectedDate(dateStr);
                                        setSelectedTime(time);
                                        setError("");
                                        // Auto-expand the day if not already expanded
                                        if (!isExpanded) {
                                          setExpandedDays(prev => new Set([...prev, dateStr]));
                                        }
                                      }}
                                      aria-label={`Välj ${time} den ${formatDateShort(dateStr)}`}
                                      aria-pressed={isSelected}
                                      className={`min-h-[60px] sm:min-h-[70px] rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                        isSelected
                                          ? isLight
                                            ? 'bg-blue-600 text-white shadow-lg scale-105 ring-2 ring-blue-400'
                                            : 'bg-blue-600 text-white shadow-lg scale-105 ring-2 ring-blue-400'
                                          : isLight
                                          ? 'bg-green-50 hover:bg-green-100 active:bg-green-200 text-green-800 border-2 border-green-300 hover:border-green-400 hover:shadow-md'
                                          : 'bg-green-900/30 hover:bg-green-900/40 active:bg-green-900/50 text-green-200 border-2 border-green-600 hover:border-green-500 hover:shadow-md'
                                      }`}
                                    >
                                      <div className="text-sm font-bold">{time}</div>
                                      <div className="text-xs mt-1 opacity-90">
                                        {price.toLocaleString('sv-SE')} kr
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Selected Time Summary */}
                  {selectedDate && selectedTime && (
                    <div className={`p-4 rounded-lg border-2 ${
                      isLight
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-blue-900/20 border-blue-700'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className={`text-sm font-semibold uppercase ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>
                            Vald tid
                          </div>
                          <div className={`text-lg font-bold mt-1 ${textColor}`}>
                            {formatDate(selectedDate)} kl {selectedTime}
                          </div>
                          {selectedService && (
                            <div className={`text-sm mt-2 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                              {SERVICE_TYPES.find(s => s.id === selectedService)?.name}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate("");
                            setSelectedTime("");
                          }}
                          aria-label="Avmarkera vald tid"
                          className={`min-h-[32px] min-w-[32px] p-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isLight
                              ? 'hover:bg-blue-100 text-blue-700'
                              : 'hover:bg-blue-900/40 text-blue-300'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* My Bookings Section - Full width below */}
        <div className={`${cardBg} p-6 rounded-xl shadow-lg w-full`}>
          <h2 className="text-2xl font-semibold mb-6">Mina bokningar</h2>
            
            {myBookings.length === 0 ? (
              <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                Du har inga bokningar ännu.
              </p>
            ) : (
              <div className="space-y-4">
                {myBookings.map((booking) => {
                  const service = SERVICE_TYPES.find(s => s.id === booking.serviceType);
                  return (
                    <div
                      key={booking.id}
                      className={`p-4 rounded-lg border ${borderColor} ${isLight ? 'bg-white' : 'bg-gray-700'}`}
                    >
                      <div className="font-semibold mb-1">
                        {service?.name || booking.serviceType}
                      </div>
                      <div className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                        {formatDate(booking.date)} kl {booking.time}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className={`text-xs px-2 py-1 rounded inline-block ${
                          booking.status === 'confirmed'
                            ? isLight ? 'bg-green-100 text-green-800' : 'bg-green-900/30 text-green-300'
                            : isLight ? 'bg-yellow-100 text-yellow-800' : 'bg-yellow-900/30 text-yellow-300'
                        }`}>
                          {booking.status === 'confirmed' ? 'Bekräftad' : 'Väntar på bekräftelse'}
                        </div>
                        {booking.status === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => testEmail(booking.id)}
                            disabled={testingEmail === booking.id}
                            className={`text-xs px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              testingEmail === booking.id
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                            } ${
                              isLight
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50'
                            }`}
                          >
                            {testingEmail === booking.id ? 'Skickar...' : 'Testa e-post'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className={`inline-block min-h-[44px] min-w-[44px] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg ${isLight ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' : 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/20'}`}
            aria-label="Tillbaka till startsidan"
          >
            ← Tillbaka till startsidan
          </Link>
        </div>
      </div>
    </div>
  );
}

