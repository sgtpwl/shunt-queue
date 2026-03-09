const db = firebase.database()

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

},5000)

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
