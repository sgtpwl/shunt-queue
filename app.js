var db = firebase.database()

/* ---------------- ADD TASK ---------------- */

function addTask(button){

let trailer=document.getElementById("trailer")?.value || ""
let from=document.getElementById("from")?.value || ""
let to=document.getElementById("to")?.value || ""
let loadType=document.getElementById("loadType")?.value || ""
let bay=document.getElementById("bay")?.value || ""
let type=document.getElementById("taskType")?.value || "move"

let requestedBy=localStorage.getItem("userName") || "unknown"

if(!trailer){
alert("Enter trailer number")
return
}

button.disabled=true
button.innerText="Submitting..."

db.ref("tasks").once("value",snap=>{

let position=snap.numChildren()+1

db.ref("tasks").push({

trailer,
from,
to,
bay,
loadType,
type,
requestedBy,
status:"waiting",
position,
created:Date.now()

}).then(()=>{

button.innerText="Task Added ✓"

setTimeout(()=>{
button.disabled=false
button.innerText="Submit Task"
},3000)

})

})

}


/* ---------------- ACCEPT TASK ---------------- */

function acceptTask(id){

let vehicle=localStorage.getItem("vehicle")
let driver=localStorage.getItem("driver")

const taskRef=db.ref("tasks/"+id)

taskRef.transaction(task=>{

if(task===null) return task

/* another shunter already took it */

if(task.status!=="waiting") return

task.status="accepted"
task.acceptedBy=vehicle
task.acceptedByDriver=driver
task.acceptedTime=Date.now()

return task

})

.then(result=>{

if(!result.committed){
alert("Task already taken")
return
}

/* update shunter status */

db.ref("shunters/"+vehicle).update({
status:"moving",
driver:driver
})

})

}


/* ---------------- COMPLETE TASK ---------------- */

function completeTask(id){

let vehicle=localStorage.getItem("vehicle")

db.ref("tasks/"+id).once("value",snap=>{

let task=snap.val()

if(!task) return

/* 30 second protection */

let elapsed=(Date.now()-(task.acceptedTime||0))/1000

if(elapsed<30){

alert("Task must run at least 30 seconds before completion")

return

}

db.ref("tasks/"+id).update({

status:"completed",
completedTime:Date.now()

})

db.ref("shunters/"+vehicle).update({

status:"available"

})

})

}


/* ---------------- MOVE QUEUE ---------------- */

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

if(index<=0) return

let current=tasks[index]
let above=tasks[index-1]

db.ref("tasks/"+current.id+"/position").set(above.position)
db.ref("tasks/"+above.id+"/position").set(current.position)

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

if(index===tasks.length-1) return

let current=tasks[index]
let below=tasks[index+1]

db.ref("tasks/"+current.id+"/position").set(below.position)
db.ref("tasks/"+below.id+"/position").set(current.position)

})

}


/* ---------------- SHUNTER HEARTBEAT ---------------- */

function startHeartbeat(vehicle){

setInterval(()=>{

db.ref("shunters/"+vehicle+"/lastSeen").set(Date.now())

},10000)

}


/* ---------------- OFFLINE WATCHDOG ---------------- */

setInterval(()=>{

db.ref("shunters").once("value",snap=>{

snap.forEach(child=>{

let s=child.val()

if(!s.lastSeen) return

let diff=Date.now()-s.lastSeen

if(diff>60000){

db.ref("shunters/"+child.key+"/status").set("offline")

}

})

})

},30000)
