import { initializeApp } from "https://gstatic.com";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://gstatic.com";
import { getFirestore } from "https://gstatic.com";

var firebaseConfig = {
  apiKey: "AIzaSyA3IoxFFqgbHGwfe_mS_UXkZA0GmQfrL_o",
  authDomain: "://firebaseapp.com",
  projectId: "synclink-11d54",
  storageBucket: "synclink-11d54.firebasestorage.app",
  messagingSenderId: "304027366809",
  appId: "1:304027366809:web:f817b677b157e4274d8f08",
  measurementId: "G-RYLTVTC73P"
};

var app = initializeApp(firebaseConfig);
var auth = getAuth(app);
var db = getFirestore(app);

var NEW_UPDATES = "https://openlibrary.org";
var TRENDING = "https://openlibrary.org";
var TOP_WEEK = "https://openlibrary.org";

// --- Main function to show books ---
async function fetchBooks(url, containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  try {
    var res = await fetch(url);
    var data = await res.json();
    var books = data.works || data.docs || [];
    container.innerHTML = books.map(book => {
      // Use cover_id OR cover_i and provide a fallback image
      const id = book.cover_id || book.cover_i;
      const img = id ? `https://openlibrary.org{id}-M.jpg` : `https://placeholder.com`;
      const link = `https://openlibrary.org${book.key}`;

      return `
        <div class="novel-card" onclick="saveActivity('${book.title}', 'history')">
          <a href="${link}" target="_blank" style="text-decoration:none; color:inherit;">
            <img src="${img}" alt="${book.title}">
            <p>${book.title}</p>
          </a>
          <button onclick="event.stopPropagation(); saveActivity('${book.title}', 'bookmarks')" style="font-size:10px">Bookmark</button>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = "Error loading books.";
    console.error(err);
  }
}

// --- Fixed Search Function ---
async function searchNovels() {
  var query = document.getElementById('search-box').value;
  var container = document.getElementById('novel-slider'); // Targets the main slider area
  if (!query) return;
  
  container.innerHTML = "Searching...";
  
  try {
    var res = await fetch(`https://openlibrary.org{encodeURIComponent(query)}&limit=10`);
    var data = await res.json();
    var books = data.docs || [];
    
    if (books.length === 0) {
        container.innerHTML = "No books found.";
        return;
    }

    container.innerHTML = books.map(book => {
      const id = book.cover_i || book.cover_id;
      const img = id ? `https://openlibrary.org{id}-M.jpg` : `https://placeholder.com`;
      const link = `https://openlibrary.org${book.key}`;

      return `
        <div class="novel-card" onclick="saveActivity('${book.title}', 'history')">
          <a href="${link}" target="_blank" style="text-decoration:none; color:inherit;">
            <img src="${img}" alt="${book.title}">
            <p>${book.title}</p>
          </a>
          <button onclick="event.stopPropagation(); saveActivity('${book.title}', 'bookmarks')" style="font-size:10px">Bookmark</button>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = "Search failed. Check your connection.";
    console.error(err);
  }
}

// --- Save & Profile Logic ---
function saveActivity(title, type) {
  var key = type === 'history' ? 'sync_history' : 'sync_bookmarks';
  var data = JSON.parse(localStorage.getItem(key)) || [];
  if (!data.includes(title)) {
    data.push(title);
    localStorage.setItem(key, JSON.stringify(data));
  }
  if (type === 'history') showHistory();
}

function showHistory() {
  var hist = JSON.parse(localStorage.getItem('sync_history')) || [];
  var container = document.getElementById('history-list');
  if (container) {
    container.innerHTML = hist.length ? hist.map(t => `<p>• ${t}</p>`).join('') : "No history yet.";
  }
}

function showData(type) {
  var content = document.getElementById('view-content');
  var title = document.getElementById('view-title');
  if (!content || !title) return;

  if (type === 'profile') {
    title.innerText = "PROFILE";
    content.innerHTML = `<p>Logged in as: ${auth.currentUser ? auth.currentUser.email : 'Guest'}</p>`;
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
  }
}

// --- Firebase Auth Logic ---
const signupBtn = document.getElementById('signup-btn');
if (signupBtn) {
  signupBtn.onclick = () => {
    const email = document.getElementById('signup-email').value;
    const pass = document.getElementById('signup-password').value;
    createUserWithEmailAndPassword(auth, email, pass)
      .then(() => alert("Success! Account created."))
      .catch(err => alert(err.message));
  };
}

const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
  loginBtn.onclick = () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    signInWithEmailAndPassword(auth, email, pass)
      .then(() => alert("Logged in!"))
      .catch(err => alert(err.message));
  };
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.onclick = () => {
    signOut(auth).then(() => alert("Logged out!"));
  };
}

onAuthStateChanged(auth, user => {
  const status = document.getElementById('user-status');
  if (status) status.innerText = user ? `Logged in as ${user.email}` : "Not logged in";
});

// --- GLOBAL EXPORTS (Crucial for HTML Buttons) ---
window.saveActivity = saveActivity;
window.showData = showData;
window.searchNovels = searchNovels;
window.fetchBooks = fetchBooks;

// --- Initial Load ---
fetchBooks(NEW_UPDATES, 'novel-slider');
showHistory();

// Event listeners for Ranking buttons
document.getElementById('trending-btn')?.addEventListener('click', () => fetchBooks(TRENDING, 'ranking-list'));
document.getElementById('topweek-btn')?.addEventListener('click', () => fetchBooks(TOP_WEEK, 'ranking-list'));
document.getElementById('search-btn')?.addEventListener('click', searchNovels);
