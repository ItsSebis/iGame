#!/usr/bin/env node
const start = Date.now();
let lastUpdateTime = 0

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

let speed = 4
const map = {
    height: 2000,
    width: 2000
}
const players = {}
const names = [
    "Andi Waffen", "Anna Nass", "Axel Schweiss", "Albert Tross", "Ali Baba", "Anne Wand",
    "Bob Fahrer", "Bill Ich", "Bren Essel", "Claire Grube", "Dick Erchen", "Bernhard Diener",
    "Dick S.Ding", "Ed Ding", "Ernst Haft", "Frank Reich", "Andi Mauer", "Hans A. Bier", "Hans Maul",
    "Heide Witzka", "Hein Blöd", "Heinz Ellmann", "Fixie", "Hugo Slawien", "Jake Daniel", "Gorbatschow",
    "James Bond", "Jo Ghurt", "A. Merkel", "Ken Tucky", "Klara Fall", "Lisa Bonn", "Mark Aber", "Marta Pfahl",
    "Mary Huana", "Miss Raten", "Peter Pan", "Peter Silie", "Phil Fraß", "Reiner Korn", "Reiner Zufall", "Wilma Bier"
]

io.on('connection', (socket) => {
    console.log("A user connected")
    players[socket.id] = {
        x: Math.round(map.width*Math.random()),
        y: Math.round(map.height*Math.random()),
        vel: {
            x: 0,
            y: 0
        },
        name: null
    }
    io.emit('updatePlayers', players)

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

    socket.on('disconnect', (reason) => {
        console.log(reason)
        names.push(players[socket.id].name)
        delete players[socket.id]
        io.emit('updatePlayers', players)
    })

    console.log(players)
})

async function update() {
    for (const id in players) {
        if (players[id].x === undefined || players[id].y === undefined) {
            continue
        }

        // x position
        if (players[id].x + players[id].vel.x + 20 < map.width && players[id].x + players[id].vel.x - 20 > 0) {
            players[id].x = players[id].x + players[id].vel.x
        }
        while (players[id].x + players[id].vel.x + 20 >= map.width) {
            players[id].x -= 10
        }
        while (players[id].x + players[id].vel.x - 20 <= 0) {
            players[id].x += 10
        }

        // y position
        if (players[id].y + players[id].vel.y + 20 < map.height && players[id].y + players[id].vel.y - 20 > 0) {
            players[id].y = players[id].y + players[id].vel.y
        }
        while (players[id].y + players[id].vel.y + 20 >= map.height) {
            players[id].y -= 10
        }
        while (players[id].y + players[id].vel.y - 20 <= 0) {
            players[id].y += 10
        }
    }
    io.emit('updateCords', players)
    const end = Date.now();
    //console.log("\rCurrent TPS: " + Math.round(1000/(end-lastUpdateTime)))
    io.emit('tps', end-lastUpdateTime)
    lastUpdateTime = end
    setTimeout(function () {
        update()
    }, 15)
}
update().then()

server.listen(port, () => {
    console.log(`App listening on port ${port}`)
})