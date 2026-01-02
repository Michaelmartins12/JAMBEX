import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  limit,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUN9Pq8R4vlAVCk8KPo4rbFmvXY4DNJYA",
  authDomain: "jambex-4b02b.firebaseapp.com",
  projectId: "jambex-4b02b",
  storageBucket: "jambex-4b02b.firebasestorage.app",
  messagingSenderId: "283858497002",
  appId: "1:283858497002:web:8cadfb7d092898dda01693",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
window.db = db; // Make DB globally accessible
window.fs = { collection, addDoc, getDocs, query, where, limit }; // Expose helpers

// DOM Elements
// DOM Elements
const signinBtn = document.getElementById("signin-btn");
const userProfile = document.getElementById("user-profile");
const usernameDisplay = document.getElementById("username-display");
const signoutBtn = document.getElementById("signout-btn");
const hamburgerBtn = document.getElementById("hamburger-btn");
const authSection = document.getElementById("auth-section");

// ========== Mobile Menu Toggle ==========
hamburgerBtn?.addEventListener("click", () => {
  authSection.classList.toggle("mobile-visible");

  // Toggle icon between bars and times
  const icon = hamburgerBtn.querySelector("i");
  if (authSection.classList.contains("mobile-visible")) {
    icon.classList.remove("fa-bars");
    icon.classList.add("fa-times");
  } else {
    icon.classList.remove("fa-times");
    icon.classList.add("fa-bars");
  }
});

// ========== Toast Notification ==========
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
window.showToast = showToast;

// ========== Authentication State Listener ==========
onAuthStateChanged(auth, async (user) => {
  const currentPath = window.location.pathname;

  if (user) {
    // If user is on the auth page while signed in, send them to home
    if (currentPath.endsWith("/auth.html") || currentPath === "/auth.html") {
      window.location.href = "/index.html";
      return;
    }

    // User is signed in: show profile
    console.log("User is signed in:", user.email);
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const displayName =
        (userDoc.exists() && userDoc.data().name) ||
        user.displayName ||
        user.email.split("@")[0];

      usernameDisplay.textContent = displayName;
      userProfile.style.display = "flex";
      signinBtn.style.display = "none";
    } catch (error) {
      console.error("Error fetching user data:", error);
      const displayName = user.displayName || user.email.split("@")[0];
      usernameDisplay.textContent = displayName;
      userProfile.style.display = "flex";
      signinBtn.style.display = "none";
    }
  } else {
    // User is signed out
    console.log("User is signed out");

    // If the user is on the home page (index) redirect to auth page
    if (
      currentPath === "/" ||
      currentPath.endsWith("/index.html") ||
      currentPath === "/index.html"
    ) {
      window.location.href = "/auth.html";
      return;
    }

    // Otherwise, show sign-in button and hide profile
    userProfile.style.display = "none";
    signinBtn.style.display = "block";
  }
});

// ========== Sign Out Handler ==========
signoutBtn?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    showToast("Successfully signed out!", "success");

    // Redirect to auth page after a short delay
    setTimeout(() => {
      window.location.href = "/auth.html";
    }, 1500);
  } catch (error) {
    console.error("Sign out error:", error);
    showToast("Failed to sign out. Please try again.", "error");
  }
});
