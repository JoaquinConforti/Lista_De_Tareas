// 🔥 Configuración de Firebase (reemplaza con tus datos)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");

// Añadir tarea
taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (text) {
    await db.collection("todos").add({
      text,
      done: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    taskInput.value = "";
  }
});

// Mostrar en tiempo real
db.collection("todos").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
  taskList.innerHTML = "";
  snapshot.forEach((doc) => {
    const task = doc.data();
    const li = document.createElement("li");
    li.textContent = task.text;
    if (task.done) li.classList.add("done");

    // Botón completar
    li.addEventListener("click", () => {
      db.collection("todos").doc(doc.id).update({ done: !task.done });
    });

    // Botón borrar
    const btn = document.createElement("button");
    btn.textContent = "❌";
    btn.style.marginLeft = "10px";
    btn.onclick = () => db.collection("todos").doc(doc.id).delete();

    li.appendChild(btn);
    taskList.appendChild(li);
  });
});
