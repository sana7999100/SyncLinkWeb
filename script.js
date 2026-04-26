// firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// firebase setup
var firebaseConfig = {
  apiKey: "AIzaSyA3IoxFFqgbHGwfe_mS_UXkZA0GmQfrL_o",
  authDomain: "synclink-11d54.firebaseapp.com",
  projectId: "synclink-11d54",
  storageBucket: "synclink-11d54.firebasestorage.app",
  messagingSenderId: "304027366809",
  appId: "1:304027366809:web:f817b677b157e4274d8f08",
  measurementId: "G-RYLTVTC73P"
};

var app = initializeApp(firebaseConfig);
var auth = getAuth(app);
var db = getFirestore(app);

// api links
var NEW_UPDATES = "https://openlibrary.org/subjects/fantasy.json?limit=10";
var TRENDING = "https://openlibrary.org/trending/daily.json";
var TOP_WEEK = "https://openlibrary.org/trending/weekly.json";

// this function fetches books from open library and shows them in a container
async function fetchBooks(url, containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "Loading...";

  try {
    var res = await fetch(url);
    var data = await res.json();
    var books = data.works || data.docs || [];

    if (books.length === 0) {
      container.innerHTML = "No books found.";
      return;
    }

    var html = "";
    for (var i = 0; i < books.length; i++) {
      var book = books[i];
      var title = book.title || "No Title";
      // subjects endpoint uses cover_id, trending endpoint uses cover_i
      var coverId = book.cover_id || book.cover_i || "";
      var imgUrl = coverId
        ? "https://covers.openlibrary.org/b/id/" + coverId + "-M.jpg"
        : "https://via.placeholder.com/130x180?text=No+Cover";

      // encode title so apostrophes dont break the onclick
      var safeTitle = encodeURIComponent(title);

      html += '<div class="novel-card" onclick="saveActivity(decodeURIComponent(\'' + safeTitle + '\'), \'history\')">';
      html += '<img src="' + imgUrl + '" alt="' + title + '">';
      html += '<p>' + title + '</p>';
      html += '<button onclick="event.stopPropagation(); saveActivity(decodeURIComponent(\'' + safeTitle + '\'), \'bookmarks\')">Bookmark</button>';
      html += '</div>';
    }

    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = "Error loading books.";
    console.error(err);
  }
}

// saves a book title to history or bookmarks in localStorage
function saveActivity(title, type) {
  var key = type === "history" ? "sync_history" : "sync_bookmarks";
  var data = JSON.parse(localStorage.getItem(key)) || [];

  if (!data.includes(title)) {
    data.push(title);
    localStorage.setItem(key, JSON.stringify(data));
  }

  if (type === "history") {
    showHistory();
  }
}

// shows reading history on the main page
function showHistory() {
  var hist = JSON.parse(localStorage.getItem("sync_history")) || [];
  var container = document.getElementById("history-list");
  if (!container) return;

  if (hist.length === 0) {
    container.innerHTML = "<p style='padding:0 20px; color:#95a5a6; font-size:13px;'>No history yet.</p>";
  } else {
    var html = "";
    for (var i = 0; i < hist.length; i++) {
      html += "<p>• " + hist[i] + "</p>";
    }
    container.innerHTML = html;
  }
}

// search novels using open library search api
async function searchNovels() {
  var query = document.getElementById("search-box").value.trim();
  if (!query) return;

  // show search section and hide new updates while searching
  var searchSection = document.getElementById("search-section");
  var searchResults = document.getElementById("search-results");
  if (!searchResults) return;

  if (searchSection) searchSection.style.display = "block";
  searchResults.innerHTML = "Searching...";

  try {
    var res = await fetch("https://openlibrary.org/search.json?q=" + encodeURIComponent(query) + "&limit=10");
    var data = await res.json();
    var books = data.docs || [];

    if (books.length === 0) {
      searchResults.innerHTML = "No results found for: " + query;
      return;
    }

    var html = "";
    for (var i = 0; i < books.length; i++) {
      var book = books[i];
      var title = book.title || "No Title";
      // search endpoint uses cover_i (not cover_id)
      var coverId = book.cover_i || "";
      var imgUrl = coverId
        ? "https://covers.openlibrary.org/b/id/" + coverId + "-M.jpg"
        : "https://via.placeholder.com/130x180?text=No+Cover";

      var safeTitle = encodeURIComponent(title);

      html += '<div class="novel-card" onclick="saveActivity(decodeURIComponent(\'' + safeTitle + '\'), \'history\')">';
      html += '<img src="' + imgUrl + '" alt="' + title + '">';
      html += '<p>' + title + '</p>';
      html += '<button onclick="event.stopPropagation(); saveActivity(decodeURIComponent(\'' + safeTitle + '\'), \'bookmarks\')">Bookmark</button>';
      html += '</div>';
    }

    searchResults.innerHTML = html;

  } catch (err) {
    searchResults.innerHTML = "Search failed. Please try again.";
    console.error(err);
  }
}

// profile page - show different data based on which menu button was clicked
function showData(type) {
  var content = document.getElementById("view-content");
  var title = document.getElementById("view-title");
  if (!content || !title) return;

  // update active button style
  var buttons = document.querySelectorAll(".menu-item");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove("active");
  }
  event.target.classList.add("active");

  if (type === "profile") {
    title.innerText = "PROFILE";
    var user = auth.currentUser;
    if (user) {
      content.innerHTML = "<p>Email: " + user.email + "</p><p>User ID: " + user.uid + "</p>";
    } else {
      content.innerHTML = "<p>You are not logged in. Please login first.</p>";
    }

  } else if (type === "bookmarks") {
    title.innerText = "YOUR BOOKMARKS";
    var bookm = JSON.parse(localStorage.getItem("sync_bookmarks")) || [];
    if (bookm.length === 0) {
      content.innerHTML = "<p>No bookmarks found.</p>";
    } else {
      var html = "";
      for (var i = 0; i < bookm.length; i++) {
        html += "<p>⭐ " + bookm[i] + "</p>";
      }
      content.innerHTML = html;
    }

  } else if (type === "novels") {
    title.innerText = "NOVEL LIST";
    content.innerHTML = '<div class="slider" id="view-content-slider">Loading...</div>';
    fetchBooks(NEW_UPDATES, "view-content-slider");

  } else if (type === "history") {
    title.innerText = "READING HISTORY";
    var hist = JSON.parse(localStorage.getItem("sync_history")) || [];
    if (hist.length === 0) {
      content.innerHTML = "<p>No history found.</p>";
    } else {
      var html = "";
      for (var i = 0; i < hist.length; i++) {
        html += "<p>• " + hist[i] + "</p>";
      }
      content.innerHTML = html;
    }

  } else if (type === "notifications") {
    title.innerText = "NOTIFICATIONS";
    content.innerHTML = "<p>No new notifications.</p>";

  } else if (type === "genre") {
    title.innerText = "BLACK GENRE";
    content.innerHTML = '<div class="slider" id="view-content-slider">Loading...</div>';
    fetchBooks("https://openlibrary.org/subjects/black.json?limit=10", "view-content-slider");

  } else if (type === "comments") {
    title.innerText = "COMMENTS";
    content.innerHTML = "<p>No comments yet.</p>";

  } else if (type === "reviews") {
    title.innerText = "REVIEWS";
    content.innerHTML = "<p>No reviews yet.</p>";
  }
}

// make showData available globally so the onclick in html can use it
window.showData = showData;
window.saveActivity = saveActivity;

// sign up button
var signupBtn = document.getElementById("signup-btn");
if (signupBtn) {
  signupBtn.addEventListener("click", function() {
    var email = document.getElementById("signup-email").value.trim();
    var password = document.getElementById("signup-password").value.trim();

    if (!email || !password) {
      alert("Please fill in both email and password.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then(function(userCredential) {
        alert("Account created for " + userCredential.user.email);
      })
      .catch(function(err) {
        alert("Sign up failed: " + err.message);
      });
  });
}

// login button
var loginBtn = document.getElementById("login-btn");
if (loginBtn) {
  loginBtn.addEventListener("click", function() {
    var email = document.getElementById("login-email").value.trim();
    var password = document.getElementById("login-password").value.trim();

    if (!email || !password) {
      alert("Please fill in both email and password.");
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then(function(userCredential) {
        alert("Logged in as " + userCredential.user.email);
      })
      .catch(function(err) {
        alert("Login failed: " + err.message);
      });
  });
}

// logout button
var logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", function() {
    signOut(auth)
      .then(function() {
        alert("You have been logged out.");
      })
      .catch(function(err) {
        console.error(err);
      });
  });
}

// this watches if user is logged in or not and updates the status text
var statusEl = document.getElementById("user-status");
if (statusEl) {
  onAuthStateChanged(auth, function(user) {
    if (user) {
      statusEl.innerText = "Logged in as " + user.email;
    } else {
      statusEl.innerText = "Not logged in";
    }
  });
}

// notification count (empty for now)
var notifEl = document.getElementById("notif-count");
if (notifEl) notifEl.innerText = "";

// search button click
var searchBtn = document.getElementById("search-btn");
if (searchBtn) {
  searchBtn.addEventListener("click", searchNovels);
}

// also search when user presses Enter key
var searchBox = document.getElementById("search-box");
if (searchBox) {
  searchBox.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      searchNovels();
    }
  });
}

// trending tab button
var trendingBtn = document.getElementById("trending-btn");
if (trendingBtn) {
  trendingBtn.addEventListener("click", function() {
    document.getElementById("trending-btn").classList.add("active");
    document.getElementById("topweek-btn").classList.remove("active");
    fetchBooks(TRENDING, "ranking-list");
  });
}

// top week tab button
var topWeekBtn = document.getElementById("topweek-btn");
if (topWeekBtn) {
  topWeekBtn.addEventListener("click", function() {
    document.getElementById("topweek-btn").classList.add("active");
    document.getElementById("trending-btn").classList.remove("active");
    fetchBooks(TOP_WEEK, "ranking-list");
  });
}

// load everything when page first opens
fetchBooks(NEW_UPDATES, "novel-slider");
fetchBooks(TRENDING, "ranking-list");
showHistory();
