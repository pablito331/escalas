import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
}

export const initAuthListener = (
  onSuccess: (user: User, token: string) => void,
  onFailure: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user && cachedAccessToken) {
      onSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      onFailure();
    }
  });
};

/**
 * Sign in with Google using Firebase Auth popup.
 * Also retrieves the OAuth access token for Google Sheets API.
 */
export async function googleSignInWithFirebase(): Promise<{
  user: { name: string; email: string; picture?: string };
  accessToken: string;
}> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      throw new Error('Não foi possível obter o Token de Acesso do Google.');
    }

    cachedAccessToken = token;

    const userProfile = {
      name: result.user.displayName || result.user.email || 'Usuário',
      email: result.user.email || '',
      picture: result.user.photoURL || undefined,
    };

    return {
      user: userProfile,
      accessToken: token,
    };
  } finally {
    isSigningIn = false;
  }
}

/**
 * Get OAuth Client ID from firebase config
 */
export function getOAuthClientId(): string {
  return firebaseConfig.oAuthClientId || '';
}

export async function logout(): Promise<void> {
  await auth.signOut();
  cachedAccessToken = null;
}
