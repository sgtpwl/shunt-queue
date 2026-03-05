const db = firebase.database();

/* ---------------------------
ADD TASK (Supervisor)
--------------------------- */

function addTask(){

const type=document.getElementById("taskType").value;

let trailer="";
let from="";
let to="";
let bay="";

if(type==="move"){

trailer=document.getElementById("trailer").value;
from=document.getElementById("from").value;
to=document.getElementById("to").value;

}else{

trailer=document.getElementById("powerTrailer").value;
bay=document.getElementById("bay").value;

}

db.ref("tasks").once("value",snap=>{

let position=snap.numChildren()+1;

db.ref("tasks").push({

type:type==="move"?"Move Trailer":"Provide Power (DD)",
trailer:trailer,
from:from,
to:to,
bay:bay,
status:"waiting",
created:Date.now(),
position:position

});

document.getElementById("msg").innerText="Task Added";

});

}

/* ---------------------------
SAFE ACCEPT TASK
--------------------------- */

function acceptTask(taskId){

const vehicle=localStorage.getItem("vehicle");
const driver=localStorage.getItem("driver");

const taskRef=db.ref("tasks/"+taskId);

taskRef.transaction(task=>{

if(task===null) return task;

/* if already accepted block it */

if(task.status!=="waiting"){
return;
}

task.status="accepted";
task.acceptedBy=vehicle;
task.driver=driver;
task.acceptedTime=Date.now();

return task;

},function(error,committed){

if(!committed){
alert("Task already taken");
}

});

}

/* ---------------------------
COMPLETE TASK
--------------------------- */

function completeTask(taskId){

db.ref("tasks/"+taskId).update({

status:"completed",
completedTime:Date.now()

});

}

/* ---------------------------
DELETE TASK (Manager)
--------------------------- */

function deleteTask(taskId){

if(!confirm("Delete task?")) return;

db.ref("tasks/"+taskId).remove();

}

/* ---------------------------
QUEUE MOVEMENT
--------------------------- */

function moveUp(taskId){

db.ref("tasks").once("value",snap=>{

let tasks=[];

snap.forEach(child=>{
let t=child.val();
t.id=child.key;
tasks.push(t);
});

tasks.sort((a,b)=>a.position-b.position);

for(let i=1;i<tasks.length;i++){

if(tasks[i].id===taskId){

let prev=tasks[i-1];

db.ref("tasks/"+tasks[i].id+"/position").set(prev.position);
db.ref("tasks/"+prev.id+"/position").set(tasks[i].position);

break;

}

}

});

}

function moveDown(taskId){

db.ref("tasks").once("value",snap=>{

let tasks=[];

snap.forEach(child=>{
let t=child.val();
t.id=child.key;
tasks.push(t);
});

tasks.sort((a,b)=>a.position-b.position);

for(let i=0;i<tasks.length-1;i++){

if(tasks[i].id===taskId){

let next=tasks[i+1];

db.ref("tasks/"+tasks[i].id+"/position").set(next.position);
db.ref("tasks/"+next.id+"/position").set(tasks[i].position);

break;

}

}

});

}

/* ---------------------------
POWER MANAGEMENT
--------------------------- */

function finishPower(vehicle){

db.ref("powerConnections/"+vehicle).update({

status:"readyToDisconnect"

});

}

/* ---------------------------
SHUNTER STATUS
--------------------------- */

function setBreak(){

const vehicle=localStorage.getItem("vehicle");

db.ref("shunters/"+vehicle).update({

status:"break",
breakStart:Date.now()

});

}

function backFromBreak(){

const vehicle=localStorage.getItem("vehicle");

db.ref("shunters/"+vehicle).update({

status:"available",
breakStart:null

});

}
