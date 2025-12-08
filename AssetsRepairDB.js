// A module for handling all IndexedDB operations for the AssetsRepaireDB
const AssetsRepaireDB = (function () {
  const DB_NAME = "AssetsRepaireDB";
  const STORE_NAME = "repaires";
  const STORE_NAME_WEEK = "weeks";
  const DB_VERSION = 4;
  let db = null;

  /**
   * Opens the IndexedDB and sets up the object store if needed.
   * @returns {Promise<IDBDatabase>} The database instance.
   */
  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function (event) {
        // This event is the only place where the database schema can be changed.
        db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          // Create an object store with 'id' as the keyPath and auto-incrementing keys.
          const objectStore = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });

          // Create indexes for efficient querying on other fields
          objectStore.createIndex("rma", "rma", { unique: false });
          objectStore.createIndex("type", "type", { unique: false });
          objectStore.createIndex("status", "status", { unique: false });
          objectStore.createIndex("previousState", "previousState", {
            unique: false,
          });
          objectStore.createIndex("date", "date", { unique: false });
          console.log("Object store and indexes created.");
        }
        if (!db.objectStoreNames.contains(STORE_NAME_WEEK)) {
          const objectStore = db.createObjectStore(STORE_NAME_WEEK, {
            keyPath: "id",
            autoIncrement: true,
          });
          objectStore.createIndex("date", "date", { unique: true });
          objectStore.createIndex("Monday", "Monday", { unique: false });
          objectStore.createIndex("Tuesday", "Tuesday", { unique: false });
          objectStore.createIndex("Wednesday", "Wednesday", { unique: false });
          objectStore.createIndex("Thursday", "Thursday", { unique: false });
          objectStore.createIndex("Friday", "Friday", { unique: false });
          objectStore.createIndex("Saturday", "Saturday", { unique: false });
          objectStore.createIndex("Sunday", "Sunday", { unique: false });
          objectStore.createIndex("week", "week", { unique: false });
        }
      };

      request.onsuccess = function (event) {
        db = event.target.result;
        resolve(db);
      };

      request.onerror = function (event) {
        reject("Database error: " + event.target.errorCode);
      };
    });
  }

  /**
   * Adds a new repaire record to the database (CREATE).
   * @param {object} repaireData - The data for the new repaire (excluding 'id' and 'date').
   * @returns {Promise<number>} The auto-incremented ID of the new record.
   */
  async function addRepaire(repaireData) {
    db = db || (await openDatabase());
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // Add date stamp to the data
      repaireData.date = new Date();

      const request = store.add(repaireData);

      request.onsuccess = function (event) {
        resolve(event.target.result); // The new auto-incremented ID
      };

      request.onerror = function (event) {
        reject("Add error: " + event.target.error);
      };
    });
  }

  /**
   * Retrieves a single repaire record by its ID (READ).
   * @param {number} id - The ID of the repaire record.
   * @returns {Promise<object|undefined>} The repaire object, or undefined if not found.
   */
  async function getRepaire(id) {
    db = db || (await openDatabase());
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = function (event) {
        resolve(event.target.result);
      };

      request.onerror = function (event) {
        reject("Get error: " + event.target.error);
      };
    });
  }

  /**
   * Retrieves all repaire records in the database (READ ALL).
   * @returns {Promise<Array<object>>} An array of all repaire objects.
   */
  async function getAllRepaires(displayedWeek = 0) {
    db = db || (await openDatabase());
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const { start, end } = getWeekDateRange(displayedWeek);

      // const keyRange = IDBKeyRange.bound(start, end);

      // const dateIndex = store.index("date");
      // const request = dateIndex.getAll(keyRange);
      const request = store.getAll();
      request.onsuccess = function (event) {
        resolve(event.target.result);
      };

      request.onerror = function (event) {
        reject("GetAll error: " + event.target.error);
      };
    });
  }

  async function getWeekRepaire(displayedWeek) {
    db = db || (await openDatabase());
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);

      const { start, end } = getWeekDateRange(displayedWeek);
      // Create a key range for the current week

      const keyRange = IDBKeyRange.bound(start, end);

      const index = store.index("date");
      const request = index.getAll(keyRange);
      request.onsuccess = function (event) {
        resolve(event.target.result);
      };

      request.onerror = function (event) {
        reject("GetWeedData error: " + event.target.error);
      };
    });
  }

  /**
   * Updates an existing repaire record (UPDATE).
   * Note: The object must contain the 'id' of the record to update.
   * @param {object} repaireData - The updated repaire data (must include 'id').
   * @returns {Promise<void>}
   */
  async function updateRepaire(repaireData) {
    db = db || (await openDatabase());
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const request = store.put(repaireData); // put() handles both add and update

      request.onsuccess = function (event) {
        resolve();
      };

      request.onerror = function (event) {
        reject("Update error: " + event.target.error);
      };
    });
  }

  /**
   * Deletes a repaire record by its ID (DELETE).
   * @param {number} id - The ID of the repaire record to delete.
   * @returns {Promise<void>}
   */
  async function deleteRepaire(id) {
    db = db || (await openDatabase());
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = function (event) {
        resolve();
      };

      request.onerror = function (event) {
        reject("Delete error: " + event.target.error);
      };
    });
  }

  function getWeekDateRange(displayedWeek = 0) {
    const date = new Date().setDate(new Date().getDate() + displayedWeek * 7);

    let today = new Date(date);

    today = new Date(today);
    const dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0); // Set to beginning of the day

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999); // Set to end of the day

    return { start: startOfWeek, end: endOfWeek };
  }

  async function addRepaire(repaireData) {
    db = db || (await openDatabase());
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // Add date stamp to the data
      repaireData.date = new Date();

      const request = store.add(repaireData);

      request.onsuccess = function (event) {
        resolve(event.target.result); // The new auto-incremented ID
      };

      request.onerror = function (event) {
        reject("Add error: " + event.target.error);
      };
    });
  }

  async function addWeek(displayedWeek = 0, week) {
    db = db || (await openDatabase());
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME_WEEK], "readwrite");
      const store = transaction.objectStore(STORE_NAME_WEEK);
      // 0 means getting date range of current week
      const { start, end } = getWeekDateRange(displayedWeek);
      console.log(week);
      console.trace();
      // adds days hours in week.week
      Object.keys(week).forEach((key) => {
        if (key !== "week") week.week += week[key];
      });
      week.date = start;

      const request = store.add(week);
      request.onsuccess = (event) => resolve(event.result);
      request.onerror = (event) => resolve(event.target.error);
    });
  }

  async function getWeek(date, displayedWeek) {
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
    db = db || (await openDatabase());
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME_WEEK], "readonly");
      const store = transaction.objectStore(STORE_NAME_WEEK);
      const { start, end } = getWeekDateRange(displayedWeek);
      let newDate = null;

      if (date) {
        newDate = new Date(date);
      } else newDate = start;

      const keyRange = IDBKeyRange.only(newDate);
      const dateIndex = store.index("date");
      const request = dateIndex.getAll(keyRange);
      request.onsuccess = (event) => {
        const res = event.target.result;
        resolve(res[0]);
      };
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async function updateWeek(week) {
    db = db || (await openDatabase());
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME_WEEK], "readwrite");
      const store = transaction.objectStore(STORE_NAME_WEEK);

      // adds days hours in week.week
      week.week = 0;
      Object.keys(week).forEach((key) => {
        if (key !== "week" && key !== "id" && key !== "date")
          week.week += week[key];
      });

      const request = store.put(week);
      request.onsuccess = (event) => {
        console.log("updated successfully");
        resolve(event.target.result);
      };
      request.onerror = (event) => reject(event.target.error);
    });
  }

  // Expose the public API
  return {
    openDatabase,
    addRepaire,
    getRepaire,
    getAllRepaires,
    updateRepaire,
    deleteRepaire,
    getWeekRepaire,
    addWeek,
    getWeek,
    updateWeek,
  };
})();
