/* ADD TASK */

function addTask(){

let type=document.getElementById("taskType").value;

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

if(!trailer){
alert("Enter trailer number");
return;
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

/* MOVE QUEUE */

function moveUp(id){

db.ref("tasks").once("value",snap=>{

let tasks=[];

snap.forEach(child=>{
let t=child.val();
t.id=child.key;
tasks.push(t);
});

tasks.sort((a,b)=>a.position-b.position);

let index=tasks.findIndex(t=>t.id===id);

if(index<=0) return;

let above=tasks[index-1];

db.ref("tasks/"+id+"/position").set(above.position);
db.ref("tasks/"+above.id+"/position").set(tasks[index].position);

});

}

function moveDown(id){

db.ref("tasks").once("value",snap=>{

let tasks=[];

snap.forEach(child=>{
let t=child.val();
t.id=child.key;
tasks.push(t);
});

tasks.sort((a,b)=>a.position-b.position);

let index=tasks.findIndex(t=>t.id===id);

if(index>=tasks.length-1) return;

let below=tasks[index+1];

db.ref("tasks/"+id+"/position").set(below.position);
db.ref("tasks/"+below.id+"/position").set(tasks[index].position);

});

}

/* DELETE TASK */

function deleteTask(id){

if(!confirm("Delete task?")) return;

db.ref("tasks/"+id).remove();

}

/* FINISH POWER */

function finishPower(vehicle,button){

button.disabled=true;
button.innerText="Finishing...";

db.ref("powerConnections/"+vehicle).update({
status:"readyToDisconnect"
}).then(()=>{

button.innerText="Finished";

});

}
