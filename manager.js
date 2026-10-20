const transfer_data = new BroadcastChannel('live-updates');
const account_btn = document.querySelector("#account_details");
const attendance_btn = document.querySelector("#attendance");
const history_btn = document.querySelector("#history");
const inventory_btn = document.querySelector("#inventory_btn");
const welcome_page = document.querySelector(".welcome");
const logs_btn = document.querySelector("#logs_btn");
const greeting = document.querySelector(".greeting");

const account_page = document.querySelector(".account-details");
const attendance_page = document.querySelector(".staff-attendance");
const history_page = document.querySelector(".order-history");
const history_list = document.querySelector(".history-list");
const attendance_list = document.querySelector(".attendance-list");
const logs_page = document.querySelector(".logs");
const logs_list = document.querySelector(".logs-list");
const logs_date_filter = document.querySelector("#logs-date-filter");
const logs_category_filter = document.querySelector("#logs-category-filter");

const managerNameInput = document.querySelector("#manager-name");
const managerEmailInput = document.querySelector("#manager-email");
const managerPasswordInput = document.querySelector("#manager-passward");
const managerNameDisplay = document.querySelector("#manager-name-display");
const infoNameDisplay = document.querySelector("#info-name");
const managerEditForm = document.querySelector("#manager-edit-form");

const order_no = document.querySelector(".order-no");
const meals = document.querySelector(".meals");
const money = document.querySelector("#gross-sales");
const return_cash = document.querySelector("#return");
const net_sales = document.querySelector("#net");
const total_returned_cash = document.querySelector("#total-returned-cash");
const total_sales = document.querySelector("#total-sales");

const returned_btn = document.querySelector("#returned_btn");
const return_page = document.querySelector(".orders-returned");
const returned_history_list = return_page.querySelector(".history-list");

const accepted_btn = document.querySelector("#accepted");
const accepted_page = document.querySelector(".orders-confirmed");
const confirmed_history_list = accepted_page.querySelector(".history-list");
const stock_page = document.querySelector(".stock-inventory");
const stock_list = document.querySelector("#stock-list");

const dashboard_staff_count = document.querySelector("#dash-staff-count");
const dashboard_order_count = document.querySelector("#dash-order-count");
const dashboard_confirmed_count = document.querySelector("#dash-confirmed-count");
const dashboard_net_sales = document.querySelector("#dash-net-sales");
const dashboard_on_duty_count = document.querySelector("#dash-on-duty-count");
const dashboard_on_duty_label = document.querySelector("#dash-on-duty-label");
const dashboard_off_duty_count = document.querySelector("#dash-off-duty-count");
const dashboard_staff_progress = document.querySelector("#dash-staff-progress");
const dashboard_recent_orders = document.querySelector("#dash-recent-orders");

const sidebar_toggle = document.querySelector("#sidebar-toggle");
const dashboard_content = document.querySelector(".content");
const left_side_panel = document.querySelector(".left-side-panel");
const dashboard_low_stock_count = document.querySelector("#dash-low-stock-count");
const stock_item_count = document.querySelector("#stock-item-count");
const stock_unit_count = document.querySelector("#stock-unit-count");
const stock_low_count = document.querySelector("#stock-low-count");


const todays_date = document.querySelectorAll(".todays-date");
const date = new Date();
const formatted_date = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
}).replace(/,/g, "");

todays_date.forEach(element => {
    element.textContent = formatted_date;
});


//LOGS








const inventory_key = "restaurantInventory";
let today_key = window.restaurantLogs.dayKey();

function loadTodayRecords(storageKey, dateField) {
    const records = JSON.parse(localStorage.getItem(storageKey) || "[]");
    let migrated_legacy_records = false;

    records.forEach(record => {
        if (!record[dateField]) {
            record[dateField] = new Date().toISOString();
            migrated_legacy_records = true;
        }
    });

    if (migrated_legacy_records) {
        localStorage.setItem(storageKey, JSON.stringify(records));
    }

    return records.filter(record => window.restaurantLogs.dayKey(record[dateField]) === today_key);
}

let confirmed_orders = loadTodayRecords("confirmedOrders", "confirmedAt");
let staff_list = loadTodayRecords("staff_details", "lastActivityAt");

function getLogGroup(entry) {
    if (entry.category === "Attendance") {
        return { key: "attendance", label: "Staff attendance" };
    }
    if (entry.category === "Inventory") {
        return { key: "inventory", label: "Inventory changes" };
    }
    if (entry.category === "Orders" && entry.action === "Order confirmed") {
        return { key: "confirmed", label: "Orders confirmed" };
    }
    if (entry.category === "Orders" && entry.action === "Order sent for re-preparation") {
        return { key: "returned", label: "Orders returned" };
    }
    if (entry.category === "Orders" && entry.action === "Order refunded") {
        return { key: "refunded", label: "Orders refunded" };
    }
    return { key: `${entry.category}:${entry.action}`, label: `${entry.category}: ${entry.action}` };
}

function groupLogEntries(entries) {
    const groups = new Map();

    entries.forEach(entry => {
        const date_key = window.restaurantLogs.dayKey(entry.timestamp);
        const activity = getLogGroup(entry);
        const id = `${date_key}:${activity.key}`;
        let group = groups.get(id);

        if (!group) {
            group = { id, date: date_key, ...activity, entries: [] };
            groups.set(id, group);
        }
        group.entries.push(entry);
    });

    return [...groups.values()].map(group => ({
        ...group,
        entries: group.entries.sort((first, second) => new Date(second.timestamp) - new Date(first.timestamp))
    }));
}

function renderLogs() {
    const entries = window.restaurantLogs.getEntries()
        .sort((first, second) => new Date(second.timestamp) - new Date(first.timestamp));
    const current_date = logs_date_filter.value || "all";
    const available_dates = [...new Set(entries.map(entry => window.restaurantLogs.dayKey(entry.timestamp)))]
        .filter(Boolean);

    logs_date_filter.replaceChildren(new Option("All dates", "all"));
    available_dates.forEach(date_key => {
        const [year, month, day] = date_key.split("-").map(Number);
        const label = new Date(year, month - 1, day).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        });
        logs_date_filter.add(new Option(label, date_key));
    });
    logs_date_filter.value = available_dates.includes(current_date) ? current_date : "all";

    const category = logs_category_filter.value || "all";
    const filtered_entries = entries.filter(entry =>
        (logs_date_filter.value === "all" || window.restaurantLogs.dayKey(entry.timestamp) === logs_date_filter.value)
        && (category === "all" || entry.category === category)
    );
    const groups = groupLogEntries(filtered_entries);
    logs_list.replaceChildren();

    if (groups.length === 0) {
        const empty_message = document.createElement("p");
        empty_message.className = "empty-dashboard";
        empty_message.textContent = "No activity has been recorded for this selection.";
        logs_list.appendChild(empty_message);
        return;
    }

    groups.forEach(group => {
        const row = document.createElement("div");
        row.className = "log-row";
        row.dataset.logGroup = group.id;

        const [year, month, day] = group.date.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        const date_cell = document.createElement("span");
        date_cell.textContent = date.toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
        });

        const action_cell = document.createElement("span");
        action_cell.textContent = group.label;

        const details_link = document.createElement("a");
        details_link.href = "#";
        details_link.className = "log-details-link";
        details_link.textContent = `View details (${group.entries.length})`;
        details_link.setAttribute("aria-label", `View ${group.entries.length} ${group.label} records`);

        row.append(date_cell, action_cell, details_link);
        logs_list.appendChild(row);
    });
}

function showLogDetails(group) {
    const content = document.createElement("div");
    content.className = "log-detail-content";

    const heading = document.createElement("h2");
    heading.textContent = group.label;

    const metadata = document.createElement("p");
    const [year, month, day] = group.date.split("-").map(Number);
    const date_label = new Date(year, month - 1, day).toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric"
    });
    metadata.textContent = `${date_label} · ${group.entries.length} ${group.entries.length === 1 ? "record" : "records"}`;

    const details = document.createElement("div");
    details.className = "log-detail-events";
    group.entries.forEach(entry => {
        const event_card = document.createElement("section");
        event_card.className = "log-detail-event";

        const event_heading = document.createElement("h3");
        event_heading.textContent = entry.action;

        const event_time = document.createElement("p");
        event_time.className = "log-detail-event-time";
        event_time.textContent = new Date(entry.timestamp).toLocaleTimeString("en-US", {
            hour: "numeric", minute: "2-digit"
        });

        const event_fields = document.createElement("div");
        event_fields.className = "log-detail-fields";
        appendLogDetails(event_fields, entry.details);

        event_card.append(event_heading, event_time, event_fields);
        details.appendChild(event_card);
    });

    content.append(heading, metadata, details);
    new window.WinBox({
        title: "Activity log details",
        width: "600px",
        height: "480px",
        x: "center",
        y: "center",
        mount: content
    });
}

function formatLogLabel(key) {
    const labels = {
        orderNumber: "Order number",
        table: "Table",
        table_number: "Table",
        items: "Items",
        Starter: "Item",
        qty: "Quantity",
        prices: "Line total",
        total: "Order total",
        payment: "Payment method",
        staff: "Staff member",
        role: "Role",
        shift: "Shift",
        item: "Menu item",
        changes: "Stock changes",
        change: "Quantity change",
        previousQuantity: "Previous quantity",
        newQuantity: "New quantity"
    };

    return labels[key] || key
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, character => character.toUpperCase());
}

function formatLogValue(key, value) {
    if (value === null || value === undefined || value === "") return "Not recorded";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number" && ["total", "prices"].includes(key)) {
        return `Shs. ${value.toLocaleString()}`;
    }
    if (typeof value === "number" && key === "change") {
        const sign = value > 0 ? "+" : "";
        return `${sign}${value.toLocaleString()} units`;
    }
    return String(value);
}

function appendLogDetails(container, details) {
    if (!details || typeof details !== "object") {
        const value = document.createElement("p");
        value.className = "log-detail-value";
        value.textContent = formatLogValue("", details);
        container.appendChild(value);
        return;
    }

    Object.entries(details).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            const group = document.createElement("section");
            group.className = "log-detail-group";

            const group_heading = document.createElement("h3");
            group_heading.textContent = formatLogLabel(key);
            group.appendChild(group_heading);

            const list = document.createElement("div");
            list.className = "log-detail-list";
            value.forEach(item => {
                const item_content = document.createElement("div");
                item_content.className = "log-detail-card";
                appendLogDetails(item_content, item);
                list.appendChild(item_content);
            });
            group.appendChild(list);
            container.appendChild(group);
            return;
        }

        if (value && typeof value === "object") {
            const group = document.createElement("section");
            group.className = "log-detail-group";

            const group_heading = document.createElement("h3");
            group_heading.textContent = formatLogLabel(key);
            group.append(group_heading);
            appendLogDetails(group, value);
            container.appendChild(group);
            return;
        }

        const field = document.createElement("div");
        field.className = "log-detail-field";

        const label = document.createElement("strong");
        label.textContent = formatLogLabel(key);

        const field_value = document.createElement("span");
        field_value.textContent = formatLogValue(key, value);

        field.append(label, field_value);
        container.appendChild(field);
    });
}

logs_date_filter.addEventListener("change", renderLogs);
logs_category_filter.addEventListener("change", renderLogs);
logs_list.addEventListener("click", event => {
    const details_link = event.target.closest(".log-details-link");
    if (!details_link) return;

    event.preventDefault();
    const row = details_link.closest(".log-row");
    const group = groupLogEntries(window.restaurantLogs.getEntries())
        .find(log_group => log_group.id === row.dataset.logGroup);
    if (group) showLogDetails(group);
});

function loadInventory() {
    const saved_inventory = JSON.parse(localStorage.getItem(inventory_key) || "{}");
    const current_inventory = {};

    Object.values(restaurantMenu).forEach(category => {
        Object.keys(category).forEach(itemName => {
            const quantity = Number(saved_inventory[itemName]);
            current_inventory[itemName] = Number.isSafeInteger(quantity) && quantity >= 0
                ? quantity
                : 0;
        });
    });

    localStorage.setItem(inventory_key, JSON.stringify(current_inventory));
    return current_inventory;
}

let inventory = loadInventory();

function updateInventorySummary() {
    const quantities = Object.values(inventory);
    const low_stock_count = quantities.filter(quantity => quantity <= 5).length;

    stock_item_count.textContent = quantities.length;
    stock_unit_count.textContent = quantities.reduce((total, quantity) => total + quantity, 0).toLocaleString();
    stock_low_count.textContent = low_stock_count;
    dashboard_low_stock_count.textContent = low_stock_count;
}

function renderInventory() {
    stock_list.replaceChildren();

    Object.entries(restaurantMenu).forEach(([categoryName, items]) => {
        Object.entries(items).forEach(([itemName, price]) => {
            const row = document.createElement("div");
            row.className = "stock-table stock-table-row";

            const category = document.createElement("span");
            category.className = "stock-category";
            category.textContent = categoryName;

            const name = document.createElement("strong");
            name.className = "stock-item-name";
            name.textContent = itemName;

            const item_price = document.createElement("span");
            item_price.textContent = `Shs. ${price.toLocaleString()}`;

            const on_hand = document.createElement("span");
            const quantity = inventory[itemName];
            on_hand.className = quantity === 0 ? "stock-status stock-out" : quantity <= 5 ? "stock-status stock-low" : "stock-status stock-available";
            on_hand.textContent = quantity === 0 ? "Out of stock" : quantity <= 5 ? `${quantity} · Low` : `${quantity} · In stock`;

            const stock_control = document.createElement("div");
            stock_control.className = "stock-control";

            const input = document.createElement("input");
            input.type = "number";
            input.min = "0";
            input.step = "1";
            input.value = quantity;
            input.setAttribute("aria-label", `On-hand quantity for ${itemName}`);

            const save_button = document.createElement("button");
            save_button.type = "button";
            save_button.className = "stock-save";
            save_button.dataset.item = itemName;
            save_button.textContent = "Save";

            stock_control.append(input, save_button);
            row.append(category, name, item_price, on_hand, stock_control);
            stock_list.appendChild(row);
        });
    });

    updateInventorySummary();
}

function updateWelcomeDashboard() {
    const on_duty = staff_list.filter(person => person.Status === "Logged In").length;
    const confirmed_count = confirmed_orders.filter(order => order.status_value === "Confirmed").length;
    const returned_sales = confirmed_orders
        .filter(order => order.status_value === "Cash Returned")
        .reduce((sum, order) => sum + getOrderTotal(order), 0);
    const gross_sales = confirmed_orders.reduce((sum, order) => sum + getOrderTotal(order), 0);
    const off_duty = staff_list.length - on_duty;

    dashboard_staff_count.textContent = on_duty;
    dashboard_order_count.textContent = confirmed_orders.length;
    dashboard_confirmed_count.textContent = confirmed_count;
    dashboard_net_sales.textContent = `Shs. ${(gross_sales - returned_sales).toLocaleString()}`;
    dashboard_on_duty_count.textContent = on_duty;
    dashboard_on_duty_label.textContent = on_duty;
    dashboard_off_duty_count.textContent = off_duty;
    dashboard_staff_progress.style.width = staff_list.length
        ? `${(on_duty / staff_list.length) * 100}%`
        : "0%";
    dashboard_low_stock_count.textContent = Object.values(inventory)
        .filter(quantity => quantity <= 5).length;

    dashboard_recent_orders.replaceChildren();
    const recent_orders = confirmed_orders.slice(-4).reverse();

    if (recent_orders.length === 0) {
        const empty_message = document.createElement("p");
        empty_message.className = "empty-dashboard";
        empty_message.textContent = "No orders have been recorded yet.";
        dashboard_recent_orders.appendChild(empty_message);
        return;
    }

    recent_orders.forEach(order => {
        const row = document.createElement("div");
        row.className = "recent-order";

        const order_details = document.createElement("div");
        const order_name = document.createElement("p");
        order_name.className = "recent-order-name";
        order_name.textContent = `Order ${order.orderNumber}`;
        const table_number = document.createElement("p");
        table_number.className = "recent-order-table";
        table_number.textContent = `Table ${order.table_number}`;
        order_details.append(order_name, table_number);

        const order_total = document.createElement("p");
        order_total.className = "recent-order-name";
        order_total.textContent = `Shs. ${getOrderTotal(order).toLocaleString()}`;

        const order_status = document.createElement("span");
        order_status.className = "recent-order-status";
        order_status.textContent = order.status_value || "Pending";

        row.append(order_details, order_total, order_status);
        dashboard_recent_orders.appendChild(row);
    });
}


function showdiv(divToShow) {
    welcome_page.style.visibility = divToShow === "welcome" ? "visible" : "hidden";
    account_page.style.display = divToShow === "account" ? "block" : "none";
    attendance_page.style.display = divToShow === "attendance" ? "block" : "none";
    history_page.style.display = divToShow === "history" ? "block" : "none";
    return_page.style.display = divToShow === "returned" ? "block" : "none";
    accepted_page.style.display = divToShow === "confirmed" ? "block" : "none";
    stock_page.style.display = divToShow === "inventory" ? "block" : "none";
    logs_page.style.display = divToShow === "logs" ? "block" : "none";
}

sidebar_toggle.addEventListener("click", () => {
    const is_expanded = sidebar_toggle.getAttribute("aria-expanded") === "true";
    dashboard_content.classList.toggle("sidebar-collapsed", is_expanded);
    left_side_panel.inert = is_expanded;
    sidebar_toggle.setAttribute("aria-expanded", String(!is_expanded));
    sidebar_toggle.setAttribute("aria-label", is_expanded ? "Expand navigation" : "Collapse navigation");
    sidebar_toggle.querySelector("span").textContent = is_expanded ? "›" : "‹";
});

account_btn.addEventListener("click", () => {
    showdiv("account");
})

managerEditForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const newName = managerNameInput.value.trim();
    const newEmail = managerEmailInput.value.trim();
    const newPassword = managerPasswordInput.value.trim();

    if (!newName || !newEmail || !newPassword) {
        alert("Please fill in all fields");
        return;
    }

    managerNameDisplay.textContent = newName;
    infoNameDisplay.textContent = newName;
    document.querySelector(".name").textContent = newName;

    alert("Account details updated successfully");
});

attendance_btn.addEventListener("click", () => {
    showdiv("attendance");
})

history_btn.addEventListener("click", () => {
    showdiv("history");
})

returned_btn.addEventListener("click", () => {
    showdiv("returned");
})

accepted_btn.addEventListener("click", () => {
    showdiv("confirmed");
})

inventory_btn.addEventListener("click", () => {
    showdiv("inventory");
})

logs_btn.addEventListener("click", () => {
    showdiv("logs");
})

document.querySelector("#dashboard-attendance").addEventListener("click", () => {
    showdiv("attendance");
});

document.querySelector("#dashboard-orders").addEventListener("click", () => {
    showdiv("history");
});

document.querySelector("#dashboard-logs").addEventListener("click", () => {
    showdiv("logs");
});

document.querySelector("#dashboard-see-orders").addEventListener("click", () => {
    showdiv("history");
});

document.querySelector("#dashboard-see-staff").addEventListener("click", () => {
    showdiv("attendance");
});

document.querySelector("#dashboard-see-inventory").addEventListener("click", () => {
    showdiv("inventory");
});

document.querySelector("#stock-add-link").addEventListener("click", () => {
    showdiv("inventory");
    stock_list.querySelector("input")?.focus();
});

stock_list.addEventListener("click", event => {
    const save_button = event.target.closest(".stock-save");
    if (!save_button) return;

    const input = save_button.parentElement.querySelector("input");
    const quantity = Number(input.value);
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
        alert("Enter a whole stock quantity of zero or more.");
        input.focus();
        return;
    }

    const item = save_button.dataset.item;
    const previous_quantity = inventory[item];
    inventory[item] = quantity;
    localStorage.setItem(inventory_key, JSON.stringify(inventory));
    window.restaurantLogs.record("Inventory", "Stock quantity updated", {
        item,
        previousQuantity: previous_quantity,
        newQuantity: quantity,
        change: quantity - previous_quantity
    });
    transfer_data.postMessage({ type: "inventory-updated", data: inventory });
    renderInventory();
    renderLogs();
    updateWelcomeDashboard();
});

function showAttendanceData(list) {
    attendance_list.querySelectorAll(":scope > .attendance-row").forEach(staff_row => staff_row.remove());
    // attendance_list.innerHTML = "";

    list.forEach(person => {
        const staff_row = document.createElement("div");
        staff_row.className = "attendance-row";

        const staff_name = document.createElement("p");
        staff_name.textContent = person.staff;

        const staff_role = document.createElement("p");
        staff_role.textContent = person.role;

        const staff_shift = document.createElement("p");
        staff_shift.textContent = person.shift;

        const staff_status = document.createElement("p");
        staff_status.textContent = person.Status;
        staff_status.className = "staff-status-color";

        if (person.Status === "Logged Out") {
            staff_status.style.color = "red";
        }
        else {
            staff_status.style.color = "rgb(0, 26, 255)";
        }

        const staff_logIn = document.createElement("p");
        staff_logIn.textContent = person.time;

        const staff_logOut = document.createElement("p");
        staff_logOut.textContent = person.time_out;        

        staff_row.append(staff_name, staff_role, staff_shift, staff_status, staff_logIn, staff_logOut);
        attendance_list.appendChild(staff_row);
    });
}

const change_greeting = new Date().getHours();

if(change_greeting < 12) {
    greeting.textContent = `Good morning, Ms. Sofia`;
}

else if (change_greeting < 16 ) {
    greeting.textContent = `Good afternoon, Ms. Sofia`;
}

else {
    greeting.textContent = `Good evening, Ms. Sofia`;
}




function getOrderTotal(order) {
    return Number(String(order.total).replace(/,/g, "")) || 0;
}

function updateTotals(orderHistory) {
    const gross_sales = orderHistory.reduce((sum, order) => sum + getOrderTotal(order), 0);
    const returned_cash = orderHistory
        .filter(order => order.status_value === "Cash Returned")
        .reduce((sum, order) => sum + getOrderTotal(order), 0);
    const confirmed_sales = orderHistory
        .filter(order => order.status_value === "Confirmed")
        .reduce((sum, order) => sum + getOrderTotal(order), 0);

    money.textContent = `Gross sales: shs. ${gross_sales.toLocaleString()}`;
    return_cash.textContent = `Cash Returned: shs. ${returned_cash.toLocaleString()}`;
    net_sales.textContent = `Net Sales: shs. ${(gross_sales - returned_cash).toLocaleString()}`;
    total_returned_cash.textContent = `Total Cash Returned: shs. ${returned_cash.toLocaleString()}`;
    total_sales.textContent = `Total Sales: shs. ${confirmed_sales.toLocaleString()}`;
}


function add_to_orderList(orderHistory) {
    history_list.querySelectorAll(":scope > .hello").forEach(order_container => order_container.remove());
    returned_history_list.querySelectorAll(":scope > .hello").forEach(order_container => order_container.remove());
    confirmed_history_list.querySelectorAll(":scope > .hello").forEach(order_container => order_container.remove());
    updateTotals(orderHistory);

    orderHistory.forEach(order => {
        const order_container = document.createElement("div");
        history_list.appendChild(order_container);
        order_container.classList.add("hello");

        const order_number = document.createElement("strong");
        order_container.appendChild(order_number);
        order_number.textContent = `Order ${order.orderNumber}`;
        order_number.className = "order-number";

        const order_items = document.createElement("div");
        order_items.className = "order-items";
        order_container.appendChild(order_items);

        order.items.forEach(item => {
            const meal = document.createElement("p");
            order_items.appendChild(meal);
            meal.textContent = `${item.Starter} shs. ${item.prices} Qty: ${item.qty}`;
        });

        const total = document.createElement("p");
        order_items.appendChild(total);
        total.textContent = `Total: shs.${order.total}`;

        const table_number = document.createElement("p");
        order_container.appendChild(table_number);
        table_number.textContent = `Table  ${order.table_number}`; 
        table_number.className = "table-number";
        
        const status_word = document.createElement("p");
        order_container.appendChild(status_word);
        status_word.textContent = `${order.status_value}`; 
        status_word.className = "status-word";

        const payment_word = document.createElement("p");
        order_container.appendChild(payment_word);
        payment_word.textContent = order.payment || "Not recorded"; 
        payment_word.className = "payment-word";

        if (order.status_value !== "Confirmed") {
            returned_history_list.appendChild(order_container.cloneNode(true));
        }

        if (order.status_value == "Confirmed") {
            confirmed_history_list.appendChild(order_container.cloneNode(true));
        }
    });
}


//for only saved data locally
window.addEventListener("DOMContentLoaded", () => {
    add_to_orderList(confirmed_orders);
    showAttendanceData(staff_list);
    renderInventory();
    renderLogs();
    updateWelcomeDashboard();
})

window.addEventListener("storage", event => {
    if (event.key === "restaurantActivityLogs") {
        renderLogs();
        return;
    }

    if (event.key === "confirmedOrders") {
        confirmed_orders = loadTodayRecords("confirmedOrders", "confirmedAt");
        add_to_orderList(confirmed_orders);
        updateWelcomeDashboard();
    }

    if (event.key === "staff_details") {
        staff_list = loadTodayRecords("staff_details", "lastActivityAt");
        showAttendanceData(staff_list);
        updateWelcomeDashboard();
    }
});

function refreshDashboardDay() {
    const current_day = window.restaurantLogs.dayKey();
    if (current_day === today_key) return;

    today_key = current_day;
    todays_date.forEach(element => {
        element.textContent = new Date().toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        }).replace(/,/g, "");
    });
    confirmed_orders = loadTodayRecords("confirmedOrders", "confirmedAt");
    staff_list = loadTodayRecords("staff_details", "lastActivityAt");
    add_to_orderList(confirmed_orders);
    showAttendanceData(staff_list);
    updateWelcomeDashboard();
}

window.addEventListener("focus", refreshDashboardDay);
window.setInterval(refreshDashboardDay, 60_000);


transfer_data.onmessage = (event) => {
    const messageType = event.data?.type;
    const messageData = event.data?.data;

    if (messageType === "activity-log-added") {
        renderLogs();
        return;
    }

    if (messageType === "inventory-updated" && messageData) {
        inventory = messageData;
        renderInventory();
        updateWelcomeDashboard();
        return;
    }

    if (messageType === "LOGS") {
        if (Array.isArray(messageData)) {
            staff_list = loadTodayRecords("staff_details", "lastActivityAt");
            showAttendanceData(staff_list);
            updateWelcomeDashboard();
        }
        return;
    }

    if (messageType === 'order-returned') {
        const returned_order = confirmed_orders.find(
            order => Number(order.table_number) === Number(event.data.table_number)
        );

        if (returned_order) {
            returned_order.status_value = "Re-prepared";
            localStorage.setItem("confirmedOrders", JSON.stringify(confirmed_orders));
            add_to_orderList(confirmed_orders);
            updateWelcomeDashboard();
        }

        return;
    }

    if (messageType === 'Sign-out') {
        const update_status = staff_list.find(
            staff => staff.staff === event.data.data.staff
        );

        if (update_status) {
            update_status.Status = event.data.data.Status;
            update_status.time_out = event.data.data.time_out;
            update_status.lastActivityAt = event.data.data.lastActivityAt;
            localStorage.setItem("staff_details", JSON.stringify(staff_list));
            showAttendanceData(staff_list);
            updateWelcomeDashboard();
        }

        return;
    }

    if (messageType === 'cash-returned') {
        const cash_return = confirmed_orders.find(
            order => Number(order.table_number) === Number(event.data.table_number)
        )

        if (cash_return) {
            cash_return.status_value = "Cash Returned";
            localStorage.setItem("confirmedOrders", JSON.stringify(confirmed_orders));
            add_to_orderList(confirmed_orders);
            updateWelcomeDashboard();
        }
        return;
    }

    if (messageType !== 'confirmed-order') return;

    confirmed_orders = loadTodayRecords("confirmedOrders", "confirmedAt");
    add_to_orderList(confirmed_orders);
    updateWelcomeDashboard();
}

// localStorage.clear();
