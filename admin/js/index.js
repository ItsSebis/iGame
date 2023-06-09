// socket.io connection
const socket = io()

// construct elements
const authentication = document.querySelector('#password')
const adminView = document.querySelector('#admin')
const tBodyEl = document.querySelector('#standBody')

// player object
let players

socket.on('authenticated', () => {
    authentication.setAttribute("style", "display: none")
    adminView.removeAttribute("style")
})

socket.on('updatePlayers', (backendPlayers) => {
    players = backendPlayers
})

// sort standings table
function sortTable() {
    let table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("standings");
    switching = true;
    while (switching) {
        switching = false;
        rows = tBodyEl.getElementsByTagName("TR");
        for (i = 0; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            /*Get the two elements you want to compare,
            one from current row and one from the next:*/
            x = rows[i].getElementsByTagName("TD")[3];
            y = rows[i + 1].getElementsByTagName("TD")[3];
            //check if the two rows should switch place:
            if (Number(x.innerHTML) < Number(y.innerHTML)) {
                //if so, mark as a switch and break the loop:
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            /*If a switch has been marked, make the switch and mark that a switch has been done:*/
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            //console.log("Switched " + )
            switching = true;
        }
    }

    switching = true;
    while (switching) {
        switching = false;
        rows = tBodyEl.getElementsByTagName("TR");
        for (i = 0; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            /*Get the two elements you want to compare,
            one from current row and one from the next:*/
            x = rows[i].getElementsByTagName("TD")[2];
            y = rows[i + 1].getElementsByTagName("TD")[2];
            //check if the two rows should switch place:
            if (Number(x.innerHTML) > Number(y.innerHTML)) {
                //if so, mark as a switch and break the loop:
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            /*If a switch has been marked, make the switch and mark that a switch has been done:*/
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            //console.log("Switched " + )
            switching = true;
        }
    }

    switching = true
    while (switching) {
        switching = false;
        rows = tBodyEl.getElementsByTagName("TR");
        for (i = 0; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            /*Get the two elements you want to compare,
            one from current row and one from the next:*/
            x = rows[i].getElementsByTagName("TD")[1];
            y = rows[i + 1].getElementsByTagName("TD")[1];
            //check if the two rows should switch place:
            if (Number(x.innerHTML) < Number(y.innerHTML)) {
                //if so, mark as a switch and break the loop:
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            /*If a switch has been marked, make the switch and mark that a switch has been done:*/
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            //console.log("Switched " + )
            switching = true;
        }
    }
}

function update() {
    tBodyEl.innerHTML = ""
    for (const id in players) {
        const p = players[id]

        const row = document.createElement("tr")
        const name = document.createElement("td")
        const kills = document.createElement("td")
        const deaths = document.createElement("td")
        const dmg = document.createElement("td")

        name.innerText = p.name
        row.appendChild(name)
        kills.innerText = p.kills
        row.appendChild(kills)
        deaths.innerText = p.deaths
        row.appendChild(deaths)
        dmg.innerText = p.dmgDealt
        row.appendChild(dmg)

        tBodyEl.appendChild(row)
    }

    sortTable()
    setTimeout(function () {
        update()
    }, 100)
}

document.querySelector("#pwField").focus()
update()