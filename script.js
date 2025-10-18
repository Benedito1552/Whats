import { app, db, auth } from "./firebase-config.js";
import { 
  collection, addDoc, onSnapshot, query, orderBy, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Elementos
const loginScreen = document.getElementById("login-screen");
const chatScreen = document.getElementById("chat-screen");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const logoutBtn = document.getElementById("logout-btn");
const sendBtn = document.getElementById("send-btn");
const msgInput = document.getElementById("message-input");
const messagesDiv = document.getElementById("messages");
const userNameEl = document.getElementById("user-name");

let currentUser = null;

// === Login / Registro ===
registerBtn.onclick = async () => {
  try {
    await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    alert("Usuário cadastrado!");
  } catch (err) {
    alert(err.message);
  }
};

loginBtn.onclick = async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (err) {
    alert(err.message);
  }
};

logoutBtn.onclick = async () => {
  await signOut(auth);
};

// === Estado da sessão ===
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loginScreen.style.display = "none";
    chatScreen.style.display = "flex";
    userNameEl.textContent = user.email;
    listenMessages();
  } else {
    currentUser = null;
    chatScreen.style.display = "none";
    loginScreen.style.display = "block";
  }
});

// === Enviar mensagem ===
sendBtn.onclick = async () => {
  const text = msgInput.value.trim();
  if (text === "") return;
  await addDoc(collection(db, "messages"), {
    text,
    from: currentUser.email,
    timestamp: serverTimestamp()
  });
  msgInput.value = "";
};

// === Receber mensagens em tempo real ===
function listenMessages() {
  const q = query(collection(db, "messages"), orderBy("timestamp"));
  onSnapshot(q, (snapshot) => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(doc => {
      const msg = doc.data();
      const div = document.createElement("div");
      div.classList.add("message");
      div.classList.add(msg.from === currentUser.email ? "sent" : "received");
      div.textContent = `${msg.from}: ${msg.text}`;
      messagesDiv.appendChild(div);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}