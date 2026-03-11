var db = firebase.database();

function logActivity(type, trailer = "") {
  let vehicle = localStorage.getItem("vehicle");
  let driver = localStorage.getItem("driver");

  db.ref("activityLog").push({
    vehicle: vehicle || "",
    driver: driver || "",
    type: type,
    trailer: trailer,
    time: Date.now(),
  });
}

/* ---------- RETURN JOB TO QUEUE ---------- */

function returnToQueue(id) {

db.ref("tasks/"+id).once("value").then(snap=>{

let t=snap.val()
if(!t) return

db.ref("tasks/"+id).update({

acceptedBy:null,
acceptedByDriver:null,
acceptedTime:null,
status:"waiting"

})

logActivity("RETURN",t.trailer)

})

}

/* ---------- ADD TASK ---------- */

function addTask(button) {

const taskType = document.getElementById("taskType")?.value || "move";
const priority = document.getElementById("priority")?.checked || false;

const trailer =
(document.getElementById("trailer")?.value || "").trim() ||
(document.getElementById("powerTrailer")?.value || "").trim();

const from = (document.getElementById("from")?.value || "").trim();
const to = (document.getElementById("to")?.value || "").trim();
const bay = (document.getElementById("bay")?.value || "").trim();
const loadType = (document.getElementById("loadType")?.value || "").trim();

const requestedBy = localStorage.getItem("userName") || "Unknown";

if (!trailer) {
alert("Enter trailer number");
return;
}

if (button) {
button.disabled = true;
button.innerText = "Submitting...";
}

db.ref("tasks").once("value").then(snapshot => {

let tasks=[]

snapshot.forEach(child=>{
let t=child.val() || {}
t.id=child.key
tasks.push(t)
})

tasks.sort((a,b)=>(a.position||0)-(b.position||0))

const acceptedTasks = tasks.filter(t=>t.status==="accepted")

let position

if(priority){

position = acceptedTasks.length + 1

const updates={}

tasks.forEach(t=>{
if((t.position||0)>=position){
updates["tasks/"+t.id+"/position"]=(t.position||0)+1
}
})

return db.ref().update(updates).then(()=>position)

}

position=tasks.length+1
return position

})
.then(position=>{

let task={

trailer:trailer,
from:from,
to:to,
bay:bay,
loadType:loadType,
requestedBy:requestedBy,
requestedRole:localStorage.getItem("userRole") || "",
position:position,
created:Date.now(),
status:"waiting",
priority:priority

}

if(taskType==="move") task.type="Move Trailer"
if(taskType==="power") task.type="Provide Power (DD)"

return db.ref("tasks").push(task)

})
.then(()=>{

if(button){
button.innerText="Task Added ✓"
setTimeout(()=>{
button.disabled=false
button.innerText="Submit Task"
},3000)
}

})
.catch(err=>{
console.error(err)
alert("Task add failed")
})

}

/* ---------- MOVE QUEUE ---------- */

function moveUp(id){

db.ref("tasks").once("value").then(snap=>{

let tasks=[]

snap.forEach(child=>{
let t=child.val() || {}
t.id=child.key
tasks.push(t)
})

tasks=tasks
.filter(t=>t.status!=="completed")
.sort((a,b)=>(a.position||0)-(b.position||0))

let index=tasks.findIndex(t=>t.id===id)

if(index<=0) return
if(index<4) return

let current=tasks[index]
let above=tasks[index-1]

const updates={}
updates["tasks/"+current.id+"/position"]=above.position
updates["tasks/"+above.id+"/position"]=current.position

db.ref().update(updates)

})

}

function moveDown(id){

db.ref("tasks").once("value").then(snap=>{

let tasks=[]

snap.forEach(child=>{
let t=child.val() || {}
t.id=child.key
tasks.push(t)
})

tasks=tasks
.filter(t=>t.status!=="completed")
.sort((a,b)=>(a.position||0)-(b.position||0))

let index=tasks.findIndex(t=>t.id===id)

if(index<4) return
if(index===tasks.length-1) return

let current=tasks[index]
let below=tasks[index+1]

const updates={}
updates["tasks/"+current.id+"/position"]=below.position
updates["tasks/"+below.id+"/position"]=current.position

db.ref().update(updates)

})

}

/* ---------- ACCEPT TASK ---------- */

function acceptTask(id){

let vehicle=localStorage.getItem("vehicle")
let driver=localStorage.getItem("driver")

const ref=db.ref("tasks/"+id)

ref.transaction(task=>{

if(task===null) return task
if(task.status!=="waiting") return

task.acceptedBy=vehicle
task.acceptedByDriver=driver
task.acceptedTime=Date.now()
task.status="accepted"

return task

},(error,committed,snapshot)=>{

if(!committed){
alert("Task already taken")
return
}

const t=snapshot.val() || {}
logActivity("ACCEPT",t.trailer)

db.ref("shunters/"+vehicle).update({
status:"moving",
driver:driver
})

})

}

/* ---------- COMPLETE TASK ---------- */

function completeTask(id){

let vehicle=localStorage.getItem("vehicle")

db.ref("tasks/"+id).once("value").then(snap=>{

let t=snap.val()
if(!t) return

let accepted=t.acceptedTime || 0

if(Date.now()-accepted<30000){
alert("Cannot complete job yet (30 second protection)")
return
}

db.ref("tasks/"+id).update({
completedTime:Date.now(),
status:"completed"
})

logActivity("COMPLETE",t.trailer)

db.ref("shunters/"+vehicle).update({
status:"available"
})

})

}
