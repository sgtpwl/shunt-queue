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

if(index<=3) return;

if(tasks[index].status!=="waiting") return;

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

if(index<3) return;

if(tasks[index].status!=="waiting") return;

const temp=tasks[index];
tasks[index]=tasks[index+1];
tasks[index+1]=temp;

tasks.forEach((t,i)=>{
db.ref("tasks/"+t.id+"/position").set(i+1);
});

});

}



function deleteTask(id){

if(!confirm("Delete this task?")) return;

db.ref("tasks/"+id).remove();

}



function clearPower(vehicle){

if(!confirm("Clear power connection?")) return;

db.ref("powerConnections/"+vehicle).remove();

}



function finishPower(vehicle,button){

button.disabled=true;
button.innerText="Finishing...";

db.ref("powerConnections/"+vehicle).update({
status:"readyToDisconnect"
});

}



function loadPowerConnections(){

const div=document.getElementById("powerConnections");

if(!div) return;

db.ref("powerConnections").on("value",snapshot=>{

div.innerHTML="";

snapshot.forEach(child=>{

const p=child.val();
const vehicle=child.key;

const row=document.createElement("div");

row.innerHTML=`
⚡ ${vehicle} — Bay ${p.bay} — ${p.trailer}
<br>
<button onclick="finishPower('${vehicle}',this)">Finish</button>
<button onclick="clearPower('${vehicle}')">Clear</button>
`;

div.appendChild(row);

});

});

}
