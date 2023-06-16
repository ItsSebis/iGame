// initialize canvas
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

// socket.io connection
let socket = io()
socket.emit('nameUpdate', ign)

// client fps and server tps stat elements
const fpsEl = document.querySelector('#fpsEl')
let lastUpdateTime = 0
let recentFPS = []
const tpsEl = document.querySelector('#tpsEl')
let recentTPS = []

// device pixel ration -> more pixel, more sight, no no
const devicePxRat = 1920 / innerWidth
canvas.width = innerWidth * devicePxRat
canvas.height = innerHeight * devicePxRat

// gui elements
const typeSwitcher = document.querySelector("#typeSwitcher")
const tBodyEl = document.querySelector('#standBody')
const nameEl = document.querySelector('#name')
const healEl = document.querySelector('#health')
const shieldEl = document.querySelector('#shield')
const killEl = document.querySelector('#kills')
const deathEl = document.querySelector('#deaths')
const logEl = document.querySelector('#log')
const mEl = document.querySelector('#mEl')
const xEl = document.querySelector('#xEl')
const yEl = document.querySelector('#yEl')
const xCEl = document.querySelector('#xCEl')
const yCEl = document.querySelector('#yCEl')
const pCEl = document.querySelector('#pCEl')
const prCEl = document.querySelector('#prCEL')

// Movement vars
let mousedown = false
let mouseAngle = 0
let mousePos = {
    x: 0,
    y: 0
}
let preMove
let aPressed = false
let dPressed = false
let wPressed = false
let sPressed = false

// map init
let map = undefined
// cam position (top left corner of screen)
let cam = {
    x: 0,
    y: 0
}
// id of this client
let ego = undefined

// frontend objects
let game = undefined
let nameSet = false
const players = {}
let admins = []
const projectiles = {}
let items = []
let obstacles = undefined
let explosions = []
let damages = []

// terminal for testing and other fun stuff... will not be abused...
let term = false
const recmd = []
let curCmd = 0

// shooting type names
let types = {}
const modes = {
    1: "FFA",
    2: "Deathmatch"
}

// helper function for fps/tps -> calculates average number of array
function avg(array) {
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
        sum += array[i];
    }
    return sum / array.length
}

// sort standings table
function sortTable() {
    let rows, switching, i, x, y, shouldSwitch;
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

// player joins or leaves
socket.on('updatePlayers', (backendPlayers) => {
    for (const id in backendPlayers) {
        const bP = backendPlayers[id]
        if (!players[id]) {
            let color = 'red'
            if (socket.id === id) {
                color = 'blue'
                ego = id
            }
            players[id] = new Player({
                id: id,
                x: bP.x,
                y: bP.y,
                color: color,
                name: bP.name,
                level: bP.level,
                kills: bP.kills,
                deaths: bP.deaths,
                type: bP.type,
                health: bP.health,
                shield: bP.shield,
                lastHitTime: bP.lastHitTime,
                dmgDealt: bP.dmgDealt,
                angle: bP.angle
            })
        } else {
            players[id].name = bP.name
            players[id].level = bP.level
            players[id].kills = bP.kills
            players[id].deaths = bP.deaths
            players[id].type = bP.type
            players[id].health = bP.health
            players[id].shield = bP.shield
            players[id].lastHitTime = bP.lastHitTime
            players[id].dmgDealt = bP.dmgDealt
            players[id].angle = bP.angle
        }
    }
    for (const id in players) {
        if (!backendPlayers[id]) {
            delete players[id]
        }
    }
    nameEl.innerText = players[ego].name
    killEl.innerText = players[ego].kills
    deathEl.innerText = players[ego].deaths
    healEl.setAttribute("value", players[ego].health)
    document.querySelector("#healthCount").innerText = players[ego].health
    shieldEl.setAttribute("value", players[ego].shield)
    document.querySelector("#shieldCount").innerText = players[ego].shield
})

// new coordinate data
socket.on('updateCords', (bCords) => {
    for (const id in players) {
        players[id].name = bCords[id].name
        players[id].x = bCords[id].x
        players[id].y = bCords[id].y
        players[id].angle = bCords[id].angle
    }
    xEl.innerText = players[ego].x
    yEl.innerText = players[ego].y
})

// new projectile data
socket.on('updateProj', (backendProj) => {
    for (const id in projectiles) {
        if (!backendProj[id]) {
            delete projectiles[id]
        }
    }
    for (const id in backendProj) {
        const bP = backendProj[id]
        let color = 'red'
        if (socket.id === bP.shooter) {
            color = 'blue'
        }
        if (!projectiles[id]) {
            projectiles[id] = new Projectile({
                x: bP.x,
                y: bP.y,
                radius: bP.radius,
                color: color
            })
        } else {
            projectiles[id].x = bP.x
            projectiles[id].y = bP.y
            projectiles[id].radius = bP.radius
            projectiles[id].color = color
        }
    }
})

// update items on map
socket.on('updateItems', (backendItems) => {
    items = backendItems
})

// receive game
socket.on('setGame', (backendGame) => {
    game = backendGame
    if (game !== undefined) {
        obstacles = backendGame.map.obstacles
        map = backendGame.map.dimensions
        if (!document.querySelector("#menu").hasAttribute("style")) {
            document.querySelector("#menu").setAttribute("style", "display: none")
        }
        document.querySelector("#server").innerText = backendGame.name
        if (backendGame.owner !== undefined && game.players[backendGame.owner] !== undefined) {
            document.querySelector("#owner").innerText = game.players[backendGame.owner].name
        } else {
            document.querySelector("#owner").innerText = ""
        }
    } else {
        document.querySelector("#server").innerText = ""
        document.querySelector("#owner").innerText = ""
        if (document.querySelector("#menu").hasAttribute("style")) {
            document.querySelector("#menu").removeAttribute("style")
        }
    }
})

// name on server
socket.on('nameDefined', () => {
    document.querySelector('#ignForm').setAttribute("style", "display: none")
    document.querySelector('#ownName').innerText = "\""+ign+"\""
    nameSet = true
    // join game
    //socket.emit('requestGame', 0)
})

// destroy game
socket.on('endGame', () => {
    game = undefined
    document.querySelector("#server").innerText = ""
    document.querySelector("#owner").innerText = ""
    if (document.querySelector("#menu").hasAttribute("style")) {
        document.querySelector("#menu").removeAttribute("style")
    }
})

// set types
socket.on('setTypes', (backendTypes) => {
    types = backendTypes
    typeSwitcher.innerHTML = ""
    for (const id in types) {
        const button = document.createElement("button")
        button.innerHTML = types[id].symbol + " " + types[id].name

        button.setAttribute("typeId", id)
        button.setAttribute("id", "type" + id)
        button.classList.add("typeSelect")
        button.onclick = function () {
            socket.emit('selectType', id)
        }
        typeSwitcher.appendChild(button)
        typeSwitcher.appendChild(document.createElement("br"))
    }
})

// log entry
socket.on('logEntry', (text) => {
    let newLog = document.createElement("p")
    newLog.innerHTML = text
    logEl.appendChild(newLog)
    setTimeout(function () {
        newLog.remove()
    }, 7500)
})

// show title on screen
socket.on('title', (text) => {
    let newLog = document.createElement("h1")
    newLog.innerHTML = text
    newLog.setAttribute("style", "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 4rem; color: white;")
    document.getElementsByTagName('body')[0].appendChild(newLog)
    setTimeout(function () {
        newLog.remove()
    }, 5000)
})

// registered shot
socket.on('shot', (origin) => {
    const vol = (1000 - Math.sqrt(Math.pow(players[ego].x - origin.x, 2) + Math.pow(players[ego].y - origin.y, 2))) / 1000
    if (vol > 0) {
        const snd = new Audio(`sounds/shots/${origin.type}.wav`)
        snd.volume = vol
        snd.play().then()
    }
})

// explosion
socket.on('explosion', (explosion) => {
    const vol = (1000-Math.sqrt(Math.pow(players[ego].x - explosion.x, 2) + Math.pow(players[ego].y - explosion.y, 2)))/1000
    if (vol > 0) {
        const snd = new Audio("sounds/explosion.wav")
        snd.volume = vol
        snd.play().then()
    }
    explosions.push({x: explosion.x, y: explosion.y, power: explosion.power, a: 1})
})

// damage dealt
socket.on('damageDealt', (damage) => {
    let snd = new Audio("sounds/hit.wav")
    if (damage.crit) {
        snd = new Audio("sounds/critical.wav")
    }
    damage.a = 1
    damage.time = Date.now()
    damages.push(damage)
    snd.play().then()
})

// authenticated
socket.on('gotAdmin', () => {
    document.querySelector("#term").removeAttribute("type")
})

// unauthenticated
socket.on('noAdmin', () => {
    document.querySelector("#term").setAttribute("type", "password")
})

// all admins array
socket.on('admins', (bAdmins) => {
    admins = bAdmins
})

// new kill
socket.on('kill', () => {
    const snd = new Audio("sounds/kill.wav")
    snd.play().then()
})

// menu games updater
socket.on('games', (games) => {
    document.querySelector("#menuGames").innerHTML = ""
    for (const id in games) {
        const gameEl = document.createElement('div')
        gameEl.classList.add('gameEl')
        gameEl.onclick = function () {socket.emit('requestGame', id)}
        const gameName = document.createElement('p')
        gameName.innerText = games[id].name
        gameEl.appendChild(gameName)
        const gameMode = document.createElement('p')
        gameMode.innerText = String(modes[games[id].mode])
        gameEl.appendChild(gameMode)
        const gamePlayer = document.createElement('p')
        gamePlayer.innerText = String(Object.keys(games[id].players).length)
        gameEl.appendChild(gamePlayer)
        document.querySelector("#menuGames").appendChild(gameEl)
    }
})

// new tps data
socket.on('tps', (tps => {
    recentTPS.push(tps)
}))

// main frame loop
let animationId
function animate() {
    animationId = requestAnimationFrame(animate)
    if (game === undefined) {
        c.beginPath()
        c.fillStyle = 'white'
        c.fillRect(0, 0, canvas.width, canvas.height)
        c.closePath()
        return
    }
    c.beginPath()
    c.fillStyle = 'rgb(50, 50, 50)'
    c.fillRect(0, 0, canvas.width, canvas.height)
    c.closePath()
    c.beginPath()
    c.fillStyle = 'rgba(0, 0, 0, 1)'
    c.fillRect(0-cam.x, 0-cam.y, map.width*devicePxRat, map.height*devicePxRat)

    c.strokeStyle = 'rgb(30, 30, 30)'
    c.lineWidth = 1
    for (let i = 0; i < (map.width)*devicePxRat; i+=50*devicePxRat) {
        c.moveTo(i-cam.x, 0-cam.y)
        c.lineTo(i-cam.x, map.height*devicePxRat-cam.y)
    }
    for (let i = 0; i < (map.height)*devicePxRat; i+=50*devicePxRat) {
        c.moveTo(0-cam.x, i-cam.y)
        c.lineTo(map.width*devicePxRat-cam.x, i-cam.y)
    }
    c.stroke()
    for (const id in obstacles) {
        const obst = obstacles[id]
        if (Math.sqrt(Math.pow(obst.start.x - players[ego].x, 2) + Math.pow(obst.start.y - players[ego].y, 2)) > 1600) {
            continue
        }
        c.fillStyle = `rgba(50, 50, 50, 1)`
        c.fillRect(obst.start.x*devicePxRat-cam.x, obst.start.y*devicePxRat-cam.y, obst.end.x*devicePxRat, obst.end.y*devicePxRat)
    }
    c.closePath()
    c.beginPath()
    for (const id in explosions) {
        if (Math.sqrt(Math.pow(explosions[id].x - players[ego].x, 2) + Math.pow(explosions[id].y - players[ego].y, 2)) > 1000) {
            continue
        }
        c.fillStyle = `rgba(150, 75, 25, ${explosions[id].a})`
        c.arc(explosions[id].x*devicePxRat-cam.x, explosions[id].y*devicePxRat-cam.y, explosions[id].power*50*devicePxRat, 0, Math.PI*2, false)
        explosions[id].a -= 0.05
        if (explosions[id].a <= 0) {
            explosions.splice(Number(id), 1)
        }
    }
    c.fill()
    c.closePath()

    try {
        cam = {
            x: players[ego].x * devicePxRat - innerWidth * devicePxRat / 2,
            y: players[ego].y * devicePxRat - innerHeight * devicePxRat / 2
        }
        if (Date.now() - players[ego].lastHitTime < 10000) {
            for (const id in types) {
                const button = document.querySelector("#type"+id) 
                button.setAttribute("disabled", "disabled")
                button.innerText = Math.round((10000 - (Date.now() - players[ego].lastHitTime))/100)/10
            }
            //selShot.setAttribute("disabled", "disabled")
            //selSpray.setAttribute("disabled", "disabled")
            //selSnipe.setAttribute("disabled", "disabled")
            //selShot.innerText = Math.round((10000 - (Date.now() - players[ego].lastHitTime))/100)/10
            //selSpray.innerText = Math.round((10000 - (Date.now() - players[ego].lastHitTime))/100)/10
            //selSnipe.innerText = Math.round((10000 - (Date.now() - players[ego].lastHitTime))/100)/10
        } else {
            for (const id in types) {
                const button = document.querySelector("#type"+id) 
                button.removeAttribute("disabled")
                button.innerHTML = types[id].symbol + " " + types[id].name
            }
        }
    } catch (e) {}
    mEl.innerText = mouseAngle
    xCEl.innerText = cam.x
    yCEl.innerText = cam.y
    pCEl.innerText = Object.keys(players).length
    prCEl.innerText = Object.keys(projectiles).length
    if (!term && !document.querySelector("#terminal").hasAttribute("style")) {
        document.querySelector("#terminal").setAttribute("style", "display: none;")
        document.querySelector("canvas").focus()
    } else if (term && document.querySelector("#terminal").hasAttribute("style")) {
        document.querySelector("#terminal").removeAttribute("style")
        document.querySelector("#term").focus()
    }
    const movement = {
        angle: mouseAngle,
        left: aPressed,
        right: dPressed,
        up: wPressed,
        down: sPressed
    }
    if (mousedown) {
        socket.emit('shoot', mouseAngle)
    }
    if (preMove === undefined || movement !== preMove) {
        socket.emit('movement', movement)
    }

    const start = Date.now()
    for (const id in items) {
        const item = items[id]
        if (Math.sqrt(Math.pow(item.x - players[ego].x, 2) + Math.pow(item.y - players[ego].y, 2)) > 1000) {
            continue
        }
        let color
        if (item.type === 0) {
            color = "rgba(0, 255, 0, 0.5)"
        } else if (item.type === 1) {
            color = "rgba(94,144,218, 0.5)"
        } else {
            color = "rgba(255, 255, 0, 0.5)"
        }
        c.beginPath()
        c.fillStyle = color
        c.arc(item.x*devicePxRat-cam.x, item.y*devicePxRat-cam.y, 30*devicePxRat, 0, Math.PI*2, false)
        c.fill()
        c.closePath()
    }
    for (const id in projectiles) {
        const pr = projectiles[id]
        if (Math.sqrt(Math.pow(pr.x - players[ego].x, 2) + Math.pow(pr.y - players[ego].y, 2)) < 1000) {
            pr.draw()
        }
    }

    for (const id in players) {
        const p = players[id]
        if (Math.sqrt(Math.pow(p.x - players[ego].x, 2) + Math.pow(p.y - players[ego].y, 2)) < 1000) {
            p.draw()
        }
    }

    c.beginPath()
    for (const id in damages) {
        const dmgData = damages[id]
        let color = `rgba(255, 255, 255, ${dmgData.a})`
        if (dmgData.crit) {
            color = 'red'
        }

        c.textAlign = 'center'
        c.fillStyle = color
        c.font = (30*devicePxRat*dmgData.a) + "px Arial" // (20*dmgData.a) +
        c.fillText(dmgData.dmg, dmgData.x*devicePxRat-cam.x, dmgData.y*devicePxRat-cam.y-45-40*(1-dmgData.a))

        const restMs= 1000-(Date.now() - dmgData.time)
        damages[id].a = restMs/1000
        if (restMs <= 0) {
            damages.splice(Number(id), 1)
        }
    }
    c.closePath()
    const endT = Date.now()
    document.querySelector('#tabTime').innerText = (endT-start)+"ms"

    const end = Date.now();
    recentFPS.push(Math.round(1000 / (end - lastUpdateTime)))
    lastUpdateTime = end
}

// fps/tps stat updater function
async function updateTPS() {
    // FPS
    fpsEl.innerText = Math.round((avg(recentFPS) + Number.EPSILON) * 100) / 100
    recentFPS = []

    // TPS
    tpsEl.innerText = Math.round((avg(recentTPS) + Number.EPSILON) * 100) / 100
    recentTPS = []
    setTimeout(function () {
        updateTPS()
    }, 100)
}

async function updateTable() {
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
        updateTable()
    }, 500)
}

document.getElementById("termForm").onsubmit = function () {
    const terminal = document.getElementById("term")
    socket.emit('exec', terminal.value)
    if (!terminal.hasAttribute("type")) {
        recmd.push(terminal.value)
        curCmd = recmd.length
    }
    terminal.value = ""
}

// call loops
updateTPS().then()
updateTable().then()
animate()
