import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api/axios.js';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/** Wraps the app in Google's provider only when a client ID is configured. */
export function GoogleAuthProvider({ children }) {
  if (!CLIENT_ID) return children;
  return <GoogleOAuthProvider clientId={CLIENT_ID}>{children}</GoogleOAuthProvider>;
}

/** "Sign in with Google" button — hidden until VITE_GOOGLE_CLIENT_ID is set. */
export function GoogleButton() {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!CLIENT_ID) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <span className="text-xs font-medium text-slate-400">or continue with</span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>
      {/*
        The GIS button renders inside an iframe. We pin the wrapper to the exact
        button width and clip it to a pill so no white iframe background shows
        around it (the "white patch"). `colorScheme: dark` keeps it dark-on-dark.
      */}
      <div
        className="mx-auto w-[300px] max-w-full overflow-hidden rounded-full"
        style={{ colorScheme: 'dark' }}
      >
        <GoogleLogin
          theme="filled_black"
          shape="pill"
          size="large"
          text="continue_with"
          width="300"
          logo_alignment="center"
          onSuccess={async (resp) => {
            try {
              await googleLogin(resp.credential);
              toast.success('Signed in with Google');
              navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
            } catch (err) {
              toast.error(errMsg(err, 'Google sign-in failed'));
            }
          }}
          onError={() => toast.error('Google sign-in was cancelled or failed')}
        />
      </div>
    </div>
  );
}
