const transfer_data = new BroadcastChannel('live-updates');
const account_btn = document.querySelector("#account_details");
const attendance_btn = document.querySelector("#attendance");
const history_btn = document.querySelector("#history");
const welcome_page = document.querySelector(".welcome");
const greeting = document.querySelector(".greeting");

const account_page = document.querySelector(".account-details");
const attendance_page = document.querySelector(".staff-attendance");
const history_page = document.querySelector(".order-history");
const history_list = document.querySelector(".history-list");
const attendance_list = document.querySelector(".attendance-list");

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


let confirmed_orders = JSON.parse(localStorage.getItem("confirmedOrders") || "[]");
let staff_list = JSON.parse(localStorage.getItem("staff_details")) || [];


function showSection(sectionToShow) {
    welcome_page.style.visibility = sectionToShow === "welcome" ? "visible" : "hidden";
    account_page.style.display = sectionToShow === "account" ? "block" : "none";
    attendance_page.style.display = sectionToShow === "attendance" ? "block" : "none";
    history_page.style.display = sectionToShow === "history" ? "block" : "none";
    return_page.style.display = sectionToShow === "returned" ? "block" : "none";
    accepted_page.style.display = sectionToShow === "confirmed" ? "block" : "none";
}

account_btn.addEventListener("click", () => {
    showSection("account");
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
    showSection("attendance");
})

history_btn.addEventListener("click", () => {
    showSection("history");
})

returned_btn.addEventListener("click", () => {
    showSection("returned");
})

accepted_btn.addEventListener("click", () => {
    showSection("confirmed");
})

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
    greeting.textContent = `Good morning, Mr.Telsa`;
}

else if (change_greeting < 16 ) {
    greeting.textContent = `Good afternoon, Mr.Telsa`;
}

else {
    greeting.textContent = `Good evening, Mr.Telsa`;
}


//ADD A SETTING WHERE AFTER 24 HOURS AN ORDERS CLEAR
//ADD A LOGGED OUT SECTION FOR STAFF AND ALSO ADD WELCOME STAFF NAME IN MENU AND LOGOUT BUTTON


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

        const order_number = document.createElement("p");
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

// localStorage.clear();

//for only saved data locally
window.addEventListener("DOMContentLoaded", () => {
    add_to_orderList(confirmed_orders);
    showAttendanceData(staff_list);
})


transfer_data.onmessage = (event) => {
    const messageType = event.data?.type;
    const messageData = event.data?.data;

    if (messageType === "LOGS") {
        if (Array.isArray(messageData)) {
            staff_list = messageData;
            localStorage.setItem("staff_details", JSON.stringify(staff_list));
            showAttendanceData(staff_list);
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
            localStorage.setItem("staff_details", JSON.stringify(staff_list));
            showAttendanceData(staff_list);
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
        }
        return;
    }

    if (messageType !== 'confirmed-order') return;

    const incoming_order = event.data.order;
    const already_received = confirmed_orders.some(
        order => order.orderNumber === incoming_order.orderNumber
    );

    if (!already_received) {
        confirmed_orders.push(incoming_order);
    }
    add_to_orderList(confirmed_orders);
}

// localStorage.clear();
