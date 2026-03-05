function addTask(){

const button=event.target

button.disabled=true
button.innerText="Submitting..."

let type=document.getElementById("taskType").value

let trailer=""
let from=""
let to=""
let bay=""

if(type==="move"){

trailer=document.getElementById("trailer").value
from=document.getElementById("from").value
to=document.getElementById("to").value

}else{

trailer=document.getElementById("powerTrailer").value
bay=document.getElementById("bay").value

}

if(!trailer){

alert("Enter trailer number")

button.disabled=false
button.innerText="Submit Task"

return

}

db.ref("tasks").once("value",snap=>{

let position=snap.numChildren()+1

db.ref("tasks").push({

type:type==="move"?"Move Trailer":"Provide Power (DD)",
trailer:trailer,
from:from,
to:to,
bay:bay,
status:"waiting",
created:Date.now(),
position:position

})

document.getElementById("msg").innerText="Task Added ✓"

button.innerText="Task Added ✓"

setTimeout(()=>{

button.disabled=false
button.innerText="Submit Task"
document.getElementById("msg").innerText=""

},5000)

})

}
