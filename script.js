// === Importar módulos Firebase ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot, query, where, orderBy,
  serverTimestamp, setDoc, doc, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// === Configuração do Firebase ===
const firebaseConfig = {
  apiKey: "AIzaSyC0dUhymi72gkug-oo0-xqqBEtgvlIgvY0",
  authDomain: "cursos-6f950.firebaseapp.com",
  projectId: "cursos-6f950",
  storageBucket: "cursos-6f950.firebasestorage.app",
  messagingSenderId: "146131122545",
  appId: "1:146131122545:web:043f8207f457ad5b7f5ed0"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// === Elementos DOM ===
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
let selectedUser = null;
let unsubscribeMessages = null;

// === Cadastro ===
registerBtn.onclick = async () => {
  try {
    const userCred = await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    await setDoc(doc(db, "users", userCred.user.uid), {
      uid: userCred.user.uid,
      email: userCred.user.email,
      createdAt: serverTimestamp()
    });
    alert("Usuário cadastrado com sucesso!");
  } catch (err) {
    alert("Erro no cadastro: " + err.message);
  }
};

// === Login ===
loginBtn.onclick = async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (err) {
    alert("Erro no login: " + err.message);
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
  const snapshot = await getDocs(collection(db, "users"));
  contactsDiv.innerHTML = "";
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.email !== currentUser.email) {
      const div = document.createElement("div");
      div.classList.add("contact");
      div.textContent = data.email;
      div.onclick = () => openChat(data);
      contactsDiv.appendChild(div);
    }
  });
}

// === Abrir chat com outro usuário ===
function openChat(user) {
  selectedUser = user;
  chatHeader.textContent = "Conversando com: " + user.email;
  messagesDiv.innerHTML = "";

  // remove listener anterior
  if (unsubscribeMessages) unsubscribeMessages();

  // escuta em tempo real mensagens entre os dois usuários
  const q = query(
    collection(db, "messages"),
    where("participants", "array-contains", currentUser.uid),
    orderBy("timestamp")
  );

  unsubscribeMessages = onSnapshot(q, (snapshot) => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(docSnap => {
      const msg = docSnap.data();
      // só mostra mensagens entre os dois usuários
      if (
        (msg.from === currentUser.uid && msg.to === selectedUser.uid) ||
        (msg.from === selectedUser.uid && msg.to === currentUser.uid)
      ) {
        const div = document.createElement("div");
        div.classList.add("message");
        div.classList.add(msg.from === currentUser.uid ? "sent" : "received");
        div.textContent = msg.text;
        messagesDiv.appendChild(div);
      }
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

// === Enviar mensagem ===
sendBtn.onclick = async () => {
  if (!selectedUser || !selectedUser.uid) {
    alert("Selecione um contato primeiro!");
    return;
  }

  const text = msgInput.value.trim();
  if (text === "") return;

  try {
    await addDoc(collection(db, "messages"), {
      text,
      from: currentUser.uid,
      to: selectedUser.uid,
      participants: [currentUser.uid, selectedUser.uid],
      timestamp: serverTimestamp()
    });
    msgInput.value = "";
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err);
    alert("Erro ao enviar mensagem: " + err.message);
  }
};
