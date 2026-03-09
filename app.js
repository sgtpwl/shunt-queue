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

/* ACCEPT TASK */

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

/* COMPLETE TASK */

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

/* BREAK */

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
