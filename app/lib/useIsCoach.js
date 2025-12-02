'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';

export function useIsCoach() {
  const { data: session, status: sessionStatus } = useSession();
  const [isCoach, setIsCoach] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const checkingRef = useRef(false);

  useEffect(() => {
    // Wait for session to be loaded first
    if (sessionStatus === 'loading') {
      setIsLoading(true);
      return;
    }

    // Prevent multiple simultaneous checks
    if (checkingRef.current) {
      return;
    }

    if (session?.user?.email) {
      checkingRef.current = true;
      setIsLoading(true);
      
      // Check if user is coach by making a request to admin API
      fetch('/api/admin/bookings')
        .then(response => {
          setIsCoach(response.status !== 403);
          setIsLoading(false);
          checkingRef.current = false;
        })
        .catch(() => {
          setIsCoach(false);
          setIsLoading(false);
          checkingRef.current = false;
        });
    } else {
      // No session, definitely not a coach
      setIsCoach(false);
      setIsLoading(false);
      checkingRef.current = false;
    }
  }, [session, sessionStatus]);

  return { isCoach, isLoading };
}

