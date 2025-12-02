'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "../components/useTheme";
import Link from "next/link";
import TimeSlotCalendar from "../components/TimeSlotCalendar";

const SERVICE_TYPES = {
  'golftraning': 'Golfträning',
  'mental-traning': 'Mental träning',
  'gruppträning': 'Gruppträning',
};

const STATUS_COLORS = {
  pending: { light: 'bg-yellow-100 text-yellow-800', dark: 'bg-yellow-900/30 text-yellow-300' },
  confirmed: { light: 'bg-green-100 text-green-800', dark: 'bg-green-900/30 text-green-300' },
  cancelled: { light: 'bg-red-100 text-red-800', dark: 'bg-red-900/30 text-red-300' },
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const isLight = theme === 'light';

  const [bookings, setBookings] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'blocked'
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSlotsToBlock, setSelectedSlotsToBlock] = useState(new Set()); // Set of "date_time" strings
  const [isBlocking, setIsBlocking] = useState(false);
  const [availableSlotsForBlocking, setAvailableSlotsForBlocking] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      checkCoachAccess();
    }
  }, [status, router]);

  const checkCoachAccess = async () => {
    try {
      const response = await fetch('/api/admin/bookings');
      if (response.status === 403) {
        setError("Du har inte behörighet att komma åt denna sida");
        router.push("/");
      } else if (response.ok) {
        fetchBookings();
        fetchBlockedSlots();
        fetchAvailableSlots();
      }
    } catch (err) {
      console.error('Error checking access:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const url = statusFilter === 'all' 
        ? '/api/admin/bookings'
        : `/api/admin/bookings?status=${statusFilter}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const fetchBlockedSlots = async () => {
    try {
      const response = await fetch('/api/admin/blocked-slots');
      if (response.ok) {
        const data = await response.json();
        setBlockedSlots(data);
      }
    } catch (err) {
      console.error('Error fetching blocked slots:', err);
    }
  };

  const fetchAvailableSlots = async () => {
    setIsLoadingSlots(true);
    try {
      // Fetch available slots (same as customer booking page)
      const response = await fetch('/api/bookings/available');
      if (response.ok) {
        const data = await response.json();
        setAvailableSlotsForBlocking(data);
      }
    } catch (err) {
      console.error('Error fetching available slots:', err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [statusFilter, activeTab]);

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setError("");
        fetchBookings();
      } else {
        const data = await response.json();
        setError(data.error || 'Kunde inte uppdatera bokning');
      }
    } catch (err) {
      console.error('Error updating booking:', err);
      setError('Kunde inte uppdatera bokning');
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!confirm('Är du säker på att du vill radera denna bokning?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setError("");
        fetchBookings();
      } else {
        const data = await response.json();
        setError(data.error || 'Kunde inte radera bokning');
      }
    } catch (err) {
      console.error('Error deleting booking:', err);
      setError('Kunde inte radera bokning');
    }
  };

  const unblockSlot = async (slotId) => {
    try {
      const response = await fetch(`/api/admin/blocked-slots?id=${slotId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setError("");
        fetchBlockedSlots();
      } else {
        const data = await response.json();
        setError(data.error || 'Kunde inte ta bort blockering');
      }
    } catch (err) {
      console.error('Error unblocking slot:', err);
      setError('Kunde inte ta bort blockering');
    }
  };

  // Handle slot selection for blocking
  const handleSlotSelect = (dateStr, time) => {
    const slotKey = `${dateStr}_${time}`;
    setSelectedSlotsToBlock(prev => new Set([...prev, slotKey]));
  };

  const handleSlotDeselect = (dateStr, time) => {
    const slotKey = `${dateStr}_${time}`;
    setSelectedSlotsToBlock(prev => {
      const newSet = new Set(prev);
      newSet.delete(slotKey);
      return newSet;
    });
  };

  // Block selected slots
  const blockSelectedSlots = async () => {
    if (selectedSlotsToBlock.size === 0) {
      setError("Vänligen välj minst en tid att blockera");
      return;
    }

    setIsBlocking(true);
    setError("");

    try {
      // Block all selected slots
      const promises = Array.from(selectedSlotsToBlock).map(slotKey => {
        const [dateStr, time] = slotKey.split('_');
        return fetch('/api/admin/blocked-slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: dateStr,
            time: time,
            reason: null,
          }),
        });
      });

      const results = await Promise.allSettled(promises);
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok));
      
      if (failed.length > 0) {
        setError(`${failed.length} av ${selectedSlotsToBlock.size} tider kunde inte blockeras`);
      } else {
        setError("");
        setSelectedSlotsToBlock(new Set());
        fetchBlockedSlots();
        fetchAvailableSlots(); // Refresh available slots
      }
    } catch (err) {
      console.error('Error blocking slots:', err);
      setError('Kunde inte blockera tider');
    } finally {
      setIsBlocking(false);
    }
  };

  // Clear all selected slots
  const clearSelectedSlots = () => {
    setSelectedSlotsToBlock(new Set());
    setError("");
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

  if (status === "loading" || isLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isLight ? 'bg-white' : 'bg-gray-900'}`} role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
        <p className={`mt-4 text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
          Laddar...
        </p>
      </div>
    );
  }

  if (error && error.includes("behörighet")) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-white' : 'bg-gray-900'}`}>
        <div className="text-center">
          <p className={`text-xl ${isLight ? 'text-gray-900' : 'text-white'}`}>{error}</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-4 inline-block">
            Tillbaka till startsidan
          </Link>
        </div>
      </div>
    );
  }

  const bgColor = isLight ? 'bg-white' : 'bg-gray-900';
  const textColor = isLight ? 'text-gray-900' : 'text-white';
  const cardBg = isLight ? 'bg-gray-50' : 'bg-gray-800';
  const borderColor = isLight ? 'border-gray-200' : 'border-gray-700';

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} py-12 px-4 pt-40 sm:pt-44 md:pt-48 lg:pt-52`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Coach Dashboard</h1>
          <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
            Hantera bokningar och tillgänglighet
          </p>
        </div>

        {error && !error.includes("behörighet") && (
          <div 
            role="alert" 
            aria-live="assertive"
            className={`mb-6 p-4 rounded-lg border ${isLight ? 'bg-red-100 text-red-800 border-red-300' : 'bg-red-900/30 text-red-300 border-red-700'}`}
          >
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-300 dark:border-gray-700">
          <button
            onClick={() => {
              setActiveTab('bookings');
              setError("");
            }}
            className={`px-4 py-2 font-semibold transition-colors border-b-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeTab === 'bookings'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
            aria-current={activeTab === 'bookings' ? 'page' : undefined}
          >
            Bokningar ({bookings.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('blocked');
              setError("");
            }}
            className={`px-4 py-2 font-semibold transition-colors border-b-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeTab === 'blocked'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
            aria-current={activeTab === 'blocked' ? 'page' : undefined}
          >
            Ta bort tider ({blockedSlots.length})
          </button>
        </div>

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {/* Status Filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setStatusFilter('all')}
                className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : isLight
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Alla
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  statusFilter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : isLight
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Väntande
              </button>
              <button
                onClick={() => setStatusFilter('confirmed')}
                className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  statusFilter === 'confirmed'
                    ? 'bg-green-600 text-white'
                    : isLight
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Bekräftade
              </button>
              <button
                onClick={() => setStatusFilter('cancelled')}
                className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  statusFilter === 'cancelled'
                    ? 'bg-red-600 text-white'
                    : isLight
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Avbokade
              </button>
            </div>

            {/* Bookings List */}
            {bookings.length === 0 ? (
              <p className={`text-center py-8 ${isLight ? 'text-gray-600' : 'text-gray-400'}`} role="status">
                Inga bokningar hittades
              </p>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className={`${cardBg} p-6 rounded-xl border-2 ${borderColor}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold">
                            {SERVICE_TYPES[booking.serviceType] || booking.serviceType}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isLight
                              ? STATUS_COLORS[booking.status].light
                              : STATUS_COLORS[booking.status].dark
                          }`}>
                            {booking.status === 'pending' ? 'Väntande' : 
                             booking.status === 'confirmed' ? 'Bekräftad' : 'Avbokad'}
                          </span>
                        </div>
                        <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'} mb-1`}>
                          {formatDate(booking.date)} kl {booking.time}
                        </p>
                        <p className={`text-sm ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                          <strong>Kund:</strong> {booking.user?.name || 'Okänt'} ({booking.user?.email})
                        </p>
                        {booking.notes && (
                          <p className={`text-sm mt-2 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                            <strong>Anteckningar:</strong> {booking.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                            className="min-h-[44px] px-4 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                            aria-label={`Bekräfta bokning för ${booking.user?.name || 'kund'}`}
                          >
                            Bekräfta
                          </button>
                        )}
                        {booking.status !== 'cancelled' && (
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                            className="min-h-[44px] px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label={`Avboka bokning för ${booking.user?.name || 'kund'}`}
                          >
                            Avboka
                          </button>
                        )}
                        {booking.status === 'cancelled' && (
                          <button
                            onClick={() => deleteBooking(booking.id)}
                            className="min-h-[44px] px-4 py-2 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                            aria-label={`Radera bokning för ${booking.user?.name || 'kund'}`}
                          >
                            Radera
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Block Time Slots Tab */}
        {activeTab === 'blocked' && (
          <div className="space-y-6">
            {/* Instructions */}
            <div className={`${cardBg} p-4 rounded-lg border ${borderColor}`}>
              <p className={`text-sm ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                <strong>Välj tider att blockera:</strong> Klicka på tider i kalendern för att markera dem. Du kan markera flera tider eller använda "Markera alla" för en hel dag. Markerade tider kommer att tas bort från tillgängliga tider för kunder.
              </p>
            </div>

            {/* Calendar for selecting slots to block */}
            <div className={`${cardBg} p-4 sm:p-6 rounded-xl shadow-lg`}>
              <TimeSlotCalendar
                availableSlots={availableSlotsForBlocking}
                isLoading={isLoadingSlots}
                onSlotSelect={handleSlotSelect}
                onSlotDeselect={handleSlotDeselect}
                selectedSlots={selectedSlotsToBlock}
                mode="multi"
                showPrice={false}
              />
            </div>

            {/* Selected Slots Summary and Actions */}
            {selectedSlotsToBlock.size > 0 && (
              <div className={`${cardBg} p-6 rounded-xl border-2 ${isLight ? 'border-blue-200 bg-blue-50' : 'border-blue-700 bg-blue-900/20'}`}>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">
                    {selectedSlotsToBlock.size} {selectedSlotsToBlock.size === 1 ? 'tid vald' : 'tider valda'}
                  </h3>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {Array.from(selectedSlotsToBlock).map((slotKey) => {
                      const [dateStr, time] = slotKey.split('_');
                      const date = new Date(dateStr);
                      return (
                        <div key={slotKey} className={`text-sm ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                          • {date.toLocaleDateString('sv-SE', { weekday: 'short', month: 'short', day: 'numeric' })} kl {time}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={blockSelectedSlots}
                    disabled={isBlocking}
                    aria-busy={isBlocking}
                    className="min-h-[44px] px-6 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isBlocking ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        Blockerar...
                      </span>
                    ) : (
                      `Blockera ${selectedSlotsToBlock.size} ${selectedSlotsToBlock.size === 1 ? 'tid' : 'tider'}`
                    )}
                  </button>
                  <button
                    onClick={clearSelectedSlots}
                    disabled={isBlocking}
                    className="min-h-[44px] px-6 py-2 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Rensa val
                  </button>
                </div>
              </div>
            )}

            {/* Existing Blocked Slots */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Blockerade tider</h2>
              {blockedSlots.length === 0 ? (
                <p className={`text-center py-8 ${isLight ? 'text-gray-600' : 'text-gray-400'}`} role="status">
                  Inga blockerade tider
                </p>
              ) : (
                <div className="space-y-4">
                  {blockedSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`${cardBg} p-4 rounded-lg border ${borderColor}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <p className="font-semibold">
                            {formatDate(slot.date)} kl {slot.time}
                          </p>
                          {slot.reason && (
                            <p className={`text-sm mt-1 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                              {slot.reason}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => unblockSlot(slot.id)}
                          className="min-h-[44px] px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 whitespace-nowrap"
                          aria-label={`Ta bort blockering för ${formatDateShort(slot.date)} kl ${slot.time}`}
                        >
                          Ta bort blockering
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/"
            className={`inline-block min-h-[44px] px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isLight
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
            aria-label="Tillbaka till startsidan"
          >
            ← Tillbaka till startsidan
          </Link>
        </div>
      </div>
    </div>
  );
}

