// tps calculate factor
let lastUpdateTime = 0

// initialize express server
const express = require('express')
const backend = express()
const port = 6969
const admin = express()
const aPort = 1870

// socket.io setup
const http = require('http')
const { Server } = require('socket.io')

const adminServer = http.createServer(admin)
const aio = new Server(adminServer, {pingInterval: 1500, pingTimeout: 3000})

const server = http.createServer(backend)
const io = new Server(server, {pingInterval: 500, pingTimeout: 1000})

// setup express server
backend.use(express.static('./public'))
backend.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
})
admin.use(express.static('./admin'))
admin.get('/', (req, res) => {
    res.sendFile(__dirname + '/admin/index.html')
})

// speed: movement speed per tick
let speed = 3
// map size
const map = {
    height: 2000,
    width: 3000
}

// backend objects
const players = {}
const projectiles = []
const items = []
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
    {
        start: {
            x: 1250,
            y: 200,
        },
        end: {
            x: 500,
            y: 200
        }
    },
    {
        start: {
            x: 950,
            y: 250,
        },
        end: {
            x: 150,
            y: 100
        }
    },
    {
        start: {
            x: 850,
            y: 250,
        },
        end: {
            x: 100,
            y: 450
        }
    },
    {
        start: {
            x: 1450,
            y: 0,
        },
        end: {
            x: 100,
            y: 200
        }
    },
    {
        start: {
            x: 2000,
            y: 450,
        },
        end: {
            x: 300,
            y: 100
        }
    },
    {
        start: {
            x: 650,
            y: 850,
        },
        end: {
            x: 150,
            y: 300
        }
    },
    {
        start: {
            x: 300,
            y: 800,
        },
        end: {
            x: 50,
            y: 400
        }
    },
    {
        start: {
            x: 50,
            y: 950,
        },
        end: {
            x: 200,
            y: 100
        }
    },
    {
        start: {
            x: 500,
            y: 350,
        },
        end: {
            x: 300,
            y: 100
        }
    },
    {
        start: {
            x: 200,
            y: 400,
        },
        end: {
            x: 200,
            y: 200
        }
    },
    {
        start: {
            x: 450,
            y: 0,
        },
        end: {
            x: 100,
            y: 250
        }
    },
    {
        start: {
            x: 0,
            y: 250,
        },
        end: {
            x: 250,
            y: 50
        }
    },
    {
        start: {
            x: 200,
            y: 1400,
        },
        end: {
            x: 200,
            y: 200
        }
    },
    {
        start: {
            x: 450,
            y: 950,
        },
        end: {
            x: 100,
            y: 100
        }
    },
    {
        start: {
            x: 500,
            y: 1550,
        },
        end: {
            x: 250,
            y: 100
        }
    },
    {
        start: {
            x: 850,
            y: 1300,
        },
        end: {
            x: 100,
            y: 550
        }
    },
    {
        start: {
            x: 950,
            y: 1650,
        },
        end: {
            x: 150,
            y: 100
        }
    },
    {
        start: {
            x: 0,
            y: 1700,
        },
        end: {
            x: 250,
            y: 50
        }
    },
    {
        start: {
            x: 450,
            y: 1750,
        },
        end: {
            x: 100,
            y: 250
        }
    },
    {
        start: {
            x: 2300,
            y: 250,
        },
        end: {
            x: 250,
            y: 100
        }
    },
    {
        start: {
            x: 2650,
            y: 200,
        },
        end: {
            x: 300,
            y: 50
        }
    },
    {
        start: {
            x: 2050,
            y: 700,
        },
        end: {
            x: 600,
            y: 150
        }
    },
    {
        start: {
            x: 2600,
            y: 1000,
        },
        end: {
            x: 350,
            y: 100
        }
    },
    {
        start: {
            x: 2150,
            y: 1050,
        },
        end: {
            x: 300,
            y: 400
        }
    },
    {
        start: {
            x: 1750,
            y: 1500,
        },
        end: {
            x: 50,
            y: 500
        }
    },
    {
        start: {
            x: 1250,
            y: 1600,
        },
        end: {
            x: 250,
            y: 100
        }
    },
    {
        start: {
            x: 1200,
            y: 1800,
        },
        end: {
            x: 100,
            y: 200
        }
    },
    {
        start: {
            x: 1800,
            y: 1650,
        },
        end: {
            x: 300,
            y: 100
        }
    },
    {
        start: {
            x: 2500,
            y: 1300,
        },
        end: {
            x: 300,
            y: 50
        }
    },
    {
        start: {
            x: 2350,
            y: 1600,
        },
        end: {
            x: 100,
            y: 350
        }
    },
    {
        start: {
            x: 2700,
            y: 1550,
        },
        end: {
            x: 250,
            y: 150
        }
    },
]

const types = {
    1: {
        name: "Shooter",
        dmg: 20,
        amount: 1,
        error: 0.05,
        speed: 18,
        distance: 1500,
        radius: 8,
        cooldown: 1000/5.5, // 181
        critical: 7,
        barrel: {
            l: 45,
            w: 21
        },
        symbol: "<i class='bx bx-target-lock'></i>"
    },
    2: {
        name: "Sprayer",
        dmg: 8,
        amount: 1,
        error: 0.7,
        speed: 15,
        distance: 700,
        radius: 11,
        cooldown: 80,
        critical: 20,
        barrel: {
            l: 40,
            w: 36
        },
        symbol: "<i class='bx bx-spray-can' ></i>"
    },
    3: {
        name: "Sniper",
        dmg: 50,
        amount: 1,
        error: 0,
        speed: 35,
        distance: 10000,
        radius: 5,
        cooldown: 850,
        critical: 15,
        barrel: {
            l: 65,
            w: 15
        },
        symbol: "<i class='bx bx-bullseye' ></i>"
    },
    4: {
        name: "Shotgun",
        dmg: 11,
        amount: 8,
        error: 0.5,
        speed: 25,
        distance: 400,
        radius: 4,
        cooldown: 1000/0.7,
        critical: 30,
        barrel: {
            l: 50,
            w: 25
        },
        symbol: "<i class='bx bx-wifi'></i>"
    },
    5: {
        name: "RPG",
        dmg: 0,
        amount: 1,
        error: 0,
        explode: 2,
        speed: 12,
        distance: 5000,
        radius: 18,
        cooldown: 1000/0.75,
        critical: 0,
        barrel: {
            l: 60,
            w: 30
        },
        symbol: "<i class='bx bx-rocket' ></i>"
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

// add health to player
function healPlayer(target, heal, overflow) {
    if (players[target] !== undefined) {
        if (players[target].health + heal <= 100) {
            players[target].health += heal
        } else {
            heal -= 100-players[target].health
            players[target].health = 100
            if (overflow) {
                if (players[target].shield + heal <= 100) {
                    players[target].shield += heal
                } else {
                    players[target].shield = 100
                }
            }
        }
    }
}

// explosion occurred on map
function explosion(x, y, power, attacker) {
    for (const id in players) {
        const dist = Math.hypot(x - players[id].x, y - players[id].y)

        if (dist - power * 50 - 20 < 1) {
            // in explosion
            dmgPlayer(id, 20*power, attacker)
            if (id !== attacker) {
                io.to(id).emit('explosion', {x: x, y: y, power: power})
            }
        }
    }
    if (attacker !== undefined) {
        io.to(attacker).emit('explosion', {x: x, y: y, power: power})
    }
}

// player damage
function dmgPlayer(target, dmg, attacker, venom) {
    if (dmg <= 0) {
        return
    }
    if (attacker !== undefined) {
        console.log(dmg + " damage to " + players[target].name)
        players[target].lastDamager = attacker
        if (target !== attacker) {
            players[attacker].lastHitTime = Date.now()
            players[attacker].dmgDealt += dmg
        }
    }
    if (players[target].shield > 0 && !venom) {
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
        if (dead !== killer) {
            players[killer].kills += 1
            healPlayer(killer, 25, true)
            io.to(killer).emit('kill')
        }
    }
    console.log(players[dead].name + " player was killed by " + killerName)
    players[dead].deaths += 1
    const cords = getNiceCords(25)
    players[dead].x = cords.x
    players[dead].y = cords.y
    players[dead].lastShootTime = 0
    players[dead].health = 100
    players[dead].shield = 0
    players[dead].lastDamager = undefined
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

// get nice start cords
function getNiceCords(radius) {
    let x = Math.round(map.width*Math.random())
    let y = Math.round(map.height*Math.random())
    let sX = x
    let sY = y

    let i = 0
    while (inObstacle(x, y, radius)) {
        if (sX < map.width/2) {
            x += 100
        } else {
            x -= 100
        }
        if (sY < map.height/2) {
            y += 100
        } else {
            y -= 100
        }
        i++
        console.log("Try: " + i + " x: " + x + " y: " + y)
    }
    return {x, y}
}

// initialize connection to socket
io.on('connection', (socket) => {
    console.log("a user connected")
    // create players entry for new player
    const cords = getNiceCords(25)
    players[socket.id] = {
        x: cords.x,
        y: cords.y,
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
        shield: 50,
        dmgDealt: 0,
        angle: 0
    }
    // update player objects on clients
    socket.emit('setTypes', types)
    socket.emit('setObstacles', obstacles)
    io.emit('updatePlayers', players)

    // update velocity on player movement
    socket.on('movement', (movement) => {
        if (players[socket.id].name === null && movement.name.match(/^[a-zA-Z0-9]+$/) && movement.name.length <= 50) {
            console.log("Changed name of " + movement.name)
            players[socket.id].name = movement.name
            io.emit('logEntry', movement.name + " joined the game")
            io.emit('updatePlayers', players)
        }
        if (players[socket.id].name === null) {
            return
        }
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
        players[socket.id].angle = movement.angle
    })

    socket.on('shoot', (angle) => {
        const type = types[players[socket.id].type]
        if (Date.now()-players[socket.id].lastShootTime >= type.cooldown) {
            for (let i = 0; i < type.amount; i++) {
                let shotError = Math.random()*type.error-type.error/2
                let finalAngle = angle+shotError
                if (finalAngle < 0-Math.PI) {
                    finalAngle += 2*Math.PI
                } else if (finalAngle > Math.PI) {
                    finalAngle -= 2* Math.PI
                }
                projectiles.push({
                    shooter: socket.id,
                    angle: angle,
                    type: players[socket.id].type,
                    x: players[socket.id].x,
                    y: players[socket.id].y,
                    vel: {
                        x: Math.cos(finalAngle),
                        y: Math.sin(finalAngle)
                    },
                    origin: {
                        x: players[socket.id].x,
                        y: players[socket.id].y
                    },
                    radius: type.radius,
                    distance: type.distance
                })
            }
            players[socket.id].lastShootTime = Date.now()
            io.to(socket.id).emit('shot')
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
        io.emit('logEntry', players[socket.id].name + " left the game")
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
            if (inObstacle(projectiles[id].x, projectiles[id].y, type.radius)) {
                if (types[projectiles[id].type].explode !== undefined) {
                    projectiles[id].distance = 0
                }
                projectiles[id].distance -= 8000
            }
            for (const pid in projectiles) {
                if (projectiles[id].shooter === projectiles[pid].shooter) {
                    continue
                }
                const dist = Math.hypot(projectiles[id].x - projectiles[pid].x, projectiles[id].y - projectiles[pid].y)

                if (dist - type.radius - types[projectiles[pid].type].radius < 1) {
                    projectiles[id].distance -= 1000
                }
            }
            if (projectiles[id].x > map.width || projectiles[id].x < 0 || projectiles[id].y > map.height ||
                projectiles[id].y < 0 || travel > projectiles[id].distance) {
                if (types[projectiles[id].type].explode !== undefined) {
                    explosion(projectiles[id].x, projectiles[id].y, types[projectiles[id].type].explode, projectiles[id].shooter)
                }
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

        let factor = 1
        let obstacleX = false
        let obstacleY = false
        if (inObstacle(players[id].x + players[id].vel.x, players[id].y, 15)) {
            //factor = 0.75
            obstacleX = true
        }
        if (inObstacle(players[id].x, players[id].y + players[id].vel.y, 15)) {
            //factor = 0.75
            obstacleY = true
        }

        // x position
        if (players[id].x + players[id].vel.x + 20 < map.width && players[id].x + players[id].vel.x - 20 > 0 && !obstacleX) {
            players[id].x = players[id].x + players[id].vel.x*factor
        }
        while (players[id].x + 20 >= map.width) {
            players[id].x -= 10
        }
        while (players[id].x - 20 <= 0) {
            players[id].x += 10
        }

        // y position
        if (players[id].y + players[id].vel.y + 20 < map.height && players[id].y + players[id].vel.y - 20 > 0 && !obstacleY) {
            players[id].y = players[id].y + players[id].vel.y*factor
        }
        while (players[id].y + 20 >= map.height) {
            players[id].y -= 10
        }
        while (players[id].y - 20 <= 0) {
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
                let dmg = Math.round(types[proj.type].dmg/(types[proj.type].distance/proj.distance))
                const random = Math.floor(Math.random()*types[proj.type].critical)+1
                io.to(proj.shooter).emit('damageDealt', (random === types[proj.type].critical))
                if (random === types[proj.type].critical) {
                    dmg *= 2
                }
                dmgPlayer(id, dmg, proj.shooter, false)
                if (types[proj.type].explode !== undefined) {
                    projectiles[pid].distance = 0
                }
                projectiles[pid].distance -= 3000
            }
        }

        for (const iid in items) {
            const item = items[iid]

            const dist = Math.hypot(item.x - players[id].x, item.y - players[id].y)

            if (dist - 20 - 30 < 1) {
                // touched item
                if (item.type === 0) {
                    if (players[id].health < 100) {
                        players[id].health = 100
                        items.splice(iid, 1)
                    }
                } else if (item.type === 1) {
                    if (players[id].shield < 100) {
                        players[id].shield = 100
                        items.splice(iid, 1)
                    }
                } else {
                    if (players[id].health < 100 || players[id].shield < 100) {
                        healPlayer(id, 75, true)
                        items.splice(iid, 1)
                    }
                }
                io.emit('updatePlayers', players)
            }
        }
    }
    if (items.length < 5) {
        const cords = getNiceCords(30)
        items.push({
            x: cords.x,
            y: cords.y,
            type: Math.floor(3*Math.random())
        })
        io.emit('updateItems', items)
    }
    io.emit('updateCords', players)
    io.emit('updateItems', items)
    io.emit('updateProj', projectiles)
    const end = Date.now();
    //console.log("\rCurrent TPS: " + Math.round(1000/(end-lastUpdateTime)))
    io.emit('tps', 1000/(end-lastUpdateTime))
    lastUpdateTime = end
    setTimeout(function () {
        update()
    }, 12)
}

// async function oneSecTick() {
//     for (const id in obstacles) {
//         const obst = obstacles[id]
//         for (const player in players) {
//             const p = players[player]
//             if (p.x + 10 > obst.start.x &&
//                 p.y + 10 > obst.start.y &&
//                 p.x - 10 < obst.start.x + obst.end.x &&
//                 p.y - 10 < obst.start.y + obst.end.y) {
//                 // player is in obstacle
//                 dmgPlayer(player, 10, undefined, true) // zero damage for tests
//             }
//         }
//     }
//     setTimeout(function () {
//         oneSecTick()
//     }, 1000)
// }

server.listen(port, () => {
    console.log(`App listening on port ${port}`)
})
adminServer.listen(aPort, () => {
    console.log(`Admin server listening on port ${aPort}`)
})

// oneSecTick().then()
update()