function addTask() {

  const trailer = document.getElementById("trailer").value;
  const from = document.getElementById("from").value;
  const to = document.getElementById("to").value;
  const type = document.getElementById("type").value;

  if (!trailer) {
    alert("Enter trailer number");
    return;
  }

  db.ref("tasks").push({
    trailer: trailer,
    from: from,
    to: to,
    type: type,
    status: "waiting",
    created: Date.now()
  });

  document.getElementById("trailer").value = "";
  document.getElementById("from").value = "";
  document.getElementById("to").value = "";
}

function loadTasks() {

  db.ref("tasks").on("value", snapshot => {

    const tasksDiv = document.getElementById("tasks");
    tasksDiv.innerHTML = "";

    snapshot.forEach(child => {

      const task = child.val();

      const div = document.createElement("div");
      div.className = "task";

      div.innerHTML = `
        <b>${task.trailer}</b> — ${task.type}<br>
        ${task.from || ""} ${task.to ? "→ " + task.to : ""}
        <br><i>${task.status}</i>
      `;

      tasksDiv.appendChild(div);

    });

  });

}

window.onload = loadTasks;
