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
button.innerText = "Submit Task";
}, 1500);

});

});

}



function moveUp(id){

db.ref("tasks").once("value",snapshot=>{

let tasks=[];

snapshot.forEach(child=>{
let t=child.val();
t.id=child.key;
tasks.push(t);
});

tasks.sort((a,b)=>a.position-b.position);

let index=tasks.findIndex(t=>t.id===id);

if(index<=0) return;

const temp=tasks[index];
tasks[index]=tasks[index-1];
tasks[index-1]=temp;

tasks.forEach((t,i)=>{
db.ref("tasks/"+t.id+"/position").set(i+1);
});

});

}



function moveDown(id){

db.ref("tasks").once("value",snapshot=>{

let tasks=[];

snapshot.forEach(child=>{
let t=child.val();
t.id=child.key;
tasks.push(t);
});

tasks.sort((a,b)=>a.position-b.position);

let index=tasks.findIndex(t=>t.id===id);

if(index>=tasks.length-1) return;

const temp=tasks[index];
tasks[index]=tasks[index+1];
tasks[index+1]=temp;

tasks.forEach((t,i)=>{
db.ref("tasks/"+t.id+"/position").set(i+1);
});

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

const tasksDiv = document.getElementById("tasks");

if(!tasksDiv) return;

db.ref("tasks").on("value", snapshot => {

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

db.ref("shunters").on("value",snapshot=>{

div.innerHTML="";

snapshot.forEach(child=>{

const name=child.key;
const data=child.val();

const row=document.createElement("div");

if(data.status==="power"){

row.innerHTML=`${name} — ⚡ Power`;

}else if(data.status==="busy"){

row.innerHTML=`${name} — Moving trailer`;

}else if(data.status==="break"){

row.innerHTML=`${name} — Break`;

}else{

row.innerHTML=`${name} — Available`;

}

div.appendChild(row);

});

});

}



window.onload=function(){

loadTasks();
loadPowerConnections();
loadShunterStatus();

};
