var db = firebase.database()

function logActivity(type, trailer=""){

let vehicle = localStorage.getItem("vehicle")
let driver = localStorage.getItem("driver")

db.ref("activityLog").push({
vehicle:vehicle || "",
driver:driver || "",
type:type,
trailer:trailer,
time:Date.now()
})

}

/* ---------- ADD TASK ---------- */

function addTask(button){

let trailer=document.getElementById("trailer")?.value || ""
let from=document.getElementById("from")?.value || ""
let to=document.getElementById("to")?.value || ""
let bay=document.getElementById("bay")?.value || ""
let loadType=document.getElementById("loadType")?.value || ""
let type=document.getElementById("taskType")?.value || "move"

let requestedBy=localStorage.getItem("userName") || "Unknown"

db.ref("tasks").once("value").then(snapshot=>{

let pos=snapshot.numChildren()+1

let task={

trailer:trailer,
from:from,
to:to,
bay:bay,
loadType:loadType,
requestedBy:requestedBy,
position:pos,
created:Date.now(),
status:"waiting"

}

if(type==="move"){
task.type="Move Trailer"
}

if(type==="power"){
task.type="Provide Power"
}

db.ref("tasks").push(task)

})

}

/* ---------- ACCEPT TASK ---------- */

function acceptTask(id){

let vehicle = localStorage.getItem("vehicle")
let driver = localStorage.getItem("driver")

db.ref("tasks/"+id).once("value").then(snap=>{

let t = snap.val()

db.ref("tasks/"+id).update({
acceptedBy:vehicle,
acceptedByDriver:driver,
acceptedTime:Date.now(),
status:"accepted"
})

logActivity("ACCEPT",t.trailer)

})

}

/* ---------- COMPLETE TASK ---------- */

function completeTask(id){

db.ref("tasks/"+id).once("value").then(snap=>{

let t = snap.val()

let accepted = t.acceptedTime || 0

if(Date.now() - accepted < 30000){

alert("Cannot complete job yet (30 second protection)")
return

}

db.ref("tasks/"+id).update({
completedTime:Date.now(),
status:"completed"
})

logActivity("COMPLETE",t.trailer)

})

}

/* ---------- BREAK ---------- */

function startBreak(){

let vehicle = localStorage.getItem("vehicle")

db.ref("shunters/"+vehicle+"/status").set("break")

logActivity("BREAK")

}

function endBreak(){

let vehicle = localStorage.getItem("vehicle")

db.ref("shunters/"+vehicle+"/status").set("available")

logActivity("BREAK END")

}
