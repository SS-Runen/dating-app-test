import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || "{}");

export function getFirebaseApp() {
  console.log("getFirebaseApp\nFIREBASE CONFIG (client):", process.env.NEXT_PUBLIC_FIREBASE_CONFIG);
  // Initialize Firebase
  let app;
  if (!getApps().length) {
    console.log("Initializing Firebase");
      app = initializeApp(firebaseConfig);
  } else {
    console.log("Getting existing Firebase app");
      app = getApp();
  }
  return app;
}

function getFirebaseAuth(app: any) {
  console.log("getFirebaseAuth\nFIREBASE CONFIG (client):", process.env.NEXT_PUBLIC_FIREBASE_CONFIG);
  const auth = getAuth(app);
  console.log("Firebase auth initialized", auth);
  return auth;
}

export async function signInWithMobileNumber(phoneNumber: string) {
  console.log("signInWithMobileNumber\nFIREBASE CONFIG (client):", process.env.NEXT_PUBLIC_FIREBASE_CONFIG);
  try {
    const app = getFirebaseApp();
    const auth = getFirebaseAuth(app);
    auth.languageCode = "en";
    const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: (response: any) => {
        console.log(`Recaptcha verification successful: ${response}`);
      }
    });
    const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return confirmation
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function signInWithGoogle() {
  console.log("signInWithGoogle\nFIREBASE CONFIG (client):", process.env.NEXT_PUBLIC_FIREBASE_CONFIG);
  try {
    const app = getFirebaseApp();
    const auth = getFirebaseAuth(app);
    auth.languageCode = "en";
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}