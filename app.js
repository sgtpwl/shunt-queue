function addTask() {
  const trailer = document.getElementById("trailer")?.value?.trim() || "";
  const from = document.getElementById("from")?.value?.trim() || "";
  const to = document.getElementById("to")?.value?.trim() || "";
  const type = document.getElementById("type")?.value || "Move Trailer";
  const bay = document.getElementById("bay")?.value || "";

  if (!trailer) {
    alert("Enter trailer number");
    return;
  }

  // For power jobs, bay is strongly recommended
  if ((type === "Provide Power (DD)" || type === "Remove Power (DD)") && !bay) {
    if (!confirm("No bay selected. Add this power job without a bay?")) return;
  }

  db.ref("tasks").push({
    trailer,
    from,
    to,
    type,
    bay,              // <-- NEW
    status: "waiting",
    created: Date.now()
  });

  // Clear inputs (if present)
  const trailerEl = document.getElementById("trailer");
  const fromEl = document.getElementById("from");
  const toEl = document.getElementById("to");
  const bayEl = document.getElementById("bay");

  if (trailerEl) trailerEl.value = "";
  if (fromEl) fromEl.value = "";
  if (toEl) toEl.value = "";
  if (bayEl) bayEl.value = "";
}

function loadTasks() {
  db.ref("tasks").on("value", snapshot => {
    const tasksDiv = document.getElementById("tasks");
    if (!tasksDiv) return; // supervisor page has no queue

    tasksDiv.innerHTML = "";

    snapshot.forEach(child => {
      const task = child.val();

      const div = document.createElement("div");
      div.className = "task";

      const bayLine = task.bay ? `<br><b>Bay:</b> ${task.bay}` : "";
      const acceptedLine = task.acceptedBy ? `<br><b>Accepted by:</b> ${task.acceptedBy}` : "";

      div.innerHTML = `
        <b>${task.trailer}</b> — ${task.type}
        ${bayLine}
        <br>${task.from || ""} ${task.to ? "→ " + task.to : ""}
        <br><i>${task.status}</i>
        ${acceptedLine}
      `;

      tasksDiv.appendChild(div);
    });
  });
}

window.onload = loadTasks;
