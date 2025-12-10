const UI = (function () {
  const dailySummary = document.querySelector(".daily");
  const weeklySummary = document.querySelector(".weekly");

  const DailyGraphs = document.querySelectorAll(".daily-percent");

  function setUISummary(
    dailyRepaires,
    typeCredits,
    statusCredits,
    weekSchedule,
    today,
    changeWorkHours
  ) {
    const daysOfWeek = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
      "week",
    ];

    const workeTimes = {
      dayLostTime: 0,
      todayLostTime: 0,
      dayTimeOnRepaire: 0,
      weekLostTime: 0,
      weekTimeOnRepair: 0,
    };
    const repairUnits = {
      completedToday: 0,
      pendingToday: 0,
      quotedToday: 0,
      rejectedTody: 0,
      completedWeekly: 0,
      pendingWeekly: 0,
      quotedWeekly: 0,
      returnedWeekly: 0,
      rejectedWeekly: 0,
    };

    DailyGraphs.forEach((dayGraph, ind) => {
      const day = daysOfWeek[ind];
      if (day !== "week") {
        dayGraph.addEventListener("click", changeWorkHours);
      }
      workeTimes.dayLostTime = 0;
      workeTimes.dayTimeOnRepaire = 0;

      if (dailyRepaires[day]) {
        dailyRepaires[day].map((repair) => {
          // calculate time for each repaire repect to their status i.e type: csc=1 status:quote=0.5 result: 0.5
          if (repair.type !== "hours") {
            workeTimes.dayTimeOnRepaire +=
              typeCredits[repair.type] * statusCredits[repair.status];
            workeTimes.weekTimeOnRepair +=
              typeCredits[repair.type] * statusCredits[repair.status];
            if (day === today) {
              workeTimes.todayTimeOnRepaire +=
                typeCredits[repair.type] * statusCredits[repair.status];
            }
          }

          if (repair.status === "complete") {
            repairUnits.completedWeekly++;
            if (day === today) {
              repairUnits.completedToday++;
            }
          }
          if (repair.status === "quote") {
            repairUnits.quotedWeekly++;
            if (day === today) {
              repairUnits.quotedToday++;
            }
          }
          if (repair.status === "pending") {
            repairUnits.pendingWeekly++;
            if (day === today) {
              repairUnits.pendingToday++;
            }
          }
          if (repair.status === "rejected") {
            repairUnits.rejectedWeekly++;
            if (day === today) {
              repairUnits.rejectedTody++;
            }
          }

          // lost is saved as rma in DB for simplicity of software design
          if (repair.status === "lost") {
            workeTimes.dayLostTime += repair.rma;
            workeTimes.weekLostTime += repair.rma;
            if (day === today) workeTimes.todayLostTime += repair.rma;
          }
        });
      }

      const dailyPercentGained = calPercentage(
        workeTimes.dayTimeOnRepaire,
        workeTimes.dayLostTime,
        weekSchedule[day]
      );
      const weeklyPercentGained = calPercentage(
        workeTimes.weekTimeOnRepair,
        workeTimes.weekLostTime,
        weekSchedule.week
      );

      // inserts structure and days to graphs
      let htmlContent = `
      <p >${
        weekSchedule[day]
      }h<input  class="${day}" type="number" disabled  value="${
        ind < 7 ? weekSchedule[day] : weekSchedule["week"]
      }" /><button class"btn-hr">Ok</button></p>
      <span>${
        ind !== daysOfWeek.length - 1
          ? daysOfWeek[ind].slice(0, 3)
          : daysOfWeek[ind]
      } </span>
      <strong>${
        ind !== daysOfWeek.length - 1 ? dailyPercentGained : weeklyPercentGained
      } <br />%</strong>
              <div style="height:${
                ind !== daysOfWeek.length - 1
                  ? limitValue(dailyPercentGained)
                  : limitValue(weeklyPercentGained)
              }%;
              ${day === today ? "border:solid 1px yellow;" : ""}
              
              "></div>`;

      dayGraph.innerHTML = htmlContent;
    });

    dailySummary.innerHTML = `
    <h4>Today</h4>
              <p>Repaires:</p>
              <span>${repairUnits.completedToday}</span>
              <p>Pendings:</p><span>${repairUnits.pendingToday}</span>
              <p>Quotes:</p><span>${repairUnits.quotedToday}</span>
              <p>Rejects:</p><span>${repairUnits.rejectedTody}</span>

              <p>Lost Time:</p><span>${workeTimes.todayLostTime.toFixed(
                2
              )}</span>         
    `;
    weeklySummary.innerHTML = `
    <h4>Week</h4>
              <p>Repaires:</p>
              <span>${repairUnits.completedWeekly}</span>
              <p>Pendings:</p><span>${repairUnits.pendingWeekly}</span>
              <p>Quotes:</p><span>${repairUnits.quotedWeekly}</span>
              <p>Yeild:</p><span>${calYield(
                repairUnits.completedWeekly,
                repairUnits.rejectedWeekly
              )}%</span>
              <p>Lost Time:</p><span>${workeTimes.weekLostTime}</span>         
    `;
  }

  // calculate the Yield
  function calYield(repairedUnits, rejectedUnits) {
    if (!repairedUnits || !rejectedUnits) return 100;
    return ((repairedUnits - rejectedUnits) * 100) / repairedUnits;
  }
  function calPercentage(timeRepaired, timeLost, timeRequired) {
    if (!timeRequired) return 0;
    const result = (((timeLost + timeRepaired) * 100) / timeRequired).toFixed(
      0
    );

    return result;
  }

  function limitValue(value) {
    if (!value) return 0;

    let newValue;
    value >= 150 ? (newValue = 140) : (newValue = value);
    return newValue;
  }

  function edit({ date, rma, type, status, id }, parentUIElement) {
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    day = day < 10 ? "0" + day : day;
    month = month < 10 ? "0" + month : month;
    const tr = document.createElement("tr");
    tr.setAttribute("data-id", id);
    tr.className = "update";
    if (type !== "hours")
      tr.innerHTML = `

            
            <td class="edit-date"><input type="date" value="${year}-${month}-${day}" style="width=5rem" /></td>
            <td><input type="number" value="${rma}" /></td>
            <td>
              <select>
               ${addOptionsToSelects(types, type)}
              </select>
            </td>
            <td>
              <select >
                ${addOptionsToSelects(statuses, status)}
              </select>
            </td>

            <td>
              <span class="update-btn" style="color: #e53156" data-id="${id}">Update </span>
             
            </td> `;
    else
      tr.innerHTML = `

            
            <td class="edit-date"><input type="date" value="${year}-${month}-${day}" style="width=5rem" /></td>
            <td><input type="number" value="${rma}" /></td>
            <td>
           
               ${type}
           
            </td>
            <td>
           
                ${status}
          
            </td>

            <td>
              <span class="update-btn" style="color: #e53156" data-id="${id}">Update </span>
             
            </td> `;
    parentUIElement.after(tr);
    parentUIElement.remove();
  }

  function updateRepairInUI(
    { rma, type, status, date, id },
    parentUIElement,
    action
  ) {
    date = formatDate(date);
    const tr = document.createElement("tr");
    tr.setAttribute("data-id", id);
    tr.innerHTML = `
            <td>1</td>
            <td>${date}</td>
            <td>${rma}</td>
            <td>${type}</td>
            <td>${status}</td>
            <td>
              <span data-id="${id}" class="btn-edit" style="color: #179cad"
                ><i class="fa-solid fa-pencil"></i>
              </span>
              <span data-id="${id}" class="btn-delete" style="color: #e53156">
                <i class="fa-solid fa-trash"></i>
                </span>
                <span class="hiddenID">${id}</span>
              </td>
              `;
    if (action === "add") {
      dataTableBody.appendChild(tr);
    }

    if (action === "update") {
      parentUIElement.after(tr);
      parentUIElement.remove();
    }

    if (action === "delete") {
      parentUIElement.after(tr);
      parentUIElement.remove();
    }
  }

  function clearTableData() {
    dataTableBody.innerHTML = "";
  }

  function addRepaireDataToUI({ rma, type, status, date, id }, parent) {
    date = formatDate(date);
    const tr = document.createElement("tr");
    tr.className = type;
    tr.innerHTML = `
            
            <td>${date}</td>
            <td>${rma}</td>
            <td>${capitalize(type)}</td>
            <td>${capitalize(status)}</td>
            <td>
              <span data-id="${id}" class="btn-edit" style="color: #179cad"
                ><i class="fa-solid fa-pencil"></i>
              </span>
              <span data-id="${id}" class="btn-delete" style="color: #e53156">   
      <i class="fa-solid fa-trash"></i>
                </span>
                
              
              </td>
              `;
    if (parent) {
      parent.after(tr);
      parent.remove();
    } else {
      dataTableBody.prepend(tr);
    }
  }

  // after data written to UI from database

  function addOptionsToSelects(arr, selectedVal) {
    let options = "";

    arr.forEach((el) => {
      // el.toUppercase()
      options =
        options +
        `<option value="${el}" ${
          el === selectedVal ? "selected" : ""
        } >${capitalize(el)}</option>`;
    });

    return options;
  }

  return {
    setUISummary,
    edit,
    updateRepairInUI,
    addRepaireDataToUI,
    addOptionsToSelects,
    clearTableData,
  };
})();
