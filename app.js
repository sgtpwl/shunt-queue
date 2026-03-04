function addTask(button) {

  const trailer = document.getElementById("trailer")?.value || "";
  const from = document.getElementById("from")?.value || "";
  const to = document.getElementById("to")?.value || "";
  const type = document.getElementById("type")?.value || "";
  const bay = document.getElementById("bay")?.value || "";

  if (!trailer) {
    alert("Enter trailer number");
    return;
  }

  button.disabled = true;
  button.innerText = "Submitting...";

  db.ref("tasks").once("value", snapshot => {

    const position = snapshot.numChildren() + 1;

    db.ref("tasks").push({
      trailer,
      from,
      to,
      bay,
      type,
      status: "waiting",
      position: position,
      created: Date.now()
    }).then(() => {

      button.innerText = "Task Added ✓";

      setTimeout(() => {
        button.disabled = false;
        button.innerText = "Add Task";
      }, 1500);

    });

  });

}

function moveUp(id){

  db.ref("tasks").once("value", snapshot=>{

    let tasks=[];

    snapshot.forEach(child=>{
      let t=child.val();
      t.id=child.key;
      tasks.push(t);
    });

    tasks.sort((a,b)=>a.position-b.position);

    const index=tasks.findIndex(t=>t.id===id);

    if(index<=0) return;

    const current=tasks[index];
    const above=tasks[index-1];

    db.ref("tasks/"+current.id+"/position").set(above.position);
    db.ref("tasks/"+above.id+"/position").set(current.position);

  });

}

function moveDown(id){

  db.ref("tasks").once("value", snapshot=>{

    let tasks=[];

    snapshot.forEach(child=>{
      let t=child.val();
      t.id=child.key;
      tasks.push(t);
    });

    tasks.sort((a,b)=>a.position-b.position);

    const index=tasks.findIndex(t=>t.id===id);

    if(index===tasks.length-1) return;

    const current=tasks[index];
    const below=tasks[index+1];

    db.ref("tasks/"+current.id+"/position").set(below.position);
    db.ref("tasks/"+below.id+"/position").set(current.position);

  });

}

function finishPower(shunter, button){

  button.disabled = true;
  button.innerText = "Finishing...";

  db.ref("powerConnections/"+shunter).update({
    status:"readyToDisconnect"
  }).then(()=>{

    button.innerText="Finished ✓";

  });

}

function loadTasks() {

  db.ref("tasks").on("value", snapshot => {

    const tasksDiv = document.getElementById("tasks");

    if(!tasksDiv) return;

    tasksDiv.innerHTML = "";

    let tasks=[];

    snapshot.forEach(child=>{
      let t=child.val();
      t.id=child.key;
      tasks.push(t);
    });

    tasks.sort((a,b)=>a.position-b.position);

    tasks.forEach(task=>{

      const div = document.createElement("div");
      div.className="task";

      div.innerHTML=`
      <b>${task.trailer}</b> — ${task.type}<br>
      ${task.bay ? "Bay "+task.bay : ""}
      <br>${task.from || ""} ${task.to ? "→ "+task.to : ""}
      <br><i>${task.status}</i>
      ${task.acceptedBy ? `<br><b>Accepted by:</b> ${task.acceptedBy}` : ""}

      <br><br>

      <button onclick="moveUp('${task.id}')">▲</button>
      <button onclick="moveDown('${task.id}')">▼</button>
      `;

      tasksDiv.appendChild(div);

    });

  });

}

function loadPowerConnections(){

  const div=document.getElementById("powerConnections");

  if(!div) return;

  db.ref("powerConnections").on("value",snapshot=>{

    div.innerHTML="";

    snapshot.forEach(child=>{

      const p=child.val();
      const shunter=child.key;

      const row=document.createElement("div");

      row.className="task";

      row.innerHTML=`
      ⚡ ${p.bay} — ${p.trailer} — ${shunter}
      <br>
      <button onclick="finishPower('${shunter}', this)">
      FINISH POWER
      </button>
      `;

      div.appendChild(row);

    });

  });

}

function loadShunterStatus(){

  const div=document.getElementById("shunterStatus");

  if(!div) return;

  db.ref("powerConnections").on("value",snapshot=>{

    let power={};

    snapshot.forEach(child=>{
      power[child.key]=child.val();
    });

    db.ref("tasks").on("value",taskSnap=>{

      let busy={};

      taskSnap.forEach(child=>{
        const t=child.val();
        if(t.status==="accepted"){
          busy[t.acceptedBy]=t;
        }
      });

      div.innerHTML="";

      const shunters=new Set([
        ...Object.keys(power),
        ...Object.keys(busy)
      ]);

      if(shunters.size===0){
        div.innerHTML="No active shunters";
        return;
      }

      shunters.forEach(name=>{

        const row=document.createElement("div");

        if(power[name]){

          row.innerHTML=`${name} — ⚡ Power ${power[name].bay}`;

        }else if(busy[name]){

          row.innerHTML=`${name} — Moving ${busy[name].trailer}`;

        }else{

          row.innerHTML=`${name} — Available`;

        }

        div.appendChild(row);

      });

    });

  });

}

window.onload=function(){

  loadTasks();
  loadPowerConnections();
  loadShunterStatus();

};
