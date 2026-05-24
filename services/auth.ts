import {
  signUp,
  signIn,
  confirmSignUp,
  signOut,
  fetchAuthSession,
  getCurrentUser,
} from "aws-amplify/auth";

/* ─────────────────────────────────────────────
   REGISTER USER
───────────────────────────────────────────── */
export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  try {
    const response = await signUp({
      username: email,
      password,

      options: {
        userAttributes: {
          name,
          email,
        },
      },
    });

    return response;

  } catch (error) {
    console.error("Register Error:", error);
    throw error;
  }
}

/* ─────────────────────────────────────────────
   VERIFY OTP CODE
───────────────────────────────────────────── */
export async function verifyUser(
  email: string,
  code: string
) {
  try {
    const response = await confirmSignUp({
      username: email,
      confirmationCode: code,
    });

    return response;

  } catch (error) {
    console.error("Verification Error:", error);
    throw error;
  }
}

/* ─────────────────────────────────────────────
   LOGIN USER
───────────────────────────────────────────── */
export async function loginUser(
  email: string,
  password: string
) {
  try {

    // Prevent "already signed in user" issue
    try {
      await signOut();
    } catch {}

    const response = await signIn({
      username: email,
      password,
    });

    return response;

  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
}

/* ─────────────────────────────────────────────
   LOGOUT USER
───────────────────────────────────────────── */
export async function logoutUser() {
  try {

    await signOut();

    localStorage.removeItem("sa_user");
    localStorage.removeItem("sa_token");

  } catch (error) {
    console.error("Logout Error:", error);
    throw error;
  }
}

/* ─────────────────────────────────────────────
   GET CURRENT LOGGED-IN USER
───────────────────────────────────────────── */
export async function currentUser() {
  try {

    const user = await getCurrentUser();

    return user;

  } catch (error) {
    console.error("Current User Error:", error);
    return null;
  }
}

/* ─────────────────────────────────────────────
   GET JWT TOKEN
───────────────────────────────────────────── */
export async function getToken() {
  try {

    const session = await fetchAuthSession();

    const token =
      session.tokens?.idToken?.toString();

    return token;

  } catch (error) {
    console.error("Token Error:", error);
    return null;
  }
}

/* ─────────────────────────────────────────────
   GET ACCESS TOKEN (OPTIONAL)
───────────────────────────────────────────── */
export async function getAccessToken() {
  try {

    const session = await fetchAuthSession();

    return session.tokens?.accessToken?.toString();

  } catch (error) {
    console.error("Access Token Error:", error);
    return null;
  }
}

/* ─────────────────────────────────────────────
   CHECK AUTH STATUS
───────────────────────────────────────────── */
export async function isAuthenticated() {
  try {

    const session = await fetchAuthSession();

    return !!session.tokens;

  } catch {
    return false;
  }
}