import { app, db, auth } from "./firebase-config.js";
import {
  collection, addDoc, onSnapshot, query, where, orderBy,
  serverTimestamp, setDoc, doc, getDoc, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Elementos DOM
const loginScreen = document.getElementById("login-screen");
const chatScreen = document.getElementById("chat-screen");
const contactsDiv = document.getElementById("contacts");
const messagesDiv = document.getElementById("messages");
const chatHeader = document.getElementById("chat-header");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const logoutBtn = document.getElementById("logout-btn");
const sendBtn = document.getElementById("send-btn");
const msgInput = document.getElementById("message-input");
const userNameEl = document.getElementById("user-name");

let currentUser = null;
let selectedContact = null;
let unsubscribeMessages = null;

// === Cadastro ===
registerBtn.onclick = async () => {
  try {
    const userCred = await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    await setDoc(doc(db, "users", userCred.user.uid), {
      email: userCred.user.email,
      createdAt: serverTimestamp()
    });
    alert("Usuário cadastrado com sucesso!");
  } catch (err) {
    alert("Erro: " + err.message);
  }
};

// === Login ===
loginBtn.onclick = async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (err) {
    alert("Erro: " + err.message);
  }
};

// === Logout ===
logoutBtn.onclick = async () => {
  await signOut(auth);
};

// === Sessão ===
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loginScreen.style.display = "none";
    chatScreen.style.display = "block";
    userNameEl.textContent = user.email;
    loadContacts();
  } else {
    currentUser = null;
    chatScreen.style.display = "none";
    loginScreen.style.display = "block";
  }
});

// === Carregar contatos ===
async function loadContacts() {
  const q = query(collection(db, "users"));
  const snapshot = await getDocs(q);
  contactsDiv.innerHTML = "";
  snapshot.forEach(docSnap => {
    const user = docSnap.data();
    if (user.email !== currentUser.email) {
      const div = document.createElement("div");
      div.classList.add("contact");
      div.textContent = user.email;
      div.onclick = () => openChatWith(user);
      contactsDiv.appendChild(div);
    }
  });
}

// === Abrir chat com outro usuário ===
async function openChatWith(user) {
  selectedContact = user;
  chatHeader.textContent = "Conversando com: " + user.email;
  messagesDiv.innerHTML = "";

  if (unsubscribeMessages) unsubscribeMessages();

  const chatId = getChatId(currentUser.uid, user.uid);

  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp"));
  unsubscribeMessages = onSnapshot(q, (snapshot) => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(docSnap => {
      const msg = docSnap.data();
      const div = document.createElement("div");
      div.classList.add("message");
      div.classList.add(msg.from === currentUser.uid ? "sent" : "received");
      div.textContent = msg.text;
      messagesDiv.appendChild(div);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

// === Enviar mensagem ===
sendBtn.onclick = async () => {
  if (!selectedContact) return alert("Selecione um contato primeiro!");
  const text = msgInput.value.trim();
  if (text === "") return;

  const chatId = getChatId(currentUser.uid, selectedContact.uid || selectedContact.id);

  await addDoc(collection(db, "chats", chatId, "messages"), {
    text,
    from: currentUser.uid,
    timestamp: serverTimestamp()
  });
  msgInput.value = "";
};

// === Função util: gerar ID único do chat 1:1 ===
function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}
