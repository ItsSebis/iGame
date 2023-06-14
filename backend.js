// tps calculate factor
let lastUpdateTime = 0

// initialize express server
const express = require('express')
const backend = express()
const port = 6969
const admin = express()
const aPort = 1870

// require bcrypt
const bcrypt = require("bcrypt")

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
const names = {}
const admins = []
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
        error: 0.4,
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
        speed: 8,
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

// add health to player
function healPlayer(target, heal, overflow) {
    if (players[target] !== undefined) {
        if (players[target].health + heal <= 100) {
            players[target].health += heal
        } else {
            if (100-players[target].health > 0) {
                heal -= 100 - players[target].health
                players[target].health = 100
            }
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
        if (players[id].god) {
            continue
        }
        const dist = Math.hypot(x - players[id].x, y - players[id].y)

        if (dist - power * 50 - 20 < 1) {
            // in explosion
            const dmg = 25*power*players[attacker].dmgFactor
            dmgPlayer(id, dmg, attacker)
            if (id !== attacker) {
                io.to(id).emit('explosion', {x: x, y: y, power: power})
            }
            io.to(attacker).to(id).emit('damageDealt', {
                crit: false,
                x: players[id].x,
                y: players[id].y,
                dmg: dmg
            })
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
        if (target !== attacker || players[target].lastDamager === undefined) {
            players[target].lastDamager = attacker
        }
        if (target !== attacker) {
            if (players[attacker].swapInst) {
                players[attacker].lastHitTime = 0
            } else {
                players[attacker].lastHitTime = Date.now()
            }
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

// reset player
function resetPlayer(target) {
    const cords = getNiceCords(25)
    players[target].x = cords.x
    players[target].y = cords.y
    players[target].kills = 0
    players[target].deaths = 0
    players[target].admin = false
    players[target].health = 100
    players[target].lastHitTime = 0
    players[target].lastShootTime = 0
    players[target].lastDamager = undefined
    players[target].level = 0
    players[target].shield = 50
    players[target].dmgDealt = 0
    players[target].speedFactor = 1
    players[target].ghost = false
    players[target].god = false
    players[target].swapInst = false
    players[target].dmgFactor = 1
    players[target].critFactor = 0
    players[target].cooldown = -1
    players[target].shootError = true
    io.to(target).emit('noAdmin')
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
        angle: 0,
        // admin vars
        admin: false,
        sebi:false,
        speedFactor: 1,
        ghost: false,
        swapInst: false,
        dmgFactor: 1,
        critFactor: 0,
        cooldown: -1,
        shootError: true
    }
    // update player objects on clients
    socket.emit('setTypes', types)
    socket.emit('setObstacles', obstacles)
    io.emit('updatePlayers', players)

    // update velocity on player movement
    socket.on('movement', (movement) => {
        if (players[socket.id].name === null && movement.name.match(/^[a-zA-Z0-9]+$/) && movement.name.length <= 50) {
            let name = movement.name
            let nIndex = 2
            while (names[name] !== undefined) {
                name = movement.name + nIndex
                nIndex++
            }
            players[socket.id].name = name
            names[name] = socket.id
            console.log("Changed name of " + name)
            io.emit('logEntry', name + " joined the game")
            io.emit('updatePlayers', players)
        }
        if (players[socket.id].name === null) {
            return
        }
        if (movement.left ^ movement.right) {
            if (movement.left) {
                players[socket.id].vel.x = -1*speed*players[socket.id].speedFactor
            } else {
                players[socket.id].vel.x = speed*players[socket.id].speedFactor
            }
        } else {
            players[socket.id].vel.x = 0
        }
        if (movement.up ^ movement.down) {
            if (movement.up) {
                players[socket.id].vel.y = -1*speed*players[socket.id].speedFactor
            } else {
                players[socket.id].vel.y = speed*players[socket.id].speedFactor
            }
        } else {
            players[socket.id].vel.y = 0
        }
        players[socket.id].angle = movement.angle
    })

    socket.on('shoot', (angle) => {
        const type = types[players[socket.id].type]
        let cooldown = type.cooldown
        if (players[socket.id].cooldown !== -1) {
            cooldown = players[socket.id].cooldown
        }
        if (Date.now()-players[socket.id].lastShootTime >= cooldown) {
            for (let i = 0; i < type.amount; i++) {
                let shotError = Math.random()*type.error-type.error/2
                if (!players[socket.id].shootError) {
                    shotError = 0
                }
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
        if (types[type] !== undefined && (Date.now() - players[socket.id].lastHitTime > 10000 || players[socket.id].swapInst)) {
            players[socket.id].type = type
            io.emit('updatePlayers', players)
        }
    })

    socket.on('exec', (cmd) => {
        if (!players[socket.id].admin) {
            bcrypt.compare(cmd, "$2b$10$9JyUCbd3TPD2Le57Re2WBuA9c5ugLrRYULXHdhxj0xXMcREpRn49K", function (err, result) {
                if (result) {
                    socket.emit('gotAdmin')
                    players[socket.id].admin = true
                    players[socket.id].sebi = true
                    socket.join("adminRoom")
                    console.log("Player Admin authenticated")
                    socket.emit('logEntry', "<span style='color: lime'>Hey Sebi! You're authenticated! Do funny things!</span>")
                } else {
                    bcrypt.compare(cmd, "$2b$10$DOQJBGvS6Sy85ibFaxBJU.D6nj.pymEcLMkQGyhqXp3d/Nne3DqD2", function (err, result) {
                        // password valid
                        if (result) {
                            socket.emit('gotAdmin')
                            players[socket.id].admin = true
                            socket.join("adminRoom")
                            console.log("Player Admin authenticated")
                            socket.emit('logEntry', "<span style='color: lime'>Admin status authenticated! Do stupid things!</span>")
                        } else {
                            socket.emit('logEntry', "<span style='color: red'>Admin status NOT authenticated! Don't do stupid things!</span>")
                        }
                    })
                }
            })
        } else {
            const args = cmd.split(" ")
            switch (args[0].toLowerCase()) {
                case "speed": {
                    let target
                    let speed
                    if (args.length === 1) {
                        speed = 1
                    } else if (!args[1].match(/^[0-9]\d*(\.\d+)?$/)) {
                        socket.emit('logEntry', "This is not a valid decimal to set your speed to!")
                        break
                    } else {
                        speed = Number(args[1])
                    }
                    if (args.length >= 3 && args[2] !== "") {
                        if (names[args[2]] !== undefined) {
                            target = names[args[2]]
                        } else {
                            socket.emit('logEntry', `${args[2]} is not a player in this game!`)
                            break
                        }
                    } else {
                        target = socket.id
                    }
                    if (players[target].sebi && !players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    players[target].speedFactor = speed
                    socket.emit('logEntry', `Set movement speed factor for ${players[target].name} to ${speed}!`)
                    break
                }
                case "health": {
                    let target
                    let health
                    if (args.length < 2) {
                        socket.emit('logEntry', "This is not a valid decimal to set your health to!")
                        break
                    } else if (!args[1].match(/^[0-9]\d*(\.\d+)?$/)) {
                        socket.emit('logEntry', "This is not a valid decimal to set your health to!")
                        break
                    } else {
                        health = Number(args[1])
                    }
                    if (args.length >= 3 && args[2] !== "") {
                        if (names[args[2]] !== undefined) {
                            target = names[args[2]]
                        } else {
                            socket.emit('logEntry', `${args[2]} is not a player in this game!`)
                            break
                        }
                    } else {
                        target = socket.id
                    }
                    if (players[target].sebi && !players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    players[target].health = health
                    io.emit('updatePlayers', players)
                    socket.emit('logEntry', `Set health for ${players[target].name} to ${health}!`)
                    break
                }
                case "dmg": {
                    let target
                    let dmg
                    if (args.length === 1) {
                        dmg = 1
                    } else if (!args[1].match(/^[0-9]\d*(\.\d+)?$/)) {
                        socket.emit('logEntry', "This is not a valid decimal to set your damage factor to!")
                        break
                    } else {
                        dmg = Number(args[1])
                    }
                    if (args.length >= 3 && args[2] !== "") {
                        if (names[args[2]] !== undefined) {
                            target = names[args[2]]
                        } else {
                            socket.emit('logEntry', `${args[2]} is not a player in this game!`)
                            break
                        }
                    } else {
                        target = socket.id
                    }
                    if (players[target].sebi && !players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    players[target].dmgFactor = dmg
                    socket.emit('logEntry', `Set damage multiplier for ${players[target].name} to ${dmg}!`)
                    break
                }
                case "crit": {
                    let target
                    let crit
                    if (args.length === 1) {
                        crit = 0
                    } else if (!args[1].match(/^[0-9]\d*(\.\d+)?$/)) {
                        socket.emit('logEntry', "This is not a valid decimal to set your crit factor to!")
                        break
                    } else {
                        crit = Number(args[1])
                    }
                    if (args.length >= 3 && args[2] !== "") {
                        if (names[args[2]] !== undefined) {
                            target = names[args[2]]
                        } else {
                            socket.emit('logEntry', `${args[2]} is not a player in this game!`)
                            break
                        }
                    } else {
                        target = socket.id
                    }
                    if (players[target].sebi && !players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    players[target].critFactor = crit
                    socket.emit('logEntry', `Set crit chance for ${players[target].name} to ${100/crit}%!`)
                    break
                }
                case "cooldown": {
                    let target
                    let cooldown
                    if (args.length === 1) {
                        cooldown = -1
                    } else if (names[args[1]] !== undefined) {
                        target = names[args[1]]
                        cooldown = -1
                    } else if (!args[1].match(/^[0-9]\d*(\.\d+)?$/)) {
                        socket.emit('logEntry', "This is not a valid decimal to set your crit factor to!")
                        break
                    } else {
                        cooldown = Number(args[1])
                    }
                    if (args.length >= 3 && args[2] !== "") {
                        if (names[args[2]] !== undefined) {
                            target = names[args[2]]
                        } else {
                            socket.emit('logEntry', `${args[2]} is not a player in this game!`)
                            break
                        }
                    } else if (target === undefined) {
                        target = socket.id
                    }
                    if (players[target].sebi && !players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    players[target].cooldown = cooldown
                    socket.emit('logEntry', `Set cooldown for ${players[target].name} to ${cooldown}!`)
                    break
                }
                case "ghost": {
                    let target
                    if (args.length > 1 && args[1] !== "") {
                        if (names[args[1]] === undefined) {
                            socket.emit('logEntry', `${args[1]} is not a player in this game!`)
                            break
                        } else {
                            target = names[args[1]]
                        }
                    } else {
                        target = socket.id
                    }
                    if (players[target].sebi && !players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    players[target].ghost = !players[target].ghost
                    socket.emit('logEntry', "Ghost mode for " + players[target].name + " is now: " + players[target].ghost + "!")
                    break
                }
                case "error": {
                    let target
                    if (args.length > 1 && args[1] !== "") {
                        if (names[args[1]] === undefined) {
                            socket.emit('logEntry', `${args[1]} is not a player in this game!`)
                            break
                        } else {
                            target = names[args[1]]
                        }
                    } else {
                        target = socket.id
                    }
                    if (players[target].sebi && !players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    players[target].shootError = !players[target].shootError
                    socket.emit('logEntry', "Shooting error for " + players[target].name + " is now: " + players[target].ghost + "!")
                    break
                }
                case "god": {
                    let target
                    if (args.length > 1 && args[1] !== "") {
                        if (names[args[1]] === undefined) {
                            socket.emit('logEntry', `${args[1]} is not a player in this game!`)
                            break
                        } else {
                            target = names[args[1]]
                        }
                    } else {
                        target = socket.id
                    }
                    if (players[target].sebi && !players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    players[target].god = !players[target].god
                    socket.emit('logEntry', "God mode for " + players[target].name + " is now: " + players[target].god + "!")
                    break
                }
                case "swapcool": {
                    let target
                    if (args.length > 1 && args[1] !== "") {
                        if (names[args[1]] === undefined) {
                            socket.emit('logEntry', `${args[1]} is not a player in this game!`)
                            break
                        } else {
                            target = names[args[1]]
                        }
                    } else {
                        target = socket.id
                    }
                    if (players[target].sebi && !players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    players[target].swapInst = !players[target].swapInst
                    socket.emit('logEntry', "Instant swap for " + players[target].name + " is now: " + players[target].swapInst + "!")
                    break
                }
                case "resetplayer": {
                    let target
                    if (args.length > 1 && args[1] !== "") {
                        if (names[args[1]] === undefined) {
                            socket.emit('logEntry', `${args[1]} is not a player in this game!`)
                            break
                        } else {
                            target = names[args[1]]
                        }
                    } else {
                        socket.emit('logEntry', `Please give a players name to reset!`)
                        break
                    }
                    if (players[target].sebi && !players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    resetPlayer(target)
                    io.emit('updatePlayers', players)
                    socket.emit('logEntry', `${players[target].name} was reset!`)
                    break
                }
                case "reset": {
                    if (!players[socket.id].sebi) {
                        socket.emit('logEntry', `You are not authorized to do this!`)
                        break
                    }
                    if (args.length !== 1) {
                        break
                    }
                    for (const id in players) {
                        resetPlayer(id)
                    }
                    io.emit('updatePlayers', players)
                    break
                }
                default: {
                    socket.emit('logEntry', "This is not a valid command!")
                }
            }
            console.log(players[socket.id].name + ": " + cmd)
        }
    })

    socket.on('disconnect', (reason) => {
        console.log(reason)
        io.emit('logEntry', players[socket.id].name + " left the game")
        for (const id in projectiles) {
            if (projectiles[id].shooter === socket.id) {
                projectiles.splice(id, 1)
            }
        }
        delete names[players[socket.id].name]
        delete players[socket.id]
        io.emit('updatePlayers', players)
    })
})

function update() {
    for (const id in admins) {
        if (players[admins[id]] === undefined || !players[admins[id]].admin) {
            delete admins[id]
        }
    }
    for (const id in projectiles) {
        try {
            const type = types[projectiles[id].type]
            projectiles[id].x += projectiles[id].vel.x * type.speed
            projectiles[id].y += projectiles[id].vel.y * type.speed

            const travel = Math.sqrt(Math.pow(projectiles[id].x-projectiles[id].origin.x, 2) +
                Math.pow(projectiles[id].y-projectiles[id].origin.y, 2))
            if (!players[projectiles[id].shooter].ghost && inObstacle(projectiles[id].x, projectiles[id].y, type.radius)) {
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

        let obstacleX = false
        let obstacleY = false
        if (!players[id].ghost) {
            if (inObstacle(players[id].x + players[id].vel.x, players[id].y, 15)) {
                //factor = 0.75
                obstacleX = true
            }
            if (inObstacle(players[id].x, players[id].y + players[id].vel.y, 15)) {
                //factor = 0.75
                obstacleY = true
            }
        }

        // x position
        if (players[id].x + players[id].vel.x + 20 < map.width && players[id].x + players[id].vel.x - 20 > 0 && !obstacleX) {
            players[id].x = players[id].x + players[id].vel.x
        }
        while (players[id].x + 20 >= map.width) {
            players[id].x -= 10
        }
        while (players[id].x - 20 <= 0) {
            players[id].x += 10
        }

        // y position
        if (players[id].y + players[id].vel.y + 20 < map.height && players[id].y + players[id].vel.y - 20 > 0 && !obstacleY) {
            players[id].y = players[id].y + players[id].vel.y
        }
        while (players[id].y + 20 >= map.height) {
            players[id].y -= 10
        }
        while (players[id].y - 20 <= 0) {
            players[id].y += 10
        }

        for (const pid in projectiles) {
            const proj = projectiles[pid]
            if (proj.shooter === id || players[id].god) {
                continue
            }
            const dist = Math.hypot(proj.x - players[id].x, proj.y - players[id].y)

            if (dist - 20 - proj.radius < 1) {
                // projectile hit
                let dmg = Math.round(types[proj.type].dmg/(types[proj.type].distance/proj.distance))*players[proj.shooter].dmgFactor
                let critP = types[proj.type].critical
                if (players[proj.shooter].critFactor !== 0) {
                    critP = players[proj.shooter].critFactor
                }
                const random = Math.floor(Math.random()*critP)+1
                if (random === critP) {
                    dmg *= 2
                }
                if (dmg !== 0) {
                    io.to(proj.shooter).to(id).emit('damageDealt', {
                        crit: random === critP,
                        x: players[id].x,
                        y: players[id].y,
                        dmg: dmg
                    })
                    dmgPlayer(id, dmg, proj.shooter, false)
                }
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

        if (players[id].admin) {
            if (!admins.includes(id)) {
                admins.push(id)
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
    io.to("adminRoom").emit('admins', Object.values(admins))
    io.emit('updateCords', players)
    aio.to('adminRoom').emit('updatePlayers', players)
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

// Admin panel
aio.on('connection', (socket) => {
    socket.on('authenticate', (password) => {
        bcrypt.compare(password, "$2b$10$ORp0YNGY6TTjAeZX/ZJSueAjZFYeUClyRzTqkaWVnyUdUG2l1KMAG", function (err, result) {
            // password valid
            if (result) {
                socket.emit('authenticated')
                socket.join("adminRoom")
                console.log("AdminView authenticated")
            }
        })
    })
})

server.listen(port, () => {
    console.log(`App listening on port ${port}`)
})
adminServer.listen(aPort, () => {
    console.log(`Admin server listening on port ${aPort}`)
})

// oneSecTick().then()
update()