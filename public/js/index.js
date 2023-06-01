const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const socket = io();

const scoreEl = document.querySelector('#scoreEl')

const devicePxRat = window.devicePixelRatio || 1

canvas.width = innerWidth * devicePxRat
canvas.height = innerHeight * devicePxRat

const x = canvas.width / 2
const y = canvas.height / 2

// Movement vars
let aPressed = false
let dPressed = false
let wPressed = false
let sPressed = false

let ego = undefined
const players = {}

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
                name: bP.name,
                velocity: bP.velocity
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
        players[id].x = bCords[id].x
        players[id].y = bCords[id].y
    }
})

let animationId
function animate() {
    animationId = requestAnimationFrame(animate)
    c.fillStyle = 'rgba(0, 0, 0, 1)'
    c.fillRect(0, 0, canvas.width, canvas.height)
    c.strokeStyle = 'rgb(30, 30, 30)'
    for (let i = 0; i < canvas.width; i+=50) {
        c.moveTo(i, 0)
        c.lineTo(i, canvas.height)
        c.stroke()
    }
    for (let i = 0; i < canvas.height; i+=50) {
        c.moveTo(0, i)
        c.lineTo(canvas.width, i)
        c.stroke()
    }

    const movement = {
        left: aPressed,
        right: dPressed,
        up: wPressed,
        down: sPressed
    }
    socket.emit('movement', movement)

    for (const id in players) {
        const p = players[id]
        p.draw()
    }
}

animate()