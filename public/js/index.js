// initialize canvas
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

// socket.io connection
const socket = io();

// client fps and server tps stat elements
const fpsEl = document.querySelector('#fpsEl')
let lastUpdateTime = 0
let recentFPS = []
const tpsEl = document.querySelector('#tpsEl')
let recentTPS = []

// device pixel ration -> more pixel, more sight, no no
const devicePxRat = window.devicePixelRatio || 1
canvas.width = innerWidth * devicePxRat
canvas.height = innerHeight * devicePxRat

// gui elements
const selShot = document.querySelector('#selectShot')
const selSnipe = document.querySelector('#selectSnipe')
const selSpray = document.querySelector('#selectSpray')
const nameEl = document.querySelector('#name')
const healEl = document.querySelector('#health')
const killEl = document.querySelector('#kills')
const deathEl = document.querySelector('#deaths')
const logEl = document.querySelector('#log')
const typeEl = document.querySelector('#type')
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
let aPressed = false
let dPressed = false
let wPressed = false
let sPressed = false

// map size
const map = {
    height: 2000,
    width: 3000
}
// cam position (top left corner of screen)
let cam = {
    x: 0,
    y: 0
}
// id of this client
let ego = undefined

// frontend objects
const players = {}
const projectiles = {}
let obstacles = []

// shooting type names
const typeNames = {
    1: "Shooter",
    2: "Sprayer",
    3: "Sniper",
}

// helper function for fps/tps -> calculates average number of array
function avg(array) {
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
        sum += array[i];
    }
    return sum / array.length
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
                lastHitTime: bP.lastHitTime
            })
        } else {
            players[id].level = bP.level
            players[id].kills = bP.kills
            players[id].deaths = bP.deaths
            players[id].type = bP.type
            players[id].health = bP.health
            players[id].shield = bP.shield
            players[id].lastHitTime = bP.lastHitTime
        }
    }
    for (const id in players) {
        if (!backendPlayers[id]) {
            delete players[id]
        }
    }
    const movement = {
        name: ign,
        left: aPressed,
        right: dPressed,
        up: wPressed,
        down: sPressed
    }
    socket.emit('movement', movement)
    nameEl.innerText = ign
    killEl.innerText = players[ego].kills
    deathEl.innerText = players[ego].deaths
    healEl.innerHTML = "<span style='color: lime'>" + players[ego].health + "</span> | <span style='color: #5e90da'>" + players[ego].shield + "</span>"
    typeEl.innerText = typeNames[players[ego].type]

    const sortPlayers = players
    sortPlayers.sort(function (a, b) {
        return a.kills - b.kills
    })
    console.log(sortPlayers)
})

// new coordinate data
socket.on('updateCords', (bCords) => {
    for (const id in players) {
        players[id].name = bCords[id].name
        players[id].x = bCords[id].x
        players[id].y = bCords[id].y
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
        if (!projectiles[id]) {
            let color = 'red'
            if (socket.id === bP.shooter) {
                color = 'blue'
            }
            projectiles[id] = new Projectile({
                x: bP.x,
                y: bP.y,
                radius: bP.radius,
                color: color
            })
        } else {
            projectiles[id].x = bP.x
            projectiles[id].y = bP.y
        }
    }
})

// set obstacle map
socket.on('setObstacles', (backendObstacles) => {
    obstacles = backendObstacles
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

// new tps data
socket.on('tps', (tps => {
    recentTPS.push(tps)
}))

// main frame loop
let animationId
function animate() {
    animationId = requestAnimationFrame(animate)
    c.fillStyle = 'rgba(0, 0, 0, 0.35)'
    c.fillRect(0, 0, map.width*devicePxRat, map.height*devicePxRat)
    c.strokeStyle = 'rgb(30, 30, 30)'
    for (let i = 0; i < (map.width+50)*devicePxRat; i+=50*devicePxRat) {
        c.moveTo(i-cam.x, 0-cam.y)
        c.lineTo(i-cam.x, map.height*devicePxRat-cam.y)
    }
    for (let i = 0; i < (map.height+50)*devicePxRat; i+=50*devicePxRat) {
        c.moveTo(0-cam.x, i-cam.y)
        c.lineTo(map.width*devicePxRat-cam.x, i-cam.y)
    }
    c.stroke()

    try {
        cam = {
            x: players[ego].x * devicePxRat - innerWidth * devicePxRat / 2,
            y: players[ego].y * devicePxRat - innerHeight * devicePxRat / 2
        }
    } catch (e) {}
    if (Date.now() - players[ego].lastHitTime < 10000) {
        selShot.setAttribute("disabled", "disabled")
        selSpray.setAttribute("disabled", "disabled")
        selSnipe.setAttribute("disabled", "disabled")
        selShot.innerText = Math.round((10000 - (Date.now() - players[ego].lastHitTime))/100)/10
        selSpray.innerText = Math.round((10000 - (Date.now() - players[ego].lastHitTime))/100)/10
        selSnipe.innerText = Math.round((10000 - (Date.now() - players[ego].lastHitTime))/100)/10
    } else if (selSpray.hasAttribute("disabled")) {
        selShot.removeAttribute("disabled")
        selSpray.removeAttribute("disabled")
        selSnipe.removeAttribute("disabled")
        selShot.innerHTML =  "<i class='bx bx-target-lock'></i> Shooter"
        selSpray.innerHTML = "<i class='bx bx-wifi'></i> Sprayer"
        selSnipe.innerHTML = "<i class='bx bx-bullseye' ></i> Sniper"
    }
    mEl.innerText = mouseAngle
    xCEl.innerText = cam.x
    yCEl.innerText = cam.y
    pCEl.innerText = Object.keys(players).length
    prCEl.innerText = Object.keys(projectiles).length
    const movement = {
        name: ign,
        left: aPressed,
        right: dPressed,
        up: wPressed,
        down: sPressed
    }
    if (mousedown) {
        socket.emit('shoot', mouseAngle)
    }
    socket.emit('movement', movement)

    for (const id in obstacles) {
        const obst = obstacles[id]
        c.fillStyle = "rgba(255, 0, 0, 0.1)"
        c.fillRect(obst.start.x*devicePxRat-cam.x, obst.start.y*devicePxRat-cam.y, obst.end.x*devicePxRat, obst.end.y*devicePxRat)
    }
    for (const id in projectiles) {
        const pr = projectiles[id]
        pr.draw()
    }
    for (const id in players) {
        const p = players[id]
        p.draw()
    }

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

// set onclick functions for type selectors
selShot.onclick = function () {
    socket.emit('selectType', 1)
}
selSpray.onclick = function () {
    socket.emit('selectType', 2)
}
selSnipe.onclick = function () {
    socket.emit('selectType', 3)
}

// call loops
updateTPS().then()
animate()
