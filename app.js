/* NOTE:
   - db is expected to be defined in config.js (firebase.initializeApp + const db = firebase.database())
   - Do NOT redeclare db here
*/

/* ---------------------------
HELPERS
--------------------------- */

function _now() { return Date.now(); }

function _safeText(v) {
  return (v || "").toString().trim();
}

function _setMsg(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text || "";
}

function _clearInputs(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

function _disableButton(btn, text) {
  if (!btn) return;
  btn.disabled = true;
  if (text) btn.innerText = text;
}

function _enableButton(btn, text) {
  if (!btn) return;
  btn.disabled = false;
  if (text) btn.innerText = text;
}

/* ---------------------------
ADD TASK (Supervisor/Manager)
- Supports:
  - Move Trailer (free text from/to + loadType)
  - Provide Power (DD) (bay dropdown)
  - Priority checkbox: inserts behind accepted tasks, ahead of other waiting tasks
- Button locks for 5s with feedback
--------------------------- */

function addTask(btn) {

  // button feedback
  _disableButton(btn, "Submitting...");

  const type = _safeText(document.getElementById("taskType")?.value);

  // common
  const priority = !!document.getElementById("priority")?.checked;

  // move fields
  const trailerMove = _safeText(document.getElementById("trailer")?.value);
  const from = _safeText(document.getElementById("from")?.value);
  const to = _safeText(document.getElementById("to")?.value);
  const loadType = _safeText(document.getElementById("loadType")?.value); // "Full Load" | "Empty Trailer" | "Trunk Trailer"

  // power fields
  const trailerPower = _safeText(document.getElementById("powerTrailer")?.value);
  const bay = _safeText(document.getElementById("bay")?.value);

  let task = {
    status: "waiting",
    created: _now(),
    priority: priority
  };

  if (type === "move") {

    if (!trailerMove || !from || !to) {
      alert("Enter Trailer, From, and To");
      _enableButton(btn, "Submit Task");
      return;
    }

    task.type = "Move Trailer";
    task.trailer = trailerMove;
    task.from = from;
    task.to = to;
    task.loadType = loadType || "Trunk Trailer"; // default

  } else {

    if (!trailerPower || !bay) {
      alert("Enter Trailer and select Bay");
      _enableButton(btn, "Submit Task");
      return;
    }

    task.type = "Provide Power (DD)";
    task.trailer = trailerPower;
    task.bay = bay;

  }

  // Insert position logic:
  // - Always behind accepted tasks
  // - If priority: insert immediately after accepted block, shifting waiting tasks down
  // - If not priority: append to end

  db.ref("tasks").once("value").then(snap => {

    let tasks = [];
    snap.forEach(child => {
      let t = child.val() || {};
      t.id = child.key;
      tasks.push(t);
    });

    tasks.sort((a, b) => (a.position || 0) - (b.position || 0));

    // find last accepted position (accepted = status "accepted")
    let lastAcceptedPos = 0;
    tasks.forEach(t => {
      if (t.status === "accepted" && (t.position || 0) > lastAcceptedPos) {
        lastAcceptedPos = t.position || 0;
      }
    });

    if (!tasks.length) {
      task.position = 1;
      return db.ref("tasks").push(task);
    }

    if (!priority) {
      // append
      const maxPos = Math.max(...tasks.map(t => t.position || 0));
      task.position = maxPos + 1;
      return db.ref("tasks").push(task);
    }

    // priority insert: position = lastAcceptedPos + 1
    const insertPos = lastAcceptedPos + 1;
    task.position = insertPos;

    // shift every task with position >= insertPos down by +1,
    // BUT do NOT shift accepted tasks (they're <= lastAcceptedPos by definition).
    // Still safe to shift all >= insertPos regardless of status; accepted should not be >= insertPos.
    const updates = {};
    tasks.forEach(t => {
      const p = t.position || 0;
      if (p >= insertPos) {
        updates[`tasks/${t.id}/position`] = p + 1;
      }
    });

    // apply shifts then push new task
    return db.ref().update(updates).then(() => db.ref("tasks").push(task));

  }).then(() => {

    _setMsg("msg", "Task Added ✓");

    // clear fields for faster entry
    _clearInputs(["trailer", "from", "to", "powerTrailer"]);
    // leave bay + dropdowns alone

    if (btn) btn.innerText = "Task Added ✓";

    setTimeout(() => {
      _setMsg("msg", "");
      _enableButton(btn, "Submit Task");
    }, 5000);

  }).catch(err => {

    console.error(err);
    alert("Failed to add task");
    _enableButton(btn, "Submit Task");

  });

}

/* ---------------------------
QUEUE MOVEMENT (Manager)
Rules:
- First 4 tasks (index 0-3) locked
- Accepted tasks cannot be moved
- We only swap with adjacent task if BOTH are movable waiting tasks
--------------------------- */

function moveUp(taskId) {
  _swapWithNeighbor(taskId, -1);
}

function moveDown(taskId) {
  _swapWithNeighbor(taskId, +1);
}

function _swapWithNeighbor(taskId, delta) {

  db.ref("tasks").once("value").then(snap => {

    let tasks = [];
    snap.forEach(child => {
      let t = child.val() || {};
      t.id = child.key;
      tasks.push(t);
    });

    tasks.sort((a, b) => (a.position || 0) - (b.position || 0));

    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return;

    const neighborIdx = idx + delta;
    if (neighborIdx < 0 || neighborIdx >= tasks.length) return;

    // lock first 4 tasks
    if (idx < 4 || neighborIdx < 4) return;

    const a = tasks[idx];
    const b = tasks[neighborIdx];

    // never move accepted
    if (a.status !== "waiting") return;
    if (b.status !== "waiting") return;

    const posA = a.position || 0;
    const posB = b.position || 0;

    const updates = {};
    updates[`tasks/${a.id}/position`] = posB;
    updates[`tasks/${b.id}/position`] = posA;

    return db.ref().update(updates);

  }).catch(console.error);

}

/* ---------------------------
DELETE TASK (Manager)
Only delete WAITING tasks (not accepted/completed)
--------------------------- */

function deleteTask(taskId) {

  if (!confirm("Delete task?")) return;

  db.ref("tasks/" + taskId).once("value").then(snap => {
    const t = snap.val();
    if (!t) return;

    if (t.status !== "waiting") {
      alert("Cannot delete a task that has been accepted or completed.");
      return;
    }

    return db.ref("tasks/" + taskId).remove();
  }).catch(console.error);

}

/* ---------------------------
SAFE ACCEPT TASK (Shunter)
Transaction prevents double-accept
--------------------------- */

function acceptTask(taskId) {

  const vehicle = localStorage.getItem("vehicle");
  const driver = localStorage.getItem("driver");

  if (!vehicle || !driver) {
    alert("Not logged in");
    return;
  }

  const taskRef = db.ref("tasks/" + taskId);

  taskRef.transaction(task => {

    if (task === null) return task;

    if (task.status !== "waiting") {
      return; // abort
    }

    task.status = "accepted";
    task.acceptedBy = vehicle;
    task.driver = driver;
    task.acceptedTime = _now();

    return task;

  }, (error, committed) => {

    if (error) {
      console.error(error);
      alert("Accept failed");
      return;
    }

    if (!committed) {
      alert("Task already taken");
      return;
    }

    // shunter status busy
    db.ref("shunters/" + vehicle).update({ status: "busy" });

  });

}

/* ---------------------------
COMPLETE TASK (Shunter)
- Marks completed
- If Provide Power: creates/updates powerConnections as connected when accepted elsewhere (your power flow may already handle)
--------------------------- */

function completeTask(taskId) {

  const vehicle = localStorage.getItem("vehicle");
  if (!vehicle) return;

  db.ref("tasks/" + taskId).update({
    status: "completed",
    completedTime: _now()
  }).then(() => {
    db.ref("shunters/" + vehicle).update({ status: "available" });
  }).catch(console.error);

}

/* ---------------------------
GATEHOUSE NOTIFY (Shunter)
Only meaningful for PRIORITY move tasks.
Stores notification fields on task.
--------------------------- */

function notifyGatehouseCleared(taskId, clearedLocation) {

  const vehicle = localStorage.getItem("vehicle") || "";
  const driver = localStorage.getItem("driver") || "";

  db.ref("tasks/" + taskId).update({
    gatehouseNotified: true,
    gatehouseNotifiedTime: _now(),
    gatehouseNotifiedBy: vehicle,
    gatehouseNotifiedDriver: driver,
    gatehouseClearedLocation: clearedLocation || ""
  }).catch(console.error);

}

/* ---------------------------
FINISH POWER (Manager/Supervisor)
--------------------------- */

function finishPower(vehicle, btn) {

  _disableButton(btn, "Finishing...");

  db.ref("powerConnections/" + vehicle).update({
    status: "readyToDisconnect"
  }).then(() => {
    if (btn) btn.innerText = "Finished";
    setTimeout(() => _enableButton(btn, "Finish Power"), 5000);
  }).catch(err => {
    console.error(err);
    alert("Finish power failed");
    _enableButton(btn, "Finish Power");
  });

}
