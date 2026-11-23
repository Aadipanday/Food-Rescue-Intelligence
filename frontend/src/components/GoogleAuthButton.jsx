import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '803290869050-0vsmu30786gia7ac29sdvqp6q3eear7n.apps.googleusercontent.com';

export default function GoogleAuthButton({
  onSuccess,
  onError,
  text = 'continue_with', // 'signin_with' | 'signup_with' | 'continue_with'
  disabled = false,
}) {
  const buttonRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    let checkInterval = null;

    const initGoogle = () => {
      if (window.google?.accounts?.id && buttonRef.current) {
        setScriptLoaded(true);
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
              if (response?.credential) {
                setLoading(true);
                try {
                  await onSuccess(response.credential);
                } catch (err) {
                  if (onError) onError(err);
                } finally {
                  setLoading(false);
                }
              }
            },
          });

          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: text,
            shape: 'pill',
            logo_alignment: 'left',
          });
        } catch (e) {
          console.warn('Google Identity initialization error:', e);
        }
      }
    };

    // Check if script is already present
    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          initGoogle();
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [onSuccess, onError, text]);

  const handleCustomClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* Official Google Button Target */}
      <div
        ref={buttonRef}
        className="w-full flex justify-center [&>div]:w-full min-h-[44px]"
        style={{ display: scriptLoaded ? 'flex' : 'none' }}
      />

      {/* Fallback button while Google SDK loads or if blocked */}
      {(!scriptLoaded || disabled) && (
        <button
          type="button"
          onClick={handleCustomClick}
          disabled={disabled || loading}
          className="w-full py-2.5 px-4 rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>
            {loading
              ? 'Authenticating with Google...'
              : text === 'signup_with'
              ? 'Sign up with Google'
              : 'Sign in with Google'}
          </span>
        </button>
      )}
    </div>
  );
}
