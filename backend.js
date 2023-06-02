#!/usr/bin/env node
const start = Date.now();
const express = require('express')
const backend = express()
const port = 6969

// socket.io setup
const http = require('http')
const server = http.createServer(backend)
const { Server } = require('socket.io')
const io = new Server(server, {pingInterval: 500, pingTimeout: 1000})

backend.use(express.static('./public'))

backend.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
})

let speed = 5
const map = {
    height: 1000,
    width: 1000
}
const players = {}

io.on('connection', (socket) => {
    console.log("A user connected")
    players[socket.id] = {
        x: 500,
        y: 500,
        vel: {
            x: 0,
            y: 0
        },
        name: null
    }

    socket.on('movement', (movement) => {
        players[socket.id].name = movement.name
        if (movement.left ^ movement.right) {
            if (movement.left) {
                players[socket.id].vel.x = -1*speed
            } else {
                players[socket.id].vel.x = speed
            }
        } else {
            players[socket.id].vel.x = 0
        }
        if (movement.up ^ movement.down) {
            if (movement.up) {
                players[socket.id].vel.y = -1*speed
            } else {
                players[socket.id].vel.y = speed
            }
        } else {
            players[socket.id].vel.y = 0
        }
        socket.emit('updateCords', players)
    })

    io.emit('updatePlayers', players)

    socket.on('disconnect', (reason) => {
        console.log(reason)
        delete players[socket.id]
        io.emit('updatePlayers', players)
    })

    console.log(players)
})

async function update() {
    for (const id in players) {
        const player = players[id]
        if (players[id].x + players[id].vel.x + 20 < map.width && players[id].x + players[id].vel.x - 20 > 0) {
            players[id].x = players[id].x + players[id].vel.x
        }
        if (players[id].y + players[id].vel.y + 20 < map.height && players[id].y + players[id].vel.y - 20 > 0) {
            players[id].y = players[id].y + players[id].vel.y
        }
    }
    io.emit('updateCords', players)
    setTimeout(function () {
        update()
    }, 20)
}
update()

server.listen(port, () => {
    console.log(`App listening on port ${port}`)
})