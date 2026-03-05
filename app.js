<!DOCTYPE html>
<html>
<head>

<title>Manager Dashboard</title>

<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="style.css">

</head>

<body>

<h1>Manager Dashboard</h1>

<h2>Create Task</h2>

<select id="taskType" onchange="toggleTaskInputs()">
<option value="move">Move Trailer</option>
<option value="power">Provide Power (DD)</option>
</select>

<div id="moveFields">

<input id="trailer" placeholder="Trailer Number">
<input id="from" placeholder="From Location">
<input id="to" placeholder="To Location">

</div>

<div id="powerFields" style="display:none">

<input id="powerTrailer" placeholder="Trailer Number">

<select id="bay">
<option value="">Select Bay</option>

<script>

for(let i=1;i<=25;i++){
document.write(`<option value="B${i}">B${i}</option>`)
}

for(let i=1;i<=26;i++){
document.write(`<option value="C${i}">C${i}</option>`)
}

</script>

</select>

</div>

<br>

<button onclick="addTask()">Submit Task</button>

<p id="msg"></p>

<hr>

<h2>Queue</h2>

<div id="tasks"></div>

<hr>

<h2>Active Power</h2>

<div id="powerConnections"></div>

<hr>

<h2>Shunters</h2>

<div id="shunterStatus"></div>

<script>

function toggleTaskInputs(){

let type=document.getElementById("taskType").value

document.getElementById("moveFields").style.display=(type==="move")?"block":"none"
document.getElementById("powerFields").style.display=(type==="power")?"block":"none"

}

</script>

<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"></script>

<script src="config.js"></script>
<script src="app.js"></script>

<script>

function loadTasks(){

db.ref("tasks").on("value",snapshot=>{

const tasksDiv=document.getElementById("tasks")

tasksDiv.innerHTML=""

let tasks=[]

snapshot.forEach(child=>{

let t=child.val()
t.id=child.key
tasks.push(t)

})

tasks.sort((a,b)=>a.position-b.position)

tasks.forEach((task,index)=>{

const div=document.createElement("div")
div.className="task"

div.innerHTML=`

${task.trailer} — ${task.type}<br>

${task.from?task.from+" → "+task.to:"Bay "+task.bay}<br>

${task.status}

${task.acceptedBy?`<br>Accepted by: ${task.acceptedBy}`:""}

`

/* lock first 4 tasks */

if(index>=4){

const up=document.createElement("button")
up.innerText="▲"
up.onclick=()=>moveUp(task.id)

const down=document.createElement("button")
down.innerText="▼"
down.onclick=()=>moveDown(task.id)

div.appendChild(up)
div.appendChild(down)

}

/* delete button */

const del=document.createElement("button")
del.innerText="Delete"
del.onclick=()=>deleteTask(task.id)

div.appendChild(del)

tasksDiv.appendChild(div)

})

})

}

loadTasks()

</script>

</body>
</html>
