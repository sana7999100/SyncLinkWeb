// --- FIREBASE IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- FIREBASE CONFIG ---
var firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "synclink-11d54.firebaseapp.com",
  projectId: "synclink-11d54",
  storageBucket: "synclink-11d54.appspot.com",
  messagingSenderId: "304027366809",
  appId: "1:304027366809:web:f817b677b157e4274d8f08",
  measurementId: "G-RYLTVTC73P" 
};

// --- INIT FIREBASE ---
var app = initializeApp(firebaseConfig);
var auth = getAuth(app);
var db = getFirestore(app);

// --- OPEN LIBRARY API ENDPOINTS ---
var NEW_UPDATES = "https://openlibrary.org/subjects/fantasy.json?limit=10";
var TRENDING = "https://openlibrary.org/trending/daily.json";
var TOP_WEEK = "https://openlibrary.org/trending/weekly.json";

// --- Fetch and display books ---
async function fetchBooks(url, containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  try {
    var res = await fetch(url);
    var data = await res.json();
    var books = data.works || data.docs || [];
    container.innerHTML = books.map(book => `
      <div class="novel-card" onclick="saveActivity('${book.title}', 'history')">
        <img src="https://covers.openlibrary.org/b/id/${book.cover_id || 240727}-M.jpg" alt="${book.title}">
        <p>${book.title}</p>
        <button onclick="event.stopPropagation(); saveActivity('${book.title}', 'bookmarks')" style="font-size:10px">Bookmark</button>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = "Error loading books.";
    console.error(err);
  }
}

// --- Save activity to localStorage ---
function saveActivity(title, type) {
  var key = type === 'history' ? 'sync_history' : 'sync_bookmarks';
  var data = JSON.parse(localStorage.getItem(key)) || [];
  if (!data.includes(title)) {
    data.push(title);
    localStorage.setItem(key, JSON.stringify(data));
  }
  if (type === 'history') showHistory();
}

// --- Show history ---
function showHistory() {
  var hist = JSON.parse(localStorage.getItem('sync_history')) || [];
  var container = document.getElementById('history-list');
  if (container) {
    container.innerHTML = hist.length ? hist.map(t => `<p>• ${t}</p>`).join('') : "No history yet.";
  }
}

// --- Profile page menu logic ---
function showData(type) {
  var content = document.getElementById('view-content');
  var title = document.getElementById('view-title');
  if (!content || !title) return;

  if (type === 'profile') {
    title.innerText = "PROFILE";
    content.innerHTML = "<p>User profile info here.</p>";
  } else if (type === 'bookmarks') {
    var bookm = JSON.parse(localStorage.getItem('sync_bookmarks')) || [];
    title.innerText = "YOUR BOOKMARKS";
    content.innerHTML = bookm.length ? bookm.map(t => `<p>⭐ ${t}</p>`).join('') :