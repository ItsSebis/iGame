const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const socket = io();

const tpsEl = document.querySelector('#tpsEl')
let recentTPS = []

const devicePxRat = window.devicePixelRatio || 1

canvas.width = innerWidth * devicePxRat
canvas.height = innerHeight * devicePxRat
const xEl = document.querySelector('#xEl')
const yEl = document.querySelector('#yEl')
const xCEl = document.querySelector('#xCEl')
const yCEl = document.querySelector('#yCEl')

// Movement vars
let aPressed = false
let dPressed = false
let wPressed = false
let sPressed = false

let cam = {
    x: 0,
    y: 0
}
let ego = undefined
const players = {}

function avg(array) {
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
        sum += array[i];
    }
    return sum / array.length
}

socket.on('updatePlayers', (backendPlayers) => {
    console.log(backendPlayers)
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
                name: bP.name
            })
        }
    }
    for (const id in players) {
        if (!backendPlayers[id]) {
            delete players[id]
        }
    }
})

socket.on('updateCords', (bCords) => {
    for (const id in players) {
        players[id].name = bCords[id].name
        players[id].x = bCords[id].x
        players[id].y = bCords[id].y
    }
    xEl.innerText = players[ego].x
    yEl.innerText = players[ego].y
})

socket.on('tps', (tps => {
    recentTPS.push(tps)
}))

let animationId
function animate() {
    animationId = requestAnimationFrame(animate)
    c.fillStyle = 'rgba(0, 0, 0, 1)'
    c.fillRect(0, 0, 6000, 6000)
    c.strokeStyle = 'rgb(30, 30, 30)'
    for (let i = cam.y; i < canvas.width; i+=50*devicePxRat) {
        c.moveTo(i, cam.y)
        c.lineTo(i, canvas.height)
        c.stroke()
    }
    for (let i = cam.x; i < canvas.height; i+=50*devicePxRat) {
        c.moveTo(cam.x, i)
        c.lineTo(canvas.width, i)
        c.stroke()
    }

    const movement = {
        name: ign,
        left: aPressed,
        right: dPressed,
        up: wPressed,
        down: sPressed
    }
    socket.emit('movement', movement)
    cam = {
        x: players[ego].x-innerWidth/2,
        y: players[ego].y-innerHeight/2,
    }
    xCEl.innerText = cam.x
    yCEl.innerText = cam.y

    for (const id in players) {
        const p = players[id]
        p.draw()
    }
}

async function updateTPS() {
    const avgTps = avg(recentTPS);
    tpsEl.innerText = Math.round((1000/avgTps + Number.EPSILON) * 100) / 100
    recentTPS = []
    setTimeout(function () {
        updateTPS()
    }, 250)
}

updateTPS().then()
animate()
