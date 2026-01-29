const SupportFunctions = (function () {
  function getISOWeekNumber(d) {
    /**
     * Get the ISO 8601 week number of a given date.
     * @param {Date} d The date to get the week number for.
     * @returns {number} The ISO week number (1-53).
     */

    // Copy date so don't modify original
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    // Return the week number
    return weekNo;
  }

  return { getISOWeekNumber };
})();
