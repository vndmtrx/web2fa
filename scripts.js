"use strict";

/*
 * Criptography and Session Storage
 */

function decrypt() {
  let hash = document.getElementById("hash-name").value;
  let pwd = document.getElementById("pwd").value;
  deriveKey(hash, pwd).then(key => {
    window.sessionStorage.setItem("key", key);
    document.getElementById("tab2").disabled = false;
  });
}

function clearSession() {
  window.sessionStorage.clear();
  document.getElementById("tab2").disabled = true;
}

function deriveKey(hash, password) {
  let salt = "correct horse battery staple";
  let iterations = 1000;

  // First, create a PBKDF2 "key" containing the password
  return window.crypto.subtle.importKey("raw", new TextEncoder("utf-8").encode(password), {
      name: "PBKDF2"
    }, false, ["deriveKey"])
    // Derive a key from the password
    .then(baseKey => {
      return window.crypto.subtle.deriveKey({
          name: "PBKDF2",
          salt: new TextEncoder("utf-8").encode(salt),
          iterations: iterations,
          hash: hash
        },
        baseKey, {
          name: "AES-CBC",
          length: 128
        }, // Key we want
        true, // Extrable
        ["encrypt", "decrypt"] // For new key
      );
    })
    // Export it so we can display it
    .then(aesKey => window.crypto.subtle.exportKey("raw", aesKey))
    // Display it in hex format
    .then(keyBytes => hex(keyBytes))
    .catch((err) => {
      alert("Key derivation failed: " + err.message);
    });
}

/*
 * TOTP related functions
 */

function refresh() {
  var e = Math.floor(new Date().getTime() / 1000);
  var t = Math.floor(e / 30);
  var en = new Date().getTime() / 1000;

  var rem = 30 - (en - (t * 30));
  var percent = (rem / 30) * 100;
  return percent;
}

function addToStorage(name, secret) {
  var codes = JSON.parse(sessionStorage.getItem("allCodes"));
  if (codes == null) {
    codes = [];
  }
  codes.push({"secret": secret, "name": name});
  sessionStorage.setItem("allCodes", JSON.stringify(codes));
}

function addKey(event) {
  event.preventDefault();
  let secret = document.getElementById("secret").value;
  let name = document.getElementById("name").value;
  addToStorage(name, secret);
}

/*
 * Auxiliary functions
 */

function hex(buffer) {
  return [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join('');
}

function sha(hashtype, str) {
  return crypto.subtle.digest(hashtype, new TextEncoder("utf-8").encode(str)).then(hash => hex(hash));
}

function storageAvailable(type) {
  var storage;
  try {
    navigator.storage.persist().then(() => console.log('Persisted storage granted.'));
    storage = window[type];
    var x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return e instanceof DOMException && (
        // everything except Firefox
        e.code === 22 ||
        // Firefox
        e.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        e.name === 'QuotaExceededError' ||
        // Firefox
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // acknowledge QuotaExceededError only if there's something already stored
      (storage && storage.length !== 0);
  }
}

/*
 * Page manipulation scripts
 */

document.addEventListener("DOMContentLoaded", function() {

  // Check that web crypto is even available
  if (!window.crypto || !window.crypto.subtle) {
    alert("Your browser does not support the Web Cryptography API! This page will not work.");
    return;
  }

  // Check that encoding API is also available
  if (!window.TextEncoder || !window.TextDecoder) {
    alert("Your browser does not support the Encoding API! This page will not work.");
    return;
  }

  // Check that storage API is also available
  if (!storageAvailable('localStorage') || !storageAvailable('sessionStorage')) {
    alert("Your browser does not have LocalStorage supported and available! This page will not work.");
    return;
  }

  document.getElementById("decrypt").addEventListener("click", decrypt);
  document.getElementById("clear").addEventListener("click", clearSession);
  document.getElementById("input-keys").addEventListener("submit", addKey);

  setInterval(() => {
    document.getElementById("timer").setAttribute('value', refresh());
  }, 1000);
});
