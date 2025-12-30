const firebaseConfig = {
  apiKey: "AIzaSyAUN9Pq8R4vlAVCk8KPo4rbFmvXY4DNJYA",
  authDomain: "jambex-4b02b.firebaseapp.com",
  projectId: "jambex-4b02b",
  storageBucket: "jambex-4b02b.firebasestorage.app",
  messagingSenderId: "283858497002",
  appId: "1:283858497002:web:8cadfb7d092898dda01693",
};

// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Set persistence to LOCAL (stays logged in across sessions)
setPersistence(auth, browserLocalPersistence);

// ========== DOM Elements ==========
const signInForm = document.getElementById("signin-form");
const signUpForm = document.getElementById("signup-form");
const showSignUpBtn = document.getElementById("show-signup");
const showSignInBtn = document.getElementById("show-signin");
const googleSignInBtn = document.getElementById("google-signin");
const googleSignUpBtn = document.getElementById("google-signup");

// ========== Form Switching ==========
showSignUpBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  signInForm.classList.remove("active");
  signUpForm.classList.add("active");
});

showSignInBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  signUpForm.classList.remove("active");
  signInForm.classList.add("active");
});

// ========== Password Visibility Toggle ==========
const passwordToggles = document.querySelectorAll(".password-toggle");

passwordToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const targetId = toggle.getAttribute("data-target");
    const passwordInput = document.getElementById(targetId);
    const icon = toggle.querySelector("i");

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      passwordInput.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  });
});

// ========== Password Strength Checker ==========
const signUpPasswordInput = document.getElementById("signup-password");
const strengthFill = document.querySelector(".strength-fill");
const strengthText = document.querySelector(".strength-text");

signUpPasswordInput?.addEventListener("input", (e) => {
  const password = e.target.value;
  const strength = calculatePasswordStrength(password);

  // Remove all strength classes
  strengthFill.classList.remove("weak", "medium", "strong");

  if (password.length === 0) {
    strengthFill.style.width = "0%";
    strengthText.textContent = "Password strength";
    return;
  }

  if (strength.score <= 2) {
    strengthFill.classList.add("weak");
    strengthText.textContent = "Weak password";
  } else if (strength.score <= 3) {
    strengthFill.classList.add("medium");
    strengthText.textContent = "Medium strength";
  } else {
    strengthFill.classList.add("strong");
    strengthText.textContent = "Strong password";
  }
});

function calculatePasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  return { score, maxScore: 5 };
}

// ========== Toast Notifications ==========
function showToast(message, type = "info") {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll(".toast");
  existingToasts.forEach((toast) => toast.remove());

  // Create toast element
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  // Icon mapping
  const icons = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    info: "fa-info-circle",
  };

  toast.innerHTML = `
    <i class="fas ${icons[type]} toast-icon"></i>
    <div class="toast-message">${message}</div>
  `;

  document.body.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.animation =
      "toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards";
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ========== Form Validation ==========
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateSignUpForm(
  name,
  email,
  password,
  confirmPassword,
  agreeTerms
) {
  if (!name || name.trim().length < 2) {
    showToast("Please enter your full name", "error");
    return false;
  }

  if (!validateEmail(email)) {
    showToast("Please enter a valid email address", "error");
    return false;
  }

  if (password.length < 6) {
    showToast("Password must be at least 6 characters long", "error");
    return false;
  }

  if (password !== confirmPassword) {
    showToast("Passwords do not match", "error");
    return false;
  }

  if (!agreeTerms) {
    showToast("Please agree to the Terms & Conditions", "error");
    return false;
  }

  return true;
}

function validateSignInForm(email, password) {
  if (!validateEmail(email)) {
    showToast("Please enter a valid email address", "error");
    return false;
  }

  if (!password || password.length < 6) {
    showToast("Please enter your password", "error");
    return false;
  }

  return true;
}

// ========== Sign Up Handler ==========
signUpForm?.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const agreeTerms = document.getElementById("agree-terms").checked;

  // Validate form
  if (!validateSignUpForm(name, email, password, confirmPassword, agreeTerms)) {
    return;
  }

  const submitBtn = e.target.querySelector(".auth-btn");
  const originalText = submitBtn.innerHTML;

  // Show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Creating account...';

  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: name,
      email: email,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });

    showToast("Account created successfully! Redirecting...", "success");

    // Redirect to home page
    setTimeout(() => {
      window.location.href = "/index.html";
    }, 1500);
  } catch (error) {
    console.error("Sign up error:", error);

    // Handle Firebase errors
    let errorMessage = "An error occurred. Please try again.";

    if (error.code === "auth/email-already-in-use") {
      errorMessage =
        "This email is already registered. Please sign in instead.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address.";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password is too weak. Please use a stronger password.";
    }

    showToast(errorMessage, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
});

// ========== Sign In Handler ==========
signInForm?.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("signin-email").value.trim();
  const password = document.getElementById("signin-password").value;

  // Validate form
  if (!validateSignInForm(email, password)) {
    return;
  }

  const submitBtn = e.target.querySelector(".auth-btn");
  const originalText = submitBtn.innerHTML;

  // Show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading"></span> Signing in...';

  try {
    // Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Update last login time
    await setDoc(
      doc(db, "users", user.uid),
      {
        lastLogin: serverTimestamp(),
      },
      { merge: true }
    );

    showToast("Sign in successful! Redirecting...", "success");

    // Redirect to home page
    setTimeout(() => {
      window.location.href = "/index.html";
    }, 1500);
  } catch (error) {
    console.error("Sign in error:", error);

    // Handle Firebase errors
    let errorMessage = "An error occurred. Please try again.";

    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/invalid-credential"
    ) {
      errorMessage = "Invalid email or password. Please try again.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address.";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many failed attempts. Please try again later.";
    }

    showToast(errorMessage, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
});

// ========== Google Sign-In Handler ==========
async function handleGoogleAuth() {
  try {
    // Sign in with Google popup
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user document exists in Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      // Create new user document for first-time Google sign-in
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
    } else {
      // Update last login for existing user
      await setDoc(
        doc(db, "users", user.uid),
        {
          lastLogin: serverTimestamp(),
        },
        { merge: true }
      );
    }

    showToast("Google sign in successful! Redirecting...", "success");

    // Redirect to home page
    setTimeout(() => {
      window.location.href = "/index.html";
    }, 1500);
  } catch (error) {
    console.error("Google sign-in error:", error);

    let errorMessage = "Google sign-in failed. Please try again.";

    if (error.code === "auth/popup-closed-by-user") {
      errorMessage = "Sign-in cancelled.";
    } else if (error.code === "auth/popup-blocked") {
      errorMessage = "Pop-up was blocked. Please allow pop-ups and try again.";
    }

    showToast(errorMessage, "error");
  }
}

googleSignInBtn?.addEventListener("click", handleGoogleAuth);
googleSignUpBtn?.addEventListener("click", handleGoogleAuth);

// ========== Forgot Password Handler ==========
const forgotPasswordLink = document.querySelector(".forgot-password");
forgotPasswordLink?.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.getElementById("signin-email").value.trim();

  if (!email) {
    showToast("Please enter your email address first", "info");
    return;
  }

  if (!validateEmail(email)) {
    showToast("Please enter a valid email address", "error");
    return;
  }

  try {
    // Send password reset email
    await sendPasswordResetEmail(auth, email);

    showToast("Password reset email sent! Check your inbox.", "success");
  } catch (error) {
    console.error("Password reset error:", error);
    showToast("Failed to send reset email. Please try again.", "error");
  }
});

// Monitor authentication state - redirect if already signed in
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, redirect to home page
    window.location.href = "/index.html";
  }
});

// ========== Dynamic Copyright Year ==========
const copyRightElement = document.querySelector(".copyRight");
if (copyRightElement) {
  copyRightElement.textContent = `${new Date().getFullYear()}`;
}
