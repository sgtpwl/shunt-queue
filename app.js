function currentUser(){
return {
name: localStorage.getItem("userName") || "Unknown",
role: localStorage.getItem("userRole") || "unknown"
}
}

/* ---------- ADD TASK ---------- */

let lastSubmitTime = 0

function addTask(btn){

let now = Date.now()

if(now - lastSubmitTime < 3000){
alert("Please wait a moment before adding another task")
return
}

lastSubmitTime = now

btn.disabled=true
btn.innerText="Submitting..."

let user=currentUser()

let type=document.getElementById("taskType").value

let trailer=""
let from=""
let to=""
let bay=""
let loadType=document.getElementById("loadType")?.value || ""
let priority=document.getElementById("priority")?.checked || false

if(type==="move"){

trailer=document.getElementById("trailer").value.trim()
from=document.getElementById("from").value
to=document.getElementById("to").value

}else{

trailer=document.getElementById("powerTrailer").value.trim()
bay=document.getElementById("bay").value

}

if(!trailer){

alert("Enter trailer number")

btn.disabled=false
btn.innerText="Submit Task"

return

}

db.ref("tasks").once("value",snap=>{

let tasks=[]
snap.forEach(child=>{
let t=child.val()
t.id=child.key
tasks.push(t)
})

tasks.sort((a,b)=>a.position-b.position)

let lastAccepted=0

tasks.forEach(t=>{
if(t.status==="accepted"){
lastAccepted=Math.max(lastAccepted,t.position)
}
})

let newPosition

if(priority){

newPosition=lastAccepted+1

tasks.forEach(t=>{
if(t.position>=newPosition){
db.ref("tasks/"+t.id+"/position").set(t.position+1)
}
})

}else{

let max=0
tasks.forEach(t=>{
max=Math.max(max,t.position)
})

newPosition=max+1

}

db.ref("tasks").push({

type:type==="move"?"Move Trailer":"Provide Power (DD)",
trailer:trailer,
from:from,
to:to,
bay:bay,
loadType:loadType,
priority:priority,
requestedBy:user.name,
requestedRole:user.role,
status:"waiting",
created:Date.now(),
position:newPosition

})

btn.innerText="Task Added ✓"

setTimeout(()=>{

btn.disabled=false
btn.innerText="Submit Task"

},3000)

})

}

/* ---------- MOVE QUEUE ---------- */

function moveUp(id){

db.ref("tasks").once("value",snap=>{

let tasks=[]

snap.forEach(child=>{
let t=child.val()
t.id=child.key
tasks.push(t)
})

tasks.sort((a,b)=>a.position-b.position)

let index=tasks.findIndex(t=>t.id===id)

if(index<=3) return

let above=tasks[index-1]

if(tasks[index].status!=="waiting") return
if(above.status!=="waiting") return

db.ref("tasks/"+id+"/position").set(above.position)
db.ref("tasks/"+above.id+"/position").set(tasks[index].position)

})

}

function moveDown(id){

db.ref("tasks").once("value",snap=>{

let tasks=[]

snap.forEach(child=>{
let t=child.val()
t.id=child.key
tasks.push(t)
})

tasks.sort((a,b)=>a.position-b.position)

let index=tasks.findIndex(t=>t.id===id)

if(index<4) return
if(index===tasks.length-1) return

let below=tasks[index+1]

if(tasks[index].status!=="waiting") return
if(below.status!=="waiting") return

db.ref("tasks/"+id+"/position").set(below.position)
db.ref("tasks/"+below.id+"/position").set(tasks[index].position)

})

}

/* ---------- DELETE TASK ---------- */

function deleteTask(id){

if(!confirm("Delete task?")) return

db.ref("tasks/"+id).remove()

}

/* ---------- ACCEPT TASK ---------- */

function acceptTask(id){

let vehicle=localStorage.getItem("vehicle")
let driver=localStorage.getItem("driver")

db.ref("tasks/"+id).transaction(task=>{

if(task===null) return task
if(task.status!=="waiting") return

task.status="accepted"
task.acceptedBy=vehicle
task.driver=driver
task.acceptedTime=Date.now()

return task

})

}

/* ---------- COMPLETE TASK ---------- */

function completeTask(id){

let vehicle=localStorage.getItem("vehicle")

db.ref("tasks/"+id).update({

status:"completed",
completedTime:Date.now()

})

db.ref("shunters/"+vehicle).update({

status:"available"

})

}

/* ---------- GATEHOUSE NOTIFY ---------- */

function notifyGatehouse(id){

db.ref("tasks/"+id).update({

gatehouseNotified:true,
gatehouseTime:Date.now()

})

}

/* ---------- FINISH POWER ---------- */

function finishPower(vehicle){

db.ref("powerConnections/"+vehicle).remove()

}

/* ---------- SAFETY TIMER ---------- */

function safetyCheck(){

const limit=15*60*1000

db.ref("tasks").once("value",snap=>{

snap.forEach(child=>{

let t=child.val()

if(t.status==="accepted"){

let now=Date.now()

if(now-t.acceptedTime>limit){

db.ref("tasks/"+child.key).update({

status:"waiting",
acceptedBy:null,
driver:null,
acceptedTime:null

})

}

}

})

})

}

setInterval(safetyCheck,60000)
