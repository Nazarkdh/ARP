// Constand data

const types = ["fleet", "csc", "agility", "losttime"];
const statuses = [
  "complete",
  "quote",
  "pending",
  "returned",
  "rejected",
  "refused",
];

const typeCredits = { csc: 1, fleet: 45 / 60, agility: 45 / 60 };
const statusCredits = {
  complete: 1,
  quote: 0.5,
  pending: 0.5,
  returned: 0,
  rejected: 0,
  refusal: 1,
};

// shows the data for current or previous weeks
let displayedWeek = 0;

// week schedule will be retrieved from database
let weekSchedule = {};
//* ************

const dataForm = document.getElementById("data-form");

const BtnExpand = document.querySelector(".btn-expand");

const dataTable = document.getElementById("data-table");

const dailyPercents = document.querySelectorAll(".daily-percent");

const chkbxPendings = document.querySelector(".graph-filter #pendings ");
const chkbxQuotes = document.querySelector(".graph-filter #quotes ");

const btnPrevWeek = document.getElementById("btn-prev-week");
const btnNextWeek = document.getElementById("btn-next-week");

// inputs

const rmaInpt = document.querySelector('input[type="number"]');
const typeInput = document.querySelector("#type");
const statusInp = document.querySelector("#status");
const btnFormSubmit = document.querySelector(".form-btn");
const btnTimeSubmit = document.querySelector("#time-form");

// table
const dataTableBody = document.querySelector("#data-table tbody");

// Database
const db = AssetsRepaireDB;

// event listeners

document.addEventListener("DOMContentLoaded", () => {
  typeInput.innerHTML = UI.addOptionsToSelects(types, "Fleet");
  statusInp.innerHTML = UI.addOptionsToSelects(statuses, "Complete");
  getStoredData();
});

chkbxPendings.addEventListener("change", (e) => {
  getStoredData();
});
chkbxQuotes.addEventListener("change", (e) => {
  getStoredData();
});

dataForm.addEventListener("submit", (e) => {
  e.preventDefault();
  getDataForm();
});

BtnExpand.addEventListener("click", (e) => {
  const lostForm = document.querySelector("#time-form");
  BtnExpand.classList.toggle("active");
  lostForm.classList.toggle("active");
});

btnTimeSubmit.addEventListener("submit", (e) => {
  e.preventDefault();
  const timeInp = document.querySelector("#time-form input");
  if (timeInp.value === "") {
    alert("Please enter time!");

    return null;
  }
  const newTimeObj = { rma: +timeInp.value, type: "hours", status: "lost" };
  timeInp.value = "";
  db.addRepaire(newTimeObj);
  getStoredData();
});

dataTable.addEventListener("click", handleDataClicks);

btnPrevWeek.addEventListener("click", () => {
  displayedWeek--;
  getStoredData();
});
btnNextWeek.addEventListener("click", () => {
  displayedWeek++;
  getStoredData();
});

// functions

// functions to handl UI data

function getDataForm() {
  const rma = +rmaInpt.value;
  const type = typeInput.value;
  const status = statusInp.value;
  if (!rma) {
    alert("Please enter RMA ");
    return null;
  }

  const dataObj = { rma, type, status };

  db.addRepaire(dataObj);
  resetDataForm();
  getStoredData();
}
function resetDataForm() {
  rmaInpt.value = "";
  typeInput.value = "fleet";
  statusInp.value = "complete";
}

function formatDate(date) {
  if (!date instanceof Date) return null;
  date = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
  return date;
}

function capitalize(str) {
  // Check if the string is empty or invalid
  if (!str || typeof str !== "string") {
    return str;
  }
  // Get the first character, make it uppercase
  const first = str.charAt(0).toUpperCase();
  // Get the rest of the string
  const rest = str.slice(1);
  // Combine them
  return first + rest;
}

function handleDataClicks(e) {
  const el = e.target;
  const btnEdit = el.closest(".btn-edit");
  const btnUpdate = el.closest(".update-btn");
  const btnDel = el.closest(".btn-delete");
  let id = null;

  if (btnEdit) {
    id = +btnEdit.dataset.id;

    db.getRepaire(id).then((data) => {
      UI.edit(data, btnEdit.parentElement.parentElement);
    });
  }
  if (btnDel) {
    id = +btnDel.dataset.id;
    db.deleteRepaire(id);
    btnDel.parentElement.parentElement.remove();
    getStoredData();
  }
  if (btnUpdate) {
    id = +btnUpdate.dataset.id;
    const typeInp = document.querySelectorAll("tr select")[0];
    const statusInp = document.querySelectorAll("tr select")[1];
    const currentTR = document.querySelector(`tr[data-id='${id}']`);
    const dateInp = document.querySelector(`tr input`);
    const rmaInp = document.querySelector("tr input[type='number']");
    if (rmaInp.value === "") {
      alert("Please enter RMA");
      return null;
    }
    const formatedDate = new Date(dateInp.value + "T00:00:00");
    let updateObj = {};

    updateObj = {
      rma: +rmaInp.value,
      date: formatedDate,
      type: typeInp ? typeInp.value : "hours",
      status: statusInp ? statusInp.value : "lost",
      id,
    };

    db.updateRepaire(updateObj);
    UI.addRepaireDataToUI(updateObj, btnUpdate.parentElement.parentElement);
    getStoredData();
  }
}

// get daily graphs data

function getDailyPercents(data) {
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  if (chkbxPendings.checked) statusCredits.pending = 1;
  else statusCredits.pending = 0;
  if (chkbxQuotes.checked) statusCredits.quote = 1;
  else statusCredits.quote = 0;

  const dailyRepairs = {};
  let today = null;
  daysOfWeek.forEach((day) => {
    dailyRepairs[day] = [];
  });
  if (data)
    data.forEach((repaire) => {
      const day = daysOfWeek[new Date(repaire.date).getDay()];
      today = daysOfWeek[new Date().getDay()];

      dailyRepairs[day].push(repaire);
    });
  loadWeekHours().then((week) => {
    const { date, id, ...justSchedule } = week;
    weekSchedule = justSchedule;

    UI.setUISummary(
      dailyRepairs,
      typeCredits,
      statusCredits,
      weekSchedule,
      today,
      changeWorkHours
    );
  });
}

// functions to handle storage data
async function getStoredData() {
  UI.clearTableData();
  if (displayedWeek < 0) {
    btnNextWeek.style.visibility = "visible";
  } else {
    btnNextWeek.style.visibility = "hidden";
  }
  btnPrevWeek.style.visibility = "visible";

  await db.getWeekRepaire(displayedWeek).then((repaires) => {
    getDailyPercents(repaires);
    if (repaires.length < 1) {
      btnPrevWeek.style.visibility = "hidden";
      return;
    }
    repaires = repaires.sort(
      (obj1, obj2) => new Date(obj1.date) - new Date(obj2.date)
    );
    repaires.forEach((obj) => {
      UI.addRepaireDataToUI(obj);
    });
  });
}

// by updating schedule hours for any day, the graph will be updated to show the exaxt percentage
function changeWorkHours(e) {
  let hourInp = null;
  if (e.target.matches(".daily-percent p")) {
    hourInp = e.target.querySelector("input");
    hourInp.disabled = false;
    hourInp.focus();
  }
  if (e.target.matches(".daily-percent p button")) {
    const inpt = e.target.previousElementSibling;
    inpt.disabled = true;
    db.getWeek(null, displayedWeek).then((week) => {
      week[inpt.className] = +inpt.value;

      db.updateWeek(week).then(() => getStoredData());
    });
  }
}

function loadWeekHours() {
  const defaultSchedule = {
    Monday: 10,
    Tuesday: 10,
    Wednesday: 10,
    Thursday: 10,
    Friday: 0,
    Saturday: 0,
    Sunday: 0,
    week: 0,
  };
  return new Promise((resolve, reject) => {
    db.getWeek(null, displayedWeek).then((week1) => {
      if (week1) resolve(week1);
      else {
        db.getWeek(null, displayedWeek - 1).then((week2) => {
          if (week2) {
            resolve(week2);
            const { date, id, ...justSchedule } = week;

            db.addWeek(displayedWeek, justSchedule);
          } else {
            resolve(defaultSchedule);

            db.addWeek(displayedWeek, defaultSchedule);
          }
        });
      }
    });
  });
}
