// 🔥 Firebase config
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  projectId: "TU_PROJECT_ID"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM
const googleButton = document.getElementById("googleSignIn");
const logoutBtn = document.getElementById("logout");
const loginContainer = document.getElementById("loginContainer");
const appContent = document.getElementById("appContent");

const myLists = document.getElementById("myLists");
const sharedLists = document.getElementById("sharedLists");
const newListName = document.getElementById("newListName");
const addListBtn = document.getElementById("addList");

const tasksSection = document.getElementById("tasksSection");
const currentListName = document.getElementById("currentListName");
const taskList = document.getElementById("taskList");
const newTaskInput = document.getElementById("newTaskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const backToLists = document.getElementById("backToLists");
const shareListBtn = document.getElementById("shareListBtn");

let currentUser = null;
let currentListId = null;

// 🔹 Guardar usuario en Firestore
function saveUser(user) {
  db.collection("users").doc(user.uid).set({
    email: user.email,
    name: user.displayName
  }, { merge: true });
}

// 🔹 Login Google
googleButton.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => console.error(err));
});

// 🔹 Logout
logoutBtn.addEventListener("click", () => auth.signOut());

// 🔹 Escuchar cambios de usuario
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    saveUser(user);
    loginContainer.style.display = "none";
    appContent.style.display = "block";
    loadLists();
  } else {
    currentUser = null;
    loginContainer.style.display = "block";
    appContent.style.display = "none";
    tasksSection.style.display = "none";
  }
});

// 🔹 Agregar nueva lista
addListBtn.addEventListener("click", async () => {
  const name = newListName.value.trim();
  if (!name) return;
  await db.collection("lists").add({
    name,
    owner: currentUser.uid,
    members: [],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  newListName.value = "";
});

// 🔹 Cargar listas
function loadLists() {
  // Mis listas
  db.collection("lists")
    .where("owner", "==", currentUser.uid)
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      myLists.innerHTML = "";
      snapshot.forEach(doc => {
        const li = document.createElement("li");
        li.textContent = doc.data().name;
        li.onclick = () => openList(doc.id, doc.data().name);

        const shareBtn = document.createElement("button");
        shareBtn.textContent = "Compartir";
        shareBtn.onclick = (e) => { e.stopPropagation(); shareList(doc.id); };

        li.appendChild(shareBtn);
        myLists.appendChild(li);
      });
    });

  // Listas compartidas
  db.collection("lists")
    .where("members", "array-contains", { uid: currentUser.uid, role: "editor" }) // simplificado
    .onSnapshot(snapshot => {
      sharedLists.innerHTML = "";
      snapshot.forEach(doc => {
        const li = document.createElement("li");
        li.textContent = doc.data().name + " (Compartida)";
        li.onclick = () => openList(doc.id, doc.data().name);
        sharedLists.appendChild(li);
      });
    });
}

// 🔹 Abrir lista y mostrar tareas
function openList(listId, listName) {
  currentListId = listId;
  currentListName.textContent = listName;
  tasksSection.style.display = "block";
  myLists.style.display = "none";
  sharedLists.style.display = "none";

  db.collection("lists").doc(listId).collection("tasks")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      taskList.innerHTML = "";
      snapshot.forEach(doc => {
        const task = doc.data();
        const li = document.createElement("li");
        li.textContent = task.text;
        if (task.done) li.classList.add("done");

        li.onclick = () => db.collection("lists").doc(listId).collection("tasks").doc(doc.id)
          .update({ done: !task.done });

        const delBtn = document.createElement("button");
        delBtn.textContent = "❌";
        delBtn.onclick = (e) => {
          e.stopPropagation();
          db.collection("lists").doc(listId).collection("tasks").doc(doc.id).delete();
        };

        li.appendChild(delBtn);
        taskList.appendChild(li);
      });
    });
}

// 🔹 Volver a listas
backToLists.addEventListener("click", () => {
  tasksSection.style.display = "none";
  myLists.style.display = "block";
  sharedLists.style.display = "block";
});

// 🔹 Agregar tarea
addTaskBtn.addEventListener("click", async () => {
  const text = newTaskInput.value.trim();
  if (!text) return;
  await db.collection("lists").doc(currentListId).collection("tasks").add({
    text,
    done: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  newTaskInput.value = "";
});

// 🔹 Compartir lista
async function shareList(listId) {
  const email = prompt("Ingrese email del usuario para compartir:");
  if (!email) return;

  const users = await db.collection("users").where("email", "==", email).get();
  if (users.empty) return alert("Usuario no encontrado");

  const uid = users.docs[0].id;
  await db.collection("lists").doc(listId)
    .update({ members: firebase.firestore.FieldValue.arrayUnion({ uid, role: "editor" }) });
  alert("Lista compartida!");
}
