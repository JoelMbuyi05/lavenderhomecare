// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBv1BnjXweYE8ihcqxPForYXrs5GawEky0",
  authDomain: "lavender-home-care.firebaseapp.com",
  projectId: "lavender-home-care",
  storageBucket: "lavender-home-care.firebasestorage.app",
  messagingSenderId: "1037202927397",
  appId: "1:1037202927397:web:2449da8ff8df1eb436f4cc"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

console.log('Firebase initialized successfully!');