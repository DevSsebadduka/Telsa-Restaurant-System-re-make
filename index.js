let Total = 0;
let discount = 0;
let activeMenu = null;
let staff_list = JSON.parse(localStorage.getItem("staff_details")) || [];
let logged_in_staff = null;

const transfer_data = new BroadcastChannel('live-updates');

const welcome_user = document.querySelector(".user");
const sign_out = document.querySelector(".user-out");

const container = document.createElement("div");
container.setAttribute("class", "container");
document.getElementsByClassName("order_sec")[0].appendChild(container);

const Grand_total = document.querySelector(".grand-total");
let table_no = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
const random_table = table_no[Math.floor(Math.random() * table_no.length)];

let orders = JSON.parse(localStorage.getItem('myorder') || '[]');
let my_clicked_btn = "";
let isServiceBtn_clicked = false;


// return order logic
const summary_page = document.querySelector(".order-summary");
const summary_box = document.querySelector(".order-details");

const return_box = document.querySelector(".return-box");
const return_btn = document.querySelector(".return-button");
let order_status = "Confirmed";

const get_records = JSON.parse(localStorage.getItem('confirmedOrders') || '[]');

function getRecordByTableno(tableNumber) {
    return get_records.find(order => Number(order.table_number) === Number(tableNumber)) || null;
}

function getRecordByFoodDetail(foodItems) {
    return get_records.find(record => {
        const order_items = record.items.map(item => item.Starter.toLowerCase());
        return foodItems.every(food => order_items.includes(food));
    }) || null;
}

return_btn.addEventListener("click", () => {
    const typed_value = return_box.value.trim();
    const typed_no = Number(typed_value);
    const record_no = getRecordByTableno(typed_no);

    if (record_no) {
        summary_box.innerHTML = "";

        const order_details = document.createElement("div");
        order_details.className = "detailed-orders";
        order_details.innerHTML = `
            <p>${record_no.orderNumber}</p>
            <div>${record_no.items.map(item =>
                `<p>${item.Starter} shs. ${item.prices} Qty ${item.qty}</p>`
            ).join("")}<p>Total: shs. ${record_no.total}</p></div>
            <p>${record_no.table_number}</p>
            <p>${record_no.payment}</p>
        `;
        summary_box.appendChild(order_details);

        const choose_buttons = document.querySelector(".choose-one");
        const write_return = document.querySelector(".write-return");
        const food_name = document.querySelector(".food-name");
        const food_input = document.querySelector("#food-name");
        const return_food = document.querySelector("#return-food");
        const return_all = document.querySelector("#return-all");

        choose_buttons.style.display = "flex";
        write_return.style.display = "none";
        return_food.style.display = "none";
        return_all.style.display = "none";

        document.querySelector(".remake").onclick = () => {
            choose_buttons.style.display = "none";
            write_return.style.display = "block";
            return_food.style.display = "block";
            return_all.style.display = "block";
            food_name.textContent = "Item/s to be remade: ";

            return_food.onclick = () => {
                const foods = food_input.value.toLowerCase().split(/[ ,]+/);
                if (getRecordByFoodDetail(foods)) {
                    alert(`Items ${foods.join(' ,')} have been returned for re-preparation.`);
                    record_no.status_value = "Re-prepared";
                    localStorage.setItem('confirmedOrders', JSON.stringify(get_records));

                    transfer_data.postMessage({
                        type: "order-returned",
                        table_number: record_no.table_number
                    });
                    location.reload();
                } else {
                    alert("Items do not match this order.");
                }
            };

            return_all.onclick = () => {
                alert("All food items have been returned for re-preparation.");
                record_no.status_value = "Re-prepared";
                localStorage.setItem('confirmedOrders', JSON.stringify(get_records));

                transfer_data.postMessage({
                    type: "order-returned",
                    table_number: record_no.table_number
                });
                location.reload();
            };
        };

        document.querySelector(".refund").onclick = () => {
            choose_buttons.style.display = "none";
            write_return.style.display = "block";
            return_food.style.display = "block";
            return_all.style.display = "block";
            food_name.textContent = "Item/s to be refunded: ";
            return_all.textContent = "Refund all";

            return_food.onclick = () => {
                const foods = food_input.value.toLowerCase().split(/[ ,]+/);
                if (getRecordByFoodDetail(foods)) {
                    alert(`Items ${foods.join(' ,')} have been refunded.`);
                    location.reload();

                    record_no.status_value = "Cash Returned";
                    localStorage.setItem('confirmedOrders', JSON.stringify(get_records));

                    transfer_data.postMessage({
                        type: "cash-returned",
                        table_number: record_no.table_number
                    });
                } else {
                    alert("Items do not match this order.");
                }
            };

            return_all.onclick = () => {
                alert("All food items have been refunded.");
                record_no.status_value = "Cash Returned";
                localStorage.setItem('confirmedOrders', JSON.stringify(get_records));

                transfer_data.postMessage({
                    type: "cash-returned",
                    table_number: record_no.table_number
                });
                location.reload();

            };
        };

        new window.WinBox({
            title: "Table Order Details",
            width: "620px",
            height: "480px",
            x: "center",
            y: "center",
            modal: true,
            mount: summary_page,
            class: "summary-box",
            onclose: () => {
                summary_box.innerHTML = "";
            }
        });

        return_box.value = "";
        return;
    }

    if (typed_value === "") {
        alert("Please enter a table number");
        return_box.focus();
    } else if (Number.isNaN(typed_no)) {
        alert("Please enter a valid table number");
        return_box.focus();
    } else {
        alert("The entered table number does not match our records");
        return_box.focus();
    }
});

function confirmCurrentOrder() {
    const confirmed_orders = JSON.parse(localStorage.getItem('confirmedOrders') || '[]');
    const confirmed_order = {
        table_number: random_table,
        orderNumber: confirmed_orders.length + 1,
        items: orders.map(order => ({ ...order })),
        total: Number(Total),
        status_value: order_status,
        payment: my_clicked_btn
    };

    confirmed_orders.push(confirmed_order);
    localStorage.setItem('confirmedOrders', JSON.stringify(confirmed_orders));
    transfer_data.postMessage({ type: 'confirmed-order', order: confirmed_order });

    orders = [];
    localStorage.removeItem('myorder');
}




//welcome user after login and sign out
document.addEventListener("DOMContentLoaded", () => {
    const get_data = localStorage.getItem('staff_details');
    staff_list = JSON.parse(get_data);
    logged_in_staff = staff_list.find(
        person => person.staff === localStorage.getItem("current_staff")
    );

    if (logged_in_staff) {
        welcome_user.textContent = `Welcome ${logged_in_staff.staff}`;
    }
});

sign_out.addEventListener("click", () => {
    let answer = confirm("Do you wish to sign out?");

    if (answer) {
        window.location.href = "menu_login.html";

        if (!logged_in_staff) return;

        logged_in_staff.Status = "Logged Out";
        logged_in_staff.time_out = new Date().toLocaleTimeString();
        localStorage.setItem("staff_details", JSON.stringify(staff_list));
        transfer_data.postMessage({
            type: "Sign-out",
            data: {
                staff: logged_in_staff.staff,
                Status: logged_in_staff.Status,
                time_out: logged_in_staff.time_out
            }
        });
        localStorage.removeItem("current_staff");
    }

    else {
        return;
    }    
})




//reset storage 


// const reset_storage_store = new Date().getHours;
// // if (reset_storage_store == 24) {
// //     localStorage.clear();
// // }

// localStorage.clear();




//                                  Starters menu
const food_items = {
    "Matooke": 2000,
    "Rice": 3000,
    "Pasta": 6000,
    "Posho": 4000,
    "Yams": 1000,
    "Pumpkin": 1000,
    "Cassava": 2000,
    
}

const starter_sec = document.getElementsByClassName("Starters")[0];
let heading1 = document.createElement("button");
starter_sec.appendChild(heading1);

const head_text = document.createTextNode("Starters");
heading1.appendChild(head_text);

const heading_atr = document.createAttribute("class");
heading_atr.value = "food-buttons";
heading1.setAttributeNode(heading_atr);

const starter_mini = document.createElement("div");
starter_mini.setAttribute("class", "food_mini_sec");
starter_sec.appendChild(starter_mini);

for (const food in food_items) {
    let food_btn = document.createElement("button");
    starter_mini.appendChild(food_btn);
    const food_names = document.createTextNode(food);
    food_btn.appendChild(food_names);

    const item_atr = document.createAttribute("class");
    item_atr.value = "starter";
    food_btn.setAttributeNode(item_atr);

    let count2 = 0
    let price2 = 0;



    let price_paragraph2;
    let qty_paragraph2;


    food_btn.onclick = function() {
        count2 = count2 + 1;
        Total += food_items[food_btn.textContent];
        price2 = food_items[food_btn.textContent] * count2;

        Grand_total.textContent = Total.toLocaleString();

        const existing_order = orders.find(order => order.Starter === food);

        if (existing_order) {
            existing_order.prices = price2;
            existing_order.qty = count2;
        }

        else {
            const new_order = {
                Starter: food,
                prices: price2,
                qty: count2,
            }
            orders.push(new_order);
        }


        if (count2 === 1) {
            let item2 = document.createElement("p");
            item2.textContent = food_btn.textContent;
            container.appendChild(item2);

            price_paragraph2 = document.createElement("p");
            price_paragraph2.textContent = "shs." + food_items[food_btn.textContent];
            container.appendChild(price_paragraph2);

            qty_paragraph2 = document.createElement("p");
            qty_paragraph2.textContent = count2;
            container.appendChild(qty_paragraph2);

            const item_atr = document.createAttribute("class");
            item_atr.value = "items";
            item2.setAttributeNode(item_atr);   

            const price_atr = document.createAttribute("class");
            price_atr.value = "items";
            price_paragraph2.setAttribute;
            price_paragraph2.setAttributeNode(price_atr);

            const qty_atr = document.createAttribute("class");
            qty_atr.value = "items";
            qty_paragraph2.setAttributeNode(qty_atr);
        } 
        else {
            qty_paragraph2.textContent = count2;
            price_paragraph2.textContent = "shs. " + price2;
        }

        localStorage.setItem('myorder', JSON.stringify(orders));
        transfer_data.postMessage(orders);
    }
}



//                                    Soups meun
const soups = {
    Meat: 4000,
    Liver: 5000,
    Beans: 3000,
    Fish: 5000,
    Nakati: 2000,
    Buga: 2000,
    SukamaWitch: 4000
};
const soup_sec = document.getElementsByClassName("Soups")[0];
const heading2 = document.createElement("button");
heading2.textContent = "Soups";
heading2.className = "food-buttons";
soup_sec.appendChild(heading2);

const soup_mini = document.createElement("div");
soup_mini.className = "food_mini_sec";
soup_sec.appendChild(soup_mini);

for (const food in soups) {
    const soup_btn = document.createElement("button");
    soup_btn.textContent = food;
    soup_btn.className = "starter";
    soup_mini.appendChild(soup_btn);

    let count1 = 0;
    let price1 = 0;

    let price_paragraph1;
    let qty_paragraph1;

    soup_btn.onclick = function() {
        count1 = count1 + 1;
        Total += soups[soup_btn.textContent];
        price1 = soups[soup_btn.textContent] * count1;
        Grand_total.textContent = Total.toLocaleString();


        const existing_order = orders.find(order => order.Starter === food);

        if (existing_order) {
            existing_order.prices = price1;
            existing_order.qty = count1;
        }

        else {
            const new_order = {
                Starter: food,
                prices: price1,
                qty: count1,
            }
            orders.push(new_order);
        }




        if (count1 === 1) {
            let item1 = document.createElement("p");
            item1.textContent = soup_btn.textContent;
            container.appendChild(item1);

            price_paragraph1 = document.createElement("p");
            price_paragraph1.textContent = "shs." + soups[soup_btn.textContent];
            container.appendChild(price_paragraph1);
            
            qty_paragraph1 = document.createElement("p");
            qty_paragraph1.textContent = count1;
            container.appendChild(qty_paragraph1);

            const item1_atr = document.createAttribute("class");
            item1_atr.value = "items";
            item1.setAttributeNode(item1_atr);

            const price_atr = document.createAttribute("class");
            price_atr.value = "items";
            price_paragraph1.setAttributeNode(price_atr);

            const qty_atr = document.createAttribute("class");
            qty_atr.value = "items";
            qty_paragraph1.setAttributeNode(qty_atr);
            
        }
        else {
            qty_paragraph1.textContent = count1;
            price_paragraph1.textContent = "shs. " + price1;
        }

        localStorage.setItem('myorder', JSON.stringify(orders));
        transfer_data.postMessage(orders);
    };
}



//                                     Drinks Menu
const drinks = {
    "CocaCola": 1000,
    "Fanta": 1000,
    "Passion Juice": 1500,
    "Apple Juice": 2000,
    "Mango Juice": 1000,
    "Pepsi": 1000,
    "Sprite": 1000,
    "CocaCola1": 1000,
    "Fanta2": 1000,
    "Passion Juice3": 1500,
    "Apple Juice4": 2000,
    "Mango Juice5": 1000,
    "Pepsi6": 1000,
    "Sprite7": 1000,
    "CocaCola8": 1000,
    "Fanta9": 1000,
    "Passion Juice10": 1500,
    "Apple Juice11": 2000,
    "Mango Juice12": 1000,
    "Pepsi13": 1000,
    "Sprite14": 1000
}

const drink_sec = document.getElementsByClassName("Drinks")[0];
let headings3 = document.createElement("button");
drink_sec.appendChild(headings3);
const head_text3 = document.createTextNode("Drinks");
headings3.appendChild(head_text3);

const heading3_atr = document.createAttribute("class");
heading3_atr.value = "food-buttons";
headings3.setAttributeNode(heading3_atr);


const drink_mini = document.createElement("div");
drink_mini.setAttribute("class", "food_mini_sec");
drink_sec.appendChild(drink_mini);


for (const drink in drinks) {
    let drink_btn = document.createElement("button");
    drink_mini.appendChild(drink_btn);
    const drink_text = document.createTextNode(drink);
    drink_btn.appendChild(drink_text);

    const item_atr = document.createAttribute("class");
    item_atr.value = "starter";
    drink_btn.setAttributeNode(item_atr);
    let count = 0;
    let price = 0;
    
    let price_paragraph;
    let qty_paragraph;

    drink_btn.onclick = function() {
        count = count + 1;
        Total += drinks[drink_btn.textContent];
        price = drinks[drink_btn.textContent] * count;
        Grand_total.textContent = Total.toLocaleString();


        const existing_order = orders.find(order => order.Starter === drink);

        if (existing_order) {
            existing_order.prices = price;
            existing_order.qty = count;
        }

        else {
            const new_order = {
                Starter: drink,
                prices: price,
                qty: count,
            }
            orders.push(new_order);
        }



        if (count === 1) {
            let item = document.createElement("p");
            item.textContent = drink_btn.textContent;
            container.appendChild(item);

            price_paragraph= document.createElement("p");
            price_paragraph.textContent = "shs. " + drinks[drink_btn.textContent];
            container.appendChild(price_paragraph);


            const price_atr = document.createAttribute("class");
            price_atr.value = "items";
            price_paragraph.setAttributeNode(price_atr);

            qty_paragraph = document.createElement('p');
            qty_paragraph.textContent = count;
            container.appendChild(qty_paragraph);

            const qty_atr = document.createAttribute("class");
            qty_atr.value = "items";
            qty_paragraph.setAttributeNode(qty_atr);

            const item_atr = document.createAttribute("class");
            item_atr.value = "items";
            item.setAttributeNode(item_atr);
        } else {
            qty_paragraph.textContent = count;
            price_paragraph.textContent = "shs. " + price;
        }

        localStorage.setItem('myorder', JSON.stringify(orders));
        transfer_data.postMessage(orders);
    }
}



//                                       Platters Menu 

const platters = {
    "GoatLeg Chips Chicken Pilao": 120000,
    "Luwombo Matooke Pilao Beef": 90000,
    "Chicken Pilao Matooke Posho": 55000,
    "Rice Fish Matooke Greens": 30000,
    "Matooke Rice Meat G.nuts": 28000,
    "Matooke Chips Luwombo Beef": 25000,
    "Pumpkin G.nuts Matooke Chicken": 15000
}

const platter_sec = document.getElementsByClassName("Platters")[0];
let headings4 = document.createElement("button");
platter_sec.appendChild(headings4);
const head_text4 = document.createTextNode("Platters");
headings4.appendChild(head_text4);

const heading4_atr = document.createAttribute("class");
heading4_atr.value = "food-buttons";
headings4.setAttributeNode(heading4_atr);

const platter_mini = document.createElement("div");
platter_mini.setAttribute("class", "food_mini_sec");
platter_sec.appendChild(platter_mini);


for (const platter in platters) {
    let platter_btn = document.createElement("button");
    platter_mini.appendChild(platter_btn);
    const platter_text = document.createTextNode(platter);
    platter_btn.appendChild(platter_text);

    const item_atr = document.createAttribute("class");
    item_atr.value = "starter";
    platter_btn.setAttributeNode(item_atr);
    let count = 0;
    let price = 0;
    
    let price_paragraph;
    let qty_paragraph;

    platter_btn.onclick = () => {
        count = count + 1;
        Total += platters[platter_btn.textContent];
        price = platters[platter_btn.textContent] * count;
        Grand_total.textContent = Total.toLocaleString();


        const existing_order = orders.find(order => order.Starter === platter);

        if (existing_order) {
            existing_order.prices = price;
            existing_order.qty = count;
        }

        else {
            const new_order = {
                Starter: platter,
                prices: price,
                qty: count,
            }
            orders.push(new_order);
        }




        if (count === 1) {
            let item = document.createElement("p");
            item.textContent = platter_btn.textContent;
            container.appendChild(item);

            price_paragraph= document.createElement("p");
            price_paragraph.textContent = "shs. " + platters[platter_btn.textContent];
            container.appendChild(price_paragraph);


            const price_atr = document.createAttribute("class");
            price_atr.value = "items";
            price_paragraph.setAttributeNode(price_atr);

            qty_paragraph = document.createElement('p');
            qty_paragraph.textContent = count;
            container.appendChild(qty_paragraph);

            const qty_atr = document.createAttribute("class");
            qty_atr.value = "items";
            qty_paragraph.setAttributeNode(qty_atr);

            const item_atr = document.createAttribute("class");
            item_atr.value = "items";
            item.setAttributeNode(item_atr);
        } else {
            qty_paragraph.textContent = count;
            price_paragraph.textContent = "shs. " + price;
        }

        localStorage.setItem('myorder', JSON.stringify(orders));
        transfer_data.postMessage(orders);
    }
}


//                                  DESSERTS
const desserts = {
    "Cheesecake": 3000,
    "Chocolate Cake": 5000,
    "Creme Brulee": 6500,
    "Ice cream Sundaes": 7000,
    "Brownies": 3000,
    "Fruit Pies": 2000,
    "Molten Chocolate Lava Cake": 6000
}

const dessert_sec = document.getElementsByClassName("Desserts")[0];
let headings5 = document.createElement("button");
dessert_sec.appendChild(headings5);
const head_text5 = document.createTextNode("Desserts");
headings5.appendChild(head_text5);

const heading5_atr = document.createAttribute("class");
heading5_atr.value = "food-buttons";
headings5.setAttributeNode(heading5_atr);


const dessert_mini = document.createElement("div");
dessert_mini.setAttribute("class", "food_mini_sec");
dessert_sec.appendChild(dessert_mini);


for (const dessert in desserts) {
    let dessert_btn = document.createElement("button");
    dessert_mini.appendChild(dessert_btn);
    const dessert_text = document.createTextNode(dessert);
    dessert_btn.appendChild(dessert_text);

    const item_atr = document.createAttribute("class");
    item_atr.value = "starter";
    dessert_btn.setAttributeNode(item_atr);
    let count = 0;
    let price = 0;
    
    let price_paragraph;
    let qty_paragraph;

    dessert_btn.onclick = function() {
        count = count + 1;
        Total += desserts[dessert_btn.textContent];
        price = desserts[dessert_btn.textContent] * count;
        Grand_total.textContent = Total.toLocaleString();

 

        const existing_order = orders.find(order => order.Starter === dessert);

        if (existing_order) {
            existing_order.prices = price;
            existing_order.qty = count;
        }

        else {
            const new_order = {
                Starter: dessert,
                prices: price,
                qty: count,
            }
            orders.push(new_order);
        }
        

        if (count === 1) {
            let item = document.createElement("p");
            item.textContent = dessert_btn.textContent;
            container.appendChild(item);

            price_paragraph= document.createElement("p");
            price_paragraph.textContent = "shs. " + desserts[dessert_btn.textContent];
            container.appendChild(price_paragraph);


            const price_atr = document.createAttribute("class");
            price_atr.value = "items";
            price_paragraph.setAttributeNode(price_atr);

            qty_paragraph = document.createElement('p');
            qty_paragraph.textContent = count;
            container.appendChild(qty_paragraph);

            const qty_atr = document.createAttribute("class");
            qty_atr.value = "items";
            qty_paragraph.setAttributeNode(qty_atr);

            const item_atr = document.createAttribute("class");
            item_atr.value = "items";
            item.setAttributeNode(item_atr);
        } else {
            qty_paragraph.textContent = count;
            price_paragraph.textContent = "shs. " + price;
        }

        localStorage.setItem('myorder', JSON.stringify(orders));
        transfer_data.postMessage(orders);
    }
}







//                            MENU ANIMATIONS

const menu_sections = document.querySelectorAll(".menu-section");

function closeMenus() {
    menu_sections.forEach(section => {
        const button = section.querySelector(".food-buttons");
        const mini = section.querySelector(".food_mini_sec");

        button.classList.remove("color-change");
        button.style.color = "";
        mini.classList.remove("show");
    });

    activeMenu = null;
}

menu_sections.forEach(section => {
    const button = section.querySelector(".food-buttons");
    const mini = section.querySelector(".food_mini_sec");

    button.onclick = function(event) {
        event.stopPropagation();
        closeMenus();

        button.classList.add("color-change");
        button.style.color = "red";
        mini.classList.add("show");
        activeMenu = section;
    };
});

document.addEventListener("click", event => {
    if (activeMenu && !activeMenu.contains(event.target)) {
        closeMenus();
    }
});

// PAYSERV SECTIONNNNNNNNN //////












// PAYSERV SECTIONNNNNNNNN //////
const mtn = document.getElementById("mtn");
const airtel = document.getElementById("airtel");
const master = document.getElementById("master");
const bank = document.getElementById("bank");
const cash = document.getElementById("cash");
const entered_cash = document.querySelector("#cash-no");
const balance = document.querySelector("#balance");
const dine = document.getElementById("dine");
const away = document.getElementById("away");
const submit_cash = document.querySelector(".balance");

const total = document.getElementById("total");
let master_card = null;
let new_balance = 0;


total.onclick = function() {
    if (mtn.style.backgroundColor == "red" && airtel.style.backgroundColor == "red" && master.style.backgroundColor == "red" && bank.style.backgroundColor == "red" && cash.style.backgroundColor == "red") {
        alert("Please select one payment method");
        location.reload();
    } 
    else if (mtn.style.backgroundColor != "red" && airtel.style.backgroundColor != "red" && master.style.backgroundColor != "red" && bank.style.backgroundColor != "red" && cash.style.backgroundColor != "red") {
        alert("Please select a payment method");
    }
    else if (dine.style.backgroundColor == "blue" && away.style.backgroundColor == "blue") {
        alert("Select only one delivery method");
    }
     else if (dine.style.backgroundColor != "blue" && away.style.backgroundColor != "blue") {
        alert("Please select a delivery method");
    }
    else if (Total === 0) {
        alert("You have not selected any food item. Please select an item to order");
        location.reload();
    }

    else if (cash.style.backgroundColor == "red") {
        new window.WinBox ({
            title: "Cash Payment",
            width: "400px",
            height: "250px",
            background: "#912f56",
            x: "center",
            y: "center",
            mount: document.querySelector(".Cash")
        })

        //cash balance calculator logic
        entered_cash.addEventListener("input", () => {
            const received_cash = Number(entered_cash.value) || 0;
            new_balance = received_cash - Total;
            balance.textContent = new_balance;
        })


    } 

    else if (master.style.backgroundColor == "red") {
        master_card = new window.WinBox ({
            title: "Enter Card Details",
            width: "400px",
            height: "250px",
            background: "#912f56",
            x: "center",
            y: "center",
            mount: document.querySelector(".Mastercard"),
        })
    }

    else {
        if (confirm("Your bill is: " + Total)) {
            confirmCurrentOrder();
            location.reload();
        }
    }

}

submit_cash.addEventListener("click", () => {
    if (confirm("Your bill is: " + Total + "\n" + "Balance: " + new_balance)) {
        confirmCurrentOrder();
        location.reload();
    }
})



//mastercard test 1 2 with validation checks 1 2 
document.addEventListener("click", event => {
    if (!event.target.matches(".submit")) return;

    const card_no = document.querySelector("#card-no");
    const card_date = document.querySelector("#date");
    const cvc = document.querySelector("#cvc");
    const submit_btn = event.target;
    const card_fields = [card_no, card_date, cvc];
    card_fields.forEach(field => field.classList.remove("invalid"));

    const clean_card_no = card_no.value.replace(/\s+/g, "").replace(/-/g, "");
    const card_no_pattern = /^5[1-5][0-9]{14}$|^(222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[0-1][0-9]|2720)[0-9]{12}$/;
    const cvc_pattern = /^[0-9]{3}$/;
    const expiry_date = card_date.value ? new Date(card_date.value) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!card_no.value.trim()) {
        alert("Please enter your card number.");
        card_no.classList.add("invalid");
    }
    else if (!card_no_pattern.test(clean_card_no)) {
        alert("Invalid card number. Please enter a valid 16-digit Mastercard number.");
        card_no.classList.add("invalid");
    }
    else if (!expiry_date || expiry_date < today) {
        alert("Please enter a valid expiry date.");
        card_date.classList.add("invalid");
    }
    else if (!cvc_pattern.test(cvc.value)) {
        alert("Please enter a valid 3-digit CVC.");
        cvc.classList.add("invalid");
    }
    else {
        new window.WinBox ({
            width: "300px",
            height: "150px",
            background: "#912f56",
            x: "center",
            y: "center",
            mount: document.querySelector(".processing"),
            modal: true,
            class: "no-top-bar"
        })

        master_card.close();

        setTimeout(() => {
             new window.WinBox({
                width: "300px",
                height: "150px",
                x: "center",
                y: "center",
                mount: document.querySelector(".success"),
                class: "no-top-bar"
            })
        }, 4000);

        setTimeout (() => {
            if (confirm("Your bill is: " + Total)) {
                confirmCurrentOrder();
                location.reload();
            }
        }, 5000);
    }
});




//coupon test 12 
const box = document.getElementById("box");
const apply = document.getElementById("apply");

apply.onclick = function() {
    if (box.value.trim().toUpperCase() === "AUGUST") {
        discount = 0.1 * Total;
        Total -= discount;
        Grand_total.textContent = Total.toLocaleString();
        alert("You have got a discount of 10%. New total = shs. " + Total);
        location.reload();
    }
}

const clear = document.getElementById("clear");

clear.onclick = function() {
    const confirm = window.confirm("Do you wish to reset your order?")
    if (confirm) {
        location.reload();
    }
    else {
        return;
    }
    
}

const money_btns = document.querySelectorAll(".money > .pay1");
const service_btns = document.querySelectorAll(".service button");


money_btns.forEach(btn => {
    btn.addEventListener("click", () => {
        money_btns.forEach(button => {
            button.style.backgroundColor = "white";
            button.style.borderRadius = "5px";
            button.style.border = "none";
            button.style.color = "#912f56";
        });
      my_clicked_btn = btn.textContent.trim();

        btn.style.backgroundColor = "red";
        btn.style.borderRadius = "5px";
        btn.style.border = "none";
        btn.style.color = "white";
    })
});

service_btns.forEach(btn => {
    btn.addEventListener("click", () => {
        service_btns.forEach(button => {
            button.style.backgroundColor = "white";
            button.style.borderRadius = "5px";
            button.style.border = "none";
            button.style.color = "#912f56";
        });

        btn.style.backgroundColor = "blue";
        btn.style.borderRadius = "5px";
        btn.style.border = "none";
        btn.style.color = "white";

        isServiceBtn_clicked = true;
    })
});