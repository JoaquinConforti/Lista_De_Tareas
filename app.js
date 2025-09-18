// 🔥 Firebase config
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  projectId: "TU_PROJECT_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM
const loginContainer = document.getElementById("loginContainer");
const usernameInput = document.getElementById("usernameInput");
const loginBtn = document.getElementById("loginBtn");
const userLabel = document.getElementById("userLabel");
const logoutBtn = document.getElementById("logout");

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

// 🔹 Login local
loginBtn.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  if (!name) return alert("Ingresa un nombre");
  currentUser = { name, id: name.toLowerCase().replace(/\s/g,'') };
  loginContainer.style.display = "none";
  appContent.style.display = "block";
  userLabel.textContent = `Usuario: ${currentUser.name}`;
  loadLists();
});

// 🔹 Logout
logoutBtn.addEventListener("click", () => {
  currentUser = null;
  loginContainer.style.display = "block";
  appContent.style.display = "none";
  tasksSection.style.display = "none";
  usernameInput.value = "";
});

// 🔹 Agregar nueva lista
addListBtn.addEventListener("click", async () => {
  const name = newListName.value.trim();
  if (!name) return;
  await db.collection("lists").add({
    name,
    owner: currentUser.id,
    members: [],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  newListName.value = "";
});

// 🔹 Cargar listas
function loadLists() {
  db.collection("lists")
    .where("owner", "==", currentUser.id)
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

  db.collection("lists")
    .where("members", "array-contains", currentUser.id)
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
  const username = prompt("Ingrese el nombre del usuario para compartir:");
  if (!username) return;
  await db.collection("lists").doc(listId)
    .update({ members: firebase.firestore.FieldValue.arrayUnion(username.toLowerCase().replace(/\s/g,'')) });
  alert("Lista compartida!");
}
