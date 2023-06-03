// tps calculate factor
let lastUpdateTime = 0

// initialize express server
const express = require('express')
const backend = express()
const port = 6969

// socket.io setup
const http = require('http')
const server = http.createServer(backend)
const { Server } = require('socket.io')
const io = new Server(server, {pingInterval: 500, pingTimeout: 1000})

// setup express server
backend.use(express.static('./public'))
backend.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
})

// speed: movement speed per tick
let speed = 4
// map size
const map = {
    height: 2000,
    width: 3000
}

// backend players and projectiles object
const players = {}
const projectiles = []

// deprecated player names array
const names = [
    "Andi Waffen", "Anna Nass", "Axel Schweiss", "Albert Tross", "Ali Baba", "Anne Wand",
    "Bob Fahrer", "Bill Ich", "Bren Essel", "Claire Grube", "Dick Erchen", "Bernhard Diener",
    "Dick S.Ding", "Ed Ding", "Ernst Haft", "Frank Reich", "Andi Mauer", "Hans A. Bier", "Hans Maul",
    "Heide Witzka", "Hein Blöd", "Heinz Ellmann", "Fixie", "Hugo Slawien", "Jake Daniel", "Gorbatschow",
    "James Bond", "Jo Ghurt", "A. Merkel", "Ken Tucky", "Klara Fall", "Lisa Bonn", "Mark Aber", "Marta Pfahl",
    "Mary Huana", "Miss Raten", "Peter Pan", "Peter Silie", "Phil Fraß", "Reiner Korn", "Reiner Zufall", "Wilma Bier"
]

// initialize connection to socket
io.on('connection', (socket) => {
    console.log("a user connected")
    // create players entry for new player
    players[socket.id] = {
        x: Math.round(map.width*Math.random()),
        y: Math.round(map.height*Math.random()),
        vel: {
            x: 0,
            y: 0
        },
        name: null,
        lastShootTime: 0,
        level: 0,
        kills: 0,
        deaths: 0,
        type: 1,
        health: 100
    }
    // update player objects on clients
    io.emit('updatePlayers', players)

    // update velocity on player movement
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

    socket.on('shoot', (angle) => {
        projectiles.push({
            shooter: socket.id,
            dmg: 10,
            angle: angle,
            type: players[socket.id].type,
            vel: {
                x: Math.cos(angle) * 5,
                y: Math.sin(angle) * 5
            },
            x: players[socket.id].x,
            y: players[socket.id].y,
            origin: {
                x: players[socket.id].x,
                y: players[socket.id].y
            },
            radius: 5
        })
    })

    socket.on('disconnect', (reason) => {
        console.log(reason)
        names.push(players[socket.id].name)
        delete players[socket.id]
        io.emit('updatePlayers', players)
    })
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
    io.emit('updateProj', projectiles)
    const end = Date.now();
    //console.log("\rCurrent TPS: " + Math.round(1000/(end-lastUpdateTime)))
    io.emit('tps', 1000/(end-lastUpdateTime))
    lastUpdateTime = end
    setTimeout(function () {
        update()
    }, 15)
}
update().then()

server.listen(port, () => {
    console.log(`App listening on port ${port}`)
})