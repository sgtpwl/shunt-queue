function addTask() {

  const trailer = document.getElementById("trailer")?.value || "";
  const from = document.getElementById("from")?.value || "";
  const to = document.getElementById("to")?.value || "";
  const type = document.getElementById("type")?.value || "";
  const bay = document.getElementById("bay")?.value || "";

  if (!trailer) {
    alert("Enter trailer number");
    return;
  }

  const button = event.target;
  button.disabled = true;
  button.innerText = "Submitting...";

  db.ref("tasks").push({
    trailer,
    from,
    to,
    bay,
    type,
    status: "waiting",
    created: Date.now()
  }).then(() => {

    button.innerText = "Task Added ✓";

    setTimeout(()=>{
      button.disabled = false;
      button.innerText = "Submit Task";
    },1500);

  });

}

function finishPower(shunter){

  const button = event.target;

  button.disabled = true;
  button.innerText = "Finishing...";

  db.ref("powerConnections/"+shunter).update({
    status:"readyToDisconnect"
  });

}

function loadTasks() {

  db.ref("tasks").on("value", snapshot => {

    const tasksDiv = document.getElementById("tasks");

    if(!tasksDiv) return;

    tasksDiv.innerHTML = "";

    snapshot.forEach(child => {

      const task = child.val();

      const div = document.createElement("div");
      div.className = "task";

      div.innerHTML = `
        <b>${task.trailer}</b> — ${task.type}<br>
        ${task.bay ? "Bay "+task.bay : ""}
        <br>${task.from || ""} ${task.to ? "→ " + task.to : ""}
        <br><i>${task.status}</i>
        ${task.acceptedBy ? `<br><b>Accepted by:</b> ${task.acceptedBy}` : ""}
      `;

      tasksDiv.appendChild(div);

    });

  });

}

function loadPowerConnections(){

  const div = document.getElementById("powerConnections");

  if(!div) return;

  db.ref("powerConnections").on("value", snapshot => {

    div.innerHTML="";

    snapshot.forEach(child=>{

      const p = child.val();
      const shunter = child.key;

      const row = document.createElement("div");

      row.className="task";

      row.innerHTML=`
      ⚡ ${p.bay} — ${p.trailer} — ${shunter}
      <br>
      <button onclick="finishPower('${shunter}')">
      FINISH POWER
      </button>
      `;

      div.appendChild(row);

    });

  });

}

window.onload=function(){

  loadTasks();
  loadPowerConnections();

};
