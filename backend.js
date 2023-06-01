#!/usr/bin/env node
const express = require('express')
const backend = express()

// socket.io setup
const http = require('http')
const server = http.createServer(backend)
const { Server } = require('socket.io')
const io = new Server(server, {pingInterval: 500, pingTimeout: 1000})

const port = 6969

backend.use(express.static('./public'))

backend.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
})

let speed = 2
const players = {}

io.on('connection', (socket) => {
    console.log("A user connected")
    players[socket.id] = {
        x: 1920 * Math.random(),
        y: 1010 * Math.random(),
        name: socket.id
    }

    socket.on('movement', (movement) => {
        if (movement.left ^ movement.right) {
            if (movement.left) {
                if (players[socket.id].x + (-1*speed) - 20 > 0) {
                    players[socket.id].x += -1 * speed
                }
            } else {
                if (players[socket.id].x + speed + 20 < 1920) {
                    players[socket.id].x += speed
                }
            }
        }
        if (movement.up ^ movement.down) {
            if (movement.up) {
                if (players[socket.id].y + (-1*speed) - 20 > 0) {
                    players[socket.id].y += -1*speed
                }
            } else {
                if (players[socket.id].y + speed + 20 < 1010) {
                    players[socket.id].y += speed
                }
            }
        }
        io.emit('updateCords', players)
    })

    io.emit('updatePlayers', players)

    socket.on('disconnect', (reason) => {
        console.log(reason)
        delete players[socket.id]
        io.emit('updatePlayers', players)
    })

    console.log(players)
})

server.listen(port, () => {
    console.log(`App listening on port ${port}`)
})