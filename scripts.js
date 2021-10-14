"use strict";

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

  if (!storageAvailable('localStorage') || !storageAvailable('sessionStorage')) {
    alert("Your browser does not have LocalStorage supported and available! This page will not work.");
    return;
  }

  document.getElementById("decrypt").addEventListener("click", decrypt);
  document.getElementById("clear").addEventListener("click", clearSession);
});

function decrypt() {
  let hash = document.getElementById("hash-name").value;
  let pwd = document.getElementById("pwd").value;
  deriveKey(hash, pwd).then((key) => {
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
    .then((baseKey) => {
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
    .then((aesKey) => {
      return window.crypto.subtle.exportKey("raw", aesKey);
    })
    // Display it in hex format
    .then((keyBytes) => {
      return [...new Uint8Array(keyBytes)].map(x => x.toString(16).padStart(2, '0')).join('');
    })
    .catch((err) => {
      alert("Key derivation failed: " + err.message);
    });
}

function storageAvailable(type) {
  var storage;
  try {
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
