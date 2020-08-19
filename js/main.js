//OPEN THE INDEXED DB
// In the following line, you should include the prefixes of implementations you want to test.
window.indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB;
// DON'T use "var indexedDB = ..." if you're not in a function.
// Moreover, you may need references to some window.IDB* objects:
window.IDBTransaction = window.IDBTransaction ||
  window.webkitIDBTransaction ||
  window.msIDBTransaction || { READ_WRITE: "readwrite" }; // This line should only be needed if it is needed to support the object's constants for older browsers
window.IDBKeyRange =
  window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
// (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)
if (!window.indexedDB) {
  console.log(
    "Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available."
  );
}

const request = window.indexedDB.open("TaskDb", 1);
let db;
let tasks = [];
request.onerror = function(event) {
  console.log("Why didn't you allow my web app to use IndexedDB?!");
};
request.onsuccess = function(event) {
  db = event.target.result;
  var objectStore = db.transaction("tasks").objectStore("tasks");
  objectStore.openCursor().onsuccess = function(event) {
    var cursor = event.target.result;
    if (cursor) {
      tasks.push({ ...cursor.value });
      cursor.continue();
    } else {
      updateDom();
    }
  };
};
request.onupgradeneeded = function(event) {
  db = event.target.result;
  // Create an objectStore for this database
  var objectStore = db.createObjectStore("tasks", {
    keyPath: "id"
  });
  objectStore.transaction.oncomplete = function(event) {
    console.log("I created new store");
  };
};
// INDEXEDDB OPENED
document.addEventListener("DOMContentLoaded", function() {
  M.AutoInit();
  const timepicker = document.querySelectorAll(".timepicker");
  const instances = M.Timepicker.init(timepicker, { twelveHour: false });
  var tooltip = document.querySelectorAll(".tooltipped");
  var instance = M.Tooltip.init(tooltip, {});
});

const addBtn = document.getElementById("addBtn");
const modal = document.getElementById("add-modal");
const closemodal = document.getElementsByClassName("close")[0];
const cancelBtn = document.getElementById("cancel-add");
const submitTask = document.getElementById("submit-task");

const timepickerel = document.getElementById("timepicker");
const notification = document.getElementById("noti");
const taskTitletext = document.getElementById("input_text");
let disableSubmit = {};

addBtn.addEventListener("click", () => {
  modal.style.display = "block";
  modal.classList.add("show");
});

closemodal.onclick = function() {
  document.getElementById("addform").reset();
  document.getElementById("timepicker-validation").innerHTML = "";
  modal.style.display = "none";
  modal.classList.remove("show");
};

cancelBtn.onclick = function() {
  document.getElementById("addform").reset();
  document.getElementById("timepicker-validation").innerHTML = "";
  modal.style.display = "none";
  modal.classList.remove("show");
};

submitTask.onclick = function() {
  addTask();
  modal.style.display = "none";
  modal.classList.remove("show");
};

var disableSubmitProxy = new Proxy(disableSubmit, {
  set: function(target, key, value) {
    console.log(`${key} set to ${value}`);
    if (key === "submitButton") {
      if (value === true) {
        submitTask.classList.add("disabled");
      } else {
        submitTask.classList.remove("disabled");
      }
    }
    target[key] = value;
    return true;
  }
});

disableSubmitProxy.submitButton = true;

notification.disabled = true;
timepickerel.addEventListener("focus", () => {
  if (timepickerel.value !== "") {
    notification.disabled = false;
    const time = `${new Date().getHours().zeroPad()}:${new Date().getMinutes().zeroPad()}`;
    if (timepickerel.value < time) {
      notification.value = "off";
      notification.disabled = true;
      disableSubmitProxy.submitButton = true;
      document.getElementById("timepicker-validation").innerHTML =
        "Tasks cannot be added at a past time.";
    } else {
      document.getElementById("timepicker-validation").innerHTML = "";
      if (taskTitletext.value !== "") {
        disableSubmitProxy.submitButton = false;
      }
    }
  } else {
    notification.disabled = true;
  }
});

taskTitletext.addEventListener("blur", () => {
  if (taskTitletext.value !== "") {
    disableSubmitProxy.submitButton = false;
  } else {
    disableSubmitProxy.submitButton = true;
  }
});

function addTask() {
  const taskTitle = taskTitletext.value;
  const desc = document.getElementById("task-desc").value;
  const time = timepickerel.value;
  const noti = notification.value;
  const task = {
    id: new Date().getTime(),
    taskTitle,
    desc,
    time,
    noti,
    done: false,
    passed: false
  };
  document.getElementById("addform").reset();
  tasks.push(task);
  updateDom();
  chrome.runtime.sendMessage("", {
    type: "Task",
    action: "add",
    details: task
  });
}

function updateDom() {
  document.getElementById("task-list").innerHTML = "";
  calculateLoader();
  if (tasks.length > 0) {
    const time = new Date().toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    tasks = tasks.map(task => {
      return { ...task, passed: task.time < time };
    });
    const passedTasks = tasks.filter(task => task.passed && !task.done) || [];
    const doneTasks = tasks.filter(task => task.done) || [];
    let leftTasks = tasks.filter(task => !task.done && !task.passed) || [];
    leftTasks = leftTasks.sort(compare);
    leftTasks.forEach(taskitem => {
      const task = document.createElement("LI");
      task.classList.add("card");
      task.innerHTML = `<h3>${taskitem.taskTitle}</h3><p>${taskitem.desc}</p><h6>${taskitem.time}</h6>
      <h6 class="right-align">
      <a class="btn-floating teal darken-3"><i value="done" name=${taskitem.id} class="material-icons">done</i></a>
      <a class="btn-floating black"><i value="delete" name=${taskitem.id} class="material-icons">delete</i></a></h6>
      `;
      document.getElementById("task-list").appendChild(task);
    });
    doneTasks.forEach(taskitem => {
      const task = document.createElement("LI");
      task.classList.add("card");
      task.classList.add("done");
      task.innerHTML = `<h3>${taskitem.taskTitle}</h3><p>${taskitem.desc}</p><h6>${taskitem.time}</h6>
      <h6 class="right-align">
      <a class="btn-floating teal darken-3"><i value="done" name=${taskitem.id} class="material-icons">done</i></a>
      <a class="btn-floating black"><i value="delete" name=${taskitem.id} class="material-icons">delete</i></a></h6>
      `;
      document.getElementById("task-list").appendChild(task);
    });
    passedTasks.forEach(taskitem => {
      const task = document.createElement("LI");
      task.classList.add("card");
      task.classList.add("passed");
      task.innerHTML = `<h3>${taskitem.taskTitle}</h3><p>${taskitem.desc}</p><h6>${taskitem.time}</h6>
      <h6 class="right-align">
      <a class="btn-floating teal darken-3"><i value="done" name=${taskitem.id} class="material-icons">done</i></a>
      <a class="btn-floating black"><i value="delete" name=${taskitem.id} class="material-icons">delete</i></a></h6>
      `;
      document.getElementById("task-list").appendChild(task);
    });
  } else {
    const task = document.createElement("LI");
    task.classList.add("card");
    task.innerHTML = `<h2 class="text-center">No Tasks Available</h2>`;
    document.getElementById("task-list").appendChild(task);
  }
}

document.getElementById("task-list").addEventListener("click", e => {
  const type = e.target.attributes.value["value"];
  const id = e.target.attributes.name["value"];
  if (type === "done") {
    doneTask(id);
  } else if (type === "delete") {
    deleteTask(id);
  }
});

function doneTask(id) {
  const index = tasks.findIndex(task => task.id.toString() === id.toString());
  tasks[index].done = true;
  chrome.runtime.sendMessage("", {
    type: "Task",
    action: "add",
    details: tasks[index]
  });
  updateDom();
}

function deleteTask(id) {
  const index = tasks.findIndex(task => task.id.toString() === id.toString());
  const task = tasks[index];
  tasks[index].done = true;
  tasks.splice(index, 1);
  chrome.runtime.sendMessage("", {
    type: "Task",
    action: "delete",
    details: task
  });
  updateDom();
}

function calculateLoader() {
  const total = tasks.length;
  const done = tasks.filter(task => task.done).length;
  const ratio = (done / total) * 100;
  if (total === 0) {
    document
      .getElementById("loader")
      .setAttribute("data-tooltip", `No Tasks for today!`);
  } else if (total !== done) {
    document
      .getElementById("loader")
      .setAttribute(
        "data-tooltip",
        `Only ${total - done} of ${total} tasks left!`
      );
  } else {
    document
      .getElementById("loader")
      .setAttribute("data-tooltip", `Awesome Job! All Tasks done!`);
  }
  document.getElementById("determinate").style.width = `${ratio}%`;
}

function compare(a, b) {
  // Use toUpperCase() to ignore character casing
  const bandA = a.time.toUpperCase();
  const bandB = b.time.toUpperCase();

  let comparison = 0;
  if (bandA > bandB) {
    comparison = 1;
  } else if (bandA < bandB) {
    comparison = -1;
  }
  return comparison;
}

Number.prototype.zeroPad = function() {
  return ('0'+this).slice(-2);
};
