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

// backend objects
const players = {}
const projectiles = []
const obstacles = [
    {
        start: {
            x: 1400,
            y: 900,
        },
        end: {
            x: 200,
            y: 200
        }
    },
    {
        start: {
            x: 1000,
            y: 950,
        },
        end: {
            x: 200,
            y: 100
        }
    },
    {
        start: {
            x: 1450,
            y: 500,
        },
        end: {
            x: 100,
            y: 200
        }
    },
    {
        start: {
            x: 1150,
            y: 650,
        },
        end: {
            x: 150,
            y: 150
        }
    },
    {
        start: {
            x: 1700,
            y: 650,
        },
        end: {
            x: 150,
            y: 150
        }
    },
    {
        start: {
            x: 1800,
            y: 950,
        },
        end: {
            x: 200,
            y: 100
        }
    },
    {
        start: {
            x: 1450,
            y: 1300,
        },
        end: {
            x: 100,
            y: 200
        }
    },
    {
        start: {
            x: 1150,
            y: 1200,
        },
        end: {
            x: 150,
            y: 150
        }
    },
    {
        start: {
            x: 1700,
            y: 1200,
        },
        end: {
            x: 150,
            y: 150
        }
    },
]

const types = {
    1: {
        name: "Shooter",
        dmg: 10,
        speed: 18,
        distance: 1200,
        radius: 7,
        cooldown: 1000/2.75 // 363
    },
    2: {
        name: "Sprayer",
        dmg: 8,
        speed: 15,
        distance: 500,
        radius: 12,
        cooldown: 100
    },
    3: {
        name: "Sniper",
        dmg: 35,
        speed: 40,
        distance: 10000,
        radius: 5,
        cooldown: 800
    }
}

// deprecated player names array
const names = [
    "Andi Waffen", "Anna Nass", "Axel Schweiss", "Albert Tross", "Ali Baba", "Anne Wand",
    "Bob Fahrer", "Bill Ich", "Bren Essel", "Claire Grube", "Dick Erchen", "Bernhard Diener",
    "Dick S.Ding", "Ed Ding", "Ernst Haft", "Frank Reich", "Andi Mauer", "Hans A. Bier", "Hans Maul",
    "Heide Witzka", "Hein Blöd", "Heinz Ellmann", "Fixie", "Hugo Slawien", "Jake Daniel", "Gorbatschow",
    "James Bond", "Jo Ghurt", "A. Merkel", "Ken Tucky", "Klara Fall", "Lisa Bonn", "Mark Aber", "Marta Pfahl",
    "Mary Huana", "Miss Raten", "Peter Pan", "Peter Silie", "Phil Fraß", "Reiner Korn", "Reiner Zufall", "Wilma Bier"
]

// player damage
function dmgPlayer(target, dmg, attacker) {
    console.log(dmg + " damage to " + players[target].name)
    if (attacker !== undefined) {
        players[target].lastDamager = attacker
    }
    if (players[target].shield > 0) {
        if (players[target].shield > dmg) {
            players[target].shield -= dmg
        } else {
            let restDmg = dmg
            restDmg -= players[target].shield
            players[target].shield = 0
            players[target].health -= restDmg
        }
    } else {
        players[target].health -= dmg
    }
    if (players[target].health <= 0) {
        deadPlayer(target, attacker)
    }
    io.emit('updatePlayers', players)
}

// reset dead player
function deadPlayer(dead) {
    let killerName
    let killerType
    if (players[dead].lastDamager === undefined) {
        killerName = "[Intentional Game Design]"
        killerType = ""
    } else {
        let killer =  players[dead].lastDamager
        killerName = players[killer].name
        killerType = "(" + types[players[killer].type].name + ")"
        players[killer].kills += 1
    }
    console.log(players[dead].name + " player was killed by " + killerName)
    players[dead].deaths += 1
    players[dead].x = Math.round(map.width*Math.random())
    players[dead].y = Math.round(map.height*Math.random())
    players[dead].lastShootTime = 0
    players[dead].health = 100
    players[dead].shield = 0
    io.emit('logEntry', "<i class='bx bxs-skull' ></i> <span style='color: red'>" + players[dead].name + "</span> (" + types[players[dead].type].name + ") " +
        "<i class='bx bx-chevrons-left' ></i> <span style='color: lime'>" + killerName + "</span> " + killerType)
}

// check if object passes through obstacle
function inObstacle(x, y, radius) {
    for (const id in obstacles) {
        const obst = obstacles[id]
        if (x + radius > obst.start.x &&
            y + radius > obst.start.y &&
            x - radius < obst.start.x + obst.end.x &&
            y - radius < obst.start.y + obst.end.y) {
            return true
        }
    }
    return false
}

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
        lastHitTime: 0,
        lastDamager: undefined,
        level: 0,
        kills: 0,
        deaths: 0,
        type: 1,
        health: 100,
        shield: 50
    }
    // update player objects on clients
    io.emit('updatePlayers', players)
    socket.emit('setObstacles', obstacles)

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
        const type = types[players[socket.id].type]
        if (Date.now()-players[socket.id].lastShootTime >= type.cooldown) {
            projectiles.push({
                shooter: socket.id,
                angle: angle,
                type: players[socket.id].type,
                x: players[socket.id].x,
                y: players[socket.id].y,
                vel: {
                    x: Math.cos(angle),
                    y: Math.sin(angle)
                },
                origin: {
                    x: players[socket.id].x,
                    y: players[socket.id].y
                },
                radius: type.radius
            })
            players[socket.id].lastShootTime = Date.now()
        }
    })

    socket.on('selectType', (type) => {
        if (types[type] !== undefined && Date.now() - players[socket.id].lastHitTime > 10000) {
            players[socket.id].type = type
            io.emit('updatePlayers', players)
        }
    })

    socket.on('disconnect', (reason) => {
        console.log(reason)
        names.push(players[socket.id].name)
        for (const id in projectiles) {
            if (projectiles[id].shooter === socket.id) {
                projectiles.splice(id, 1)
            }
        }
        delete players[socket.id]
        io.emit('updatePlayers', players)
    })
})

function update() {
    for (const id in projectiles) {
        try {
            const type = types[projectiles[id].type]
            projectiles[id].x += projectiles[id].vel.x * type.speed
            projectiles[id].y += projectiles[id].vel.y * type.speed

            const travel = Math.sqrt(Math.pow(projectiles[id].x-projectiles[id].origin.x, 2) +
                Math.pow(projectiles[id].y-projectiles[id].origin.y, 2))
            if (projectiles[id].x > map.width || projectiles[id].x < 0 || projectiles[id].y > map.height ||
                projectiles[id].y < 0 || travel > type.distance || inObstacle(projectiles[id].x, projectiles[id].y, type.radius)) {
                projectiles.splice(id, 1)
            }
        } catch (e) {
            projectiles.splice(id, 1)
        }
    }
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

        for (const pid in projectiles) {
            const proj = projectiles[pid]
            if (proj.shooter === id) {
                continue
            }
            const dist = Math.hypot(proj.x - players[id].x, proj.y - players[id].y)

            if (dist - 20 - proj.radius < 1) {
                // projectile hit
                players[proj.shooter].lastHitTime = Date.now()
                dmgPlayer(id, types[proj.type].dmg, proj.shooter)
                projectiles.splice(pid, 1)
            }
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

async function oneSecTick() {
    for (const id in obstacles) {
        const obst = obstacles[id]
        for (const player in players) {
            const p = players[player]
            if (p.x + 20 > obst.start.x &&
                p.y + 20 > obst.start.y &&
                p.x - 20 < obst.start.x + obst.end.x &&
                p.y - 20 < obst.start.y + obst.end.y) {
                // player is in obstacle
                dmgPlayer(player, 15, undefined)
            }
        }
    }
    setTimeout(function () {
        oneSecTick()
    }, 1000)
}

server.listen(port, () => {
    console.log(`App listening on port ${port}`)
})

oneSecTick().then()
update()