/* ============================================
   JAMBEX INDEX PAGE - AUTHENTICATION HANDLER
   Handles user authentication state & sign-out
   ============================================ */

// Import Firebase modules
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

// DOM Elements
const signinBtn = document.getElementById("signin-btn");
const userProfile = document.getElementById("user-profile");
const usernameDisplay = document.getElementById("username-display");
const signoutBtn = document.getElementById("signout-btn");

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
    toast.style.animation = "slideInRight 0.3s reverse";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ========== Authentication State Listener ==========
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in
    console.log("User is signed in:", user.email);

    // Get user data from Firestore
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const displayName =
          userData.name || user.displayName || user.email.split("@")[0];

        // Show user profile, hide sign-in button
        usernameDisplay.textContent = displayName;
        userProfile.style.display = "flex";
        signinBtn.style.display = "none";
      } else {
        // No user document found, use email
        const displayName = user.displayName || user.email.split("@")[0];
        usernameDisplay.textContent = displayName;
        userProfile.style.display = "flex";
        signinBtn.style.display = "none";
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Fallback to email
      const displayName = user.displayName || user.email.split("@")[0];
      usernameDisplay.textContent = displayName;
      userProfile.style.display = "flex";
      signinBtn.style.display = "none";
    }
  } else {
    // User is signed out
    console.log("User is signed out");

    // Show sign-in button, hide user profile
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

console.log(
  "%c🎓 JambeX Index Ready!",
  "color: #1E90FF; font-size: 16px; font-weight: bold;"
);
