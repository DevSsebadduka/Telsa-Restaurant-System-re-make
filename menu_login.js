const transfer_data = new BroadcastChannel('live-updates');
const email = document.querySelector("#email");
const passward = document.querySelector("#passward");
const login_btn = document.querySelector(".login");

const attendance = [];
const login_time = new Date().toLocaleTimeString();

const staff_details = {
    Kevin: {username: "Kevin_Banks12", passward: "Kevin12", role: "Waiter", shift: "7:10am - 12:00pm", status_check: "offline", logged_in: "Not logged in"},
    Kelia: {username:"Kelia_Kate", passward: "Kate13", role: "Waiter", shift: "12:05pm - 7:00pm", status_check: "offline", logged_in: "Not logged in"},
    Jacob: {username: "Jacob_Dan", passward: "Jacib", role: "Waiter", shift: "7:05pm - 10:30pm", status_check: "offline", logged_in: "Not logged in"}
}



login_btn.addEventListener("click", () => {
    let isLoggedin = false;
    const typed_email = email.value.trim();
    const typed_passward = passward.value.trim();

    const check_username = Object.values(staff_details).find(name => name.username == typed_email);
    const check_passward = Object.values(staff_details).find(name => name.passward == typed_passward);

    if(typed_email == "" && typed_passward == "") {
        alert('Please enter your login details')
        email.focus();
    }

    else if (typed_email == "" || typed_passward == "") {
        alert("Please enter ur email or passward")
        email.focus();
    }

    else {
        if (check_username && check_passward) {
            setTimeout(() => {
                window.location.href = "index.html";
            }, 2000);

            check_username.status_check = "online";
            check_username.logged_in = login_time;

            const staff_login = {
                staff: check_username.username,
                role: check_username.role,
                shift: check_username.shift,
                Status: check_username.status_check,
                time: check_username.logged_in
            }

            attendance.push(staff_login);

            transfer_data.postMessage({
                type: "LOGS",
                data: attendance
            });

            localStorage.setItem("staff_details", JSON.stringify(attendance));

        }

        else {
            alert("Wrong Details, Please try again");
        }
    }
})

// localStorage.clear();