(() => {
    const storage_key = "restaurantActivityLogs";
    const updates = new BroadcastChannel("live-updates");

    function dayKey(value = new Date()) {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return "";

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function getEntries() {
        const entries = JSON.parse(localStorage.getItem(storage_key) || "[]");
        if (!Array.isArray(entries)) {
            throw new TypeError("Saved restaurant activity logs must be an array.");
        }
        return entries;
    }

    function record(category, action, details, timestamp = new Date()) {
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        if (Number.isNaN(date.getTime())) {
            throw new RangeError("Activity log timestamp must be a valid date.");
        }

        const entry = {
            id: `${date.getTime()}-${Math.random().toString(36).slice(2)}`,
            timestamp: date.toISOString(),
            category,
            action,
            details
        };
        const entries = getEntries();
        entries.push(entry);
        localStorage.setItem(storage_key, JSON.stringify(entries));
        updates.postMessage({ type: "activity-log-added" });
        return entry;
    }

    window.restaurantLogs = Object.freeze({ dayKey, getEntries, record });
})();