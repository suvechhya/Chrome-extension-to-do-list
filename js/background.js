const taskStore = [];
chrome.runtime.onMessage.addListener(data => {
  if (data.type === "Task") {
    const request = window.indexedDB.open("TaskDb", 1);
    request.onsuccess = function(event) {
      const db = event.target.result;
      if (data.action === "add") {
        var req = db
          .transaction(["tasks"], "readwrite")
          .objectStore("tasks")
          .put(data.details);

        req.onsuccess = function(event) {
          taskStore.push(data.details);
          console.log("Task Added");
        };

        req.onerror = function(event) {
          console.log("Unable to Add Task");
        };
      }
      else if (data.action === "delete") {
        var req = db
          .transaction(["tasks"], "readwrite")
          .objectStore("tasks")
          .delete(data.details.id);

        req.onsuccess = function(event) {
          const index = taskStore.findIndex(task => (task.id).toString() === data.details.id.toString());
          taskStore.splice(index, 1);
          console.log("Task Deleted");
        };

        req.onerror = function(event) {
          console.log("Unable to Delete Task");
        };
      }
    };
  }
});

setInterval(function() {
  const time = `${new Date().getHours().zeroPad()}:${new Date().getMinutes().zeroPad()}`;
  if( time === "00:00") {
    // Clear all data for the day
    const request = window.indexedDB.open("TaskDb", 1);
    request.onsuccess = function(event) {
      const db = event.target.result;
      const req = db.transaction(["tasks"], "readwrite")
      .objectStore("tasks").clear();
    };
  }
  taskStore.forEach(task => {
    if (task.time === time && !task.done && task.noti === 'on') {
      chrome.notifications.create("", {
        title: task.taskTitle,
        message: task.desc,
        iconUrl: "assets/icon.png",
        type: "basic"
      });
    }
  });
}, 60 * 1000);

Number.prototype.zeroPad = function() {
  return ('0'+this).slice(-2);
};
