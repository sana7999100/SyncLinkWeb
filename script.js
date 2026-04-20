// --- FIREBASE IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- FIREBASE CONFIG ---
var firebaseConfig = {
  apiKey: "AIzaSyA3IoxFFqgbHGwfe_mS_UXkZA0GmQfrL_o",
  authDomain: "synclink-11d54.firebaseapp.com",
  projectId: "synclink-11d54",
  storageBucket: "synclink-11d54.firebasestorage.app",
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

// --- Fetch and display books -------------------
async function fetchBooks(url, containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  try {
    var res = await fetch(url);
    var data = await res.json();
    var books = data.works || data.docs || [];
    
    container.innerHTML = books.map(book => {
      // Build the URL to the Open Library reader
      const bookUrl = `https://openlibrary.org${book.key}`; 
      
      return `
      <div class="novel-card" onclick="saveActivity('${book.title}', 'history')">
        <a href="${bookUrl}" target="_blank" style="text-decoration:none; color:inherit;">
          <img src="https://openlibrary.org{book.cover_id || 240727}-M.jpg" alt="${book.title}">
          <p>${book.title}</p>
        </a>
        <button onclick="event.stopPropagation(); saveActivity('${book.title}', 'bookmarks')" style="font-size:10px">Bookmark</button>
      </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = "Error loading books.";
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
    content.innerHTML = bookm.length ? bookm.map(t => `<p>⭐ ${t}</p>`).join('') : "No bookmarks found.";
  } else if (type === 'novels') {
    title.innerText = "NOVEL LIST";
    fetchBooks(NEW_UPDATES, 'view-content');
  } else if (type === 'history') {
    title.innerText = "READING HISTORY";
    var hist = JSON.parse(localStorage.getItem('sync_history')) || [];
    content.innerHTML = hist.length ? hist.map(t => `<p>• ${t}</p>`).join('') : "No history found.";
  } else if (type === 'notifications') {
    title.innerText = "NOTIFICATIONS";
    content.innerHTML = "<p>No new notifications.</p>";
  } else if (type === 'genre') {
    title.innerText = "BLACK GENRE";
    fetchBooks("https://openlibrary.org/subjects/black.json?limit=10", 'view-content');
  } else if (type === 'comments') {
    title.innerText = "COMMENTS";
    content.innerHTML = "<p>No comments yet.</p>";
  } else if (type === 'reviews') {
    title.innerText = "REVIEWS";
    content.innerHTML = "<p>No reviews yet.</p>";
  }
}
window.showData = showData;

// --- Search function ---
async function searchNovels() {
  var query = document.getElementById('search-box').value;
  var container = document.getElementById('novel-slider');
  if (!query) return;
  try {
    var res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`);
    var data = await res.json();
    var books = data.docs || [];
    container.innerHTML = books.map(book => `
      <div class="novel-card" onclick="saveActivity('${book.title}', 'history')">
        <p>${book.title}</p>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = "Search failed.";
  }
}

// --- SIGN UP ---
var signupBtn = document.getElementById('signup-btn');
if (signupBtn) {
  signupBtn.addEventListener('click', function() {
    var email = document.getElementById('signup-email').value;
    var password = document.getElementById('signup-password').value;
    createUserWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        alert("Account created for " + userCredential.user.email);
      })
      .catch(err => {
        alert("Sign‑up failed: " + err.message);
      });
  });
}

// --- LOGIN ---
var loginBtn = document.getElementById('login-btn');
if (loginBtn) {
  loginBtn.addEventListener('click', function() {
    var email = document.getElementById('login-email').value;
    var password = document.getElementById('login-password').value;
    signInWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        alert("Logged in as " + userCredential.user.email);
      })
      .catch(err => {
        alert("Login failed: " + err.message);
      });
  });
}

// --- LOGOUT ---
var logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', function() {
    signOut(auth).then(() => {
      alert("Logged out!");
    }).catch(err => console.error(err));
  });
}

// --- USER STATE ---
var statusEl = document.getElementById('user-status');
if (statusEl) {
  onAuthStateChanged(auth, user => {
    if (user) {
      statusEl.innerText = "Logged in as " + user.email;
    } else {
      statusEl.innerText = "Not logged in";
    }
  });
}

// --- Notifications count ---
var notifEl = document.getElementById('notif-count');
if (notifEl) notifEl.innerText = "";

// --- Event listeners ---
var searchBtn = document.getElementById('search-btn');
if (searchBtn) searchBtn.addEventListener('click', searchNovels);

var trendingBtn = document.getElementById('trending-btn');
if (trendingBtn) trendingBtn.addEventListener('click', () => fetchBooks(TRENDING, 'ranking-list'));

var topWeekBtn = document.getElementById('topweek-btn');
if (topWeekBtn) topWeekBtn.addEventListener('click', () => fetchBooks(TOP_WEEK, 'ranking-list'));

// --- Initial load ---
fetchBooks(NEW_UPDATES, 'novel-slider');
showHistory();
