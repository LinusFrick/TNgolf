'use client';

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "../components/useTheme";
import { FaGoogle } from "react-icons/fa";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [hasGoogleAuth, setHasGoogleAuth] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const isLight = theme === 'light';

  // Check if Google OAuth is available
  useEffect(() => {
    fetch('/api/auth/providers')
      .then(res => res.json())
      .then(data => {
        setHasGoogleAuth(!!data.google);
      })
      .catch(() => setHasGoogleAuth(false));
  }, []);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isSignUp) {
        // Sign up logic
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registrering misslyckades');
        }

        // After successful signup, sign in
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error(result.error);
        }

        router.push('/boka');
      } else {
        // Sign in logic
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error(result.error);
        }

        router.push('/boka');
      }
    } catch (err) {
      setError(err.message || 'Något gick fel');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await signIn('google', { 
        callbackUrl: '/boka',
        redirect: true 
      });
      // If redirect is false, handle manually
      if (result?.error) {
        setError('Google-inloggning misslyckades');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError('Google-inloggning misslyckades');
      setIsLoading(false);
    }
  };

  const bgColor = isLight ? 'bg-white' : 'bg-gray-900';
  const textColor = isLight ? 'text-gray-900' : 'text-white';
  const inputBg = isLight ? 'bg-gray-100' : 'bg-gray-800';
  const borderColor = isLight ? 'border-gray-300' : 'border-gray-700';

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${bgColor}`}>
      <div className={`w-full max-w-md p-8 rounded-2xl shadow-xl ${isLight ? 'bg-gray-50' : 'bg-gray-800'}`}>
        <h1 className={`text-3xl font-bold mb-6 text-center ${textColor}`}>
          {isSignUp ? 'Skapa konto' : 'Logga in'}
        </h1>

        {error && (
          <div 
            role="alert" 
            aria-live="polite"
            className={`mb-4 p-3 rounded-lg ${isLight ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-red-900/30 text-red-300 border border-red-700'}`}
          >
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="name" className={`block text-sm font-medium mb-2 ${textColor}`}>
                Namn
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(""); // Clear error on input change
                }}
                required={isSignUp}
                autoComplete="name"
                aria-required="true"
                className={`w-full min-h-[44px] px-4 py-2 rounded-lg ${inputBg} ${textColor} border ${borderColor} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                placeholder="Ditt namn"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className={`block text-sm font-medium mb-2 ${textColor}`}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(""); // Clear error on input change
              }}
              required
              autoComplete="email"
              aria-required="true"
              aria-invalid={error && error.includes('email') ? 'true' : 'false'}
              aria-describedby={error && error.includes('email') ? 'email-error' : undefined}
              className={`w-full min-h-[44px] px-4 py-2 rounded-lg ${inputBg} ${textColor} border ${borderColor} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
              placeholder="din@email.com"
            />
            {error && error.includes('email') && (
              <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className={`block text-sm font-medium mb-2 ${textColor}`}>
              Lösenord
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(""); // Clear error on input change
              }}
              required
              minLength={6}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              aria-required="true"
              aria-invalid={error && error.includes('lösenord') ? 'true' : 'false'}
              aria-describedby={error && error.includes('lösenord') ? 'password-error' : undefined}
              className={`w-full min-h-[44px] px-4 py-2 rounded-lg ${inputBg} ${textColor} border ${borderColor} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
              placeholder="••••••••"
            />
            {error && error.includes('lösenord') && (
              <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            {isSignUp && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Minst 6 tecken
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            aria-label={isLoading ? 'Laddar...' : isSignUp ? 'Skapa konto' : 'Logga in'}
            className={`w-full min-h-[44px] py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            } text-white`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Laddar...
              </span>
            ) : (
              isSignUp ? 'Skapa konto' : 'Logga in'
            )}
          </button>
        </form>

        {hasGoogleAuth && (
          <>
            <div className="relative my-6">
              <div className={`absolute inset-0 flex items-center ${isLight ? 'border-gray-300' : 'border-gray-700'}`}>
                <div className={`w-full border-t ${borderColor}`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 ${isLight ? 'bg-gray-50 text-gray-500' : 'bg-gray-800 text-gray-400'}`}>
                  eller
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              aria-busy={isLoading}
              aria-label="Logga in med Google"
              className={`w-full min-h-[44px] py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : isLight
                  ? 'bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-900 border border-gray-300'
                  : 'bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white'
              }`}
            >
              <FaGoogle className="text-lg" aria-hidden="true" />
              {isLoading ? 'Laddar...' : 'Fortsätt med Google'}
            </button>
          </>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className={`text-sm ${isLight ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'}`}
          >
            {isSignUp
              ? 'Har du redan ett konto? Logga in'
              : 'Har du inget konto? Skapa ett'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/"
            className={`text-sm ${isLight ? 'text-gray-600 hover:text-gray-700' : 'text-gray-400 hover:text-gray-300'}`}
          >
            ← Tillbaka till startsidan
          </Link>
        </div>
      </div>
    </div>
  );
}
