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
// require map configuration
const mapMod = require("./modules/map")

// Game init
const games = []
createGame("Public", undefined, 1)

// backend objects
const allSocks = {}
const names = {}
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

// create game
function createGame(description, owner, mode) {
    games.push({
        name: description,
        owner: owner,
        mode: mode,
        players: {},
        names: {},
        admins: [],
        projectiles: [],
        items: [],
        running: true,
        map: mapMod.getMap(0)
    })
    return games.length-1
}

// add health to player
function healPlayer(gameId, target, heal, overflow) {
    if (games[gameId].players[target] !== undefined) {
        if (games[gameId].players[target].health + heal <= 100) {
            games[gameId].players[target].health += heal
        } else {
            if (100-games[gameId].players[target].health > 0) {
                heal -= 100 - games[gameId].players[target].health
                games[gameId].players[target].health = 100
            }
            if (overflow) {
                if (games[gameId].players[target].shield + heal <= 100) {
                    games[gameId].players[target].shield += heal
                } else {
                    games[gameId].players[target].shield = 100
                }
            }
        }
    }
}

// explosion occurred on map
function explosion(gameId, x, y, power, attacker) {
    for (const id in games[gameId].players) {
        if (games[gameId].players[id].god) {
            continue
        }
        const dist = Math.hypot(x - games[gameId].players[id].x, y - games[gameId].players[id].y)

        if (dist - power * 50 - 20 < 1) {
            // in explosion
            const dmg = 25*power
            dmgPlayer(gameId, id, dmg, attacker, false, false)
            io.to(id).emit('explosion', {x: x, y: y, power: power})
            if (id !== attacker) {
            }
        }
    }
    io.to('Game'+gameId).emit('explosion', {x: x, y: y, power: power})
}

// player damage
function dmgPlayer(gameId, target, dmg, attacker, venom, isCrit) {
    if (dmg <= 0 || games[gameId].players[target].lessDmg === 0) {
        return
    }
    if (isCrit) {
        dmg *= 2
    }
    dmg = dmg*(1/games[gameId].players[target].lessDmg)
    if (attacker !== undefined) {
        dmg = dmg*games[gameId].players[attacker].dmgFactor
        dmg = Math.round(dmg)
        console.log(dmg + " damage to " + games[gameId].players[target].name)
        if (target !== attacker || games[gameId].players[target].lastDamager === undefined) {
            games[gameId].players[target].lastDamager = attacker
        }
        if (target !== attacker) {
            if (games[gameId].players[attacker].swapInst) {
                games[gameId].players[attacker].lastHitTime = 0
            } else {
                games[gameId].players[attacker].lastHitTime = Date.now()
            }
            games[gameId].players[attacker].dmgDealt += dmg
        }
    }
    if (games[gameId].players[target].shield > 0 && !venom) {
        if (games[gameId].players[target].shield > dmg) {
            games[gameId].players[target].shield -= dmg
        } else {
            let restDmg = dmg
            restDmg -= games[gameId].players[target].shield
            games[gameId].players[target].shield = 0
            games[gameId].players[target].health -= restDmg
        }
    } else {
        games[gameId].players[target].health -= dmg
    }
    io.to('Game'+gameId).emit('damageDealt', {
        crit: isCrit,
        x: games[gameId].players[target].x,
        y: games[gameId].players[target].y,
        dmg: dmg
    })
    if (games[gameId].players[target].health <= 0) {
        deadPlayer(gameId, target, attacker)
    }
    io.to('Game'+gameId).emit('updatePlayers', games[gameId].players)
}

// reset dead player
function deadPlayer(gameId, dead) {
    let killerName
    let killerType
    if (games[gameId].players[dead].lastDamager === undefined) {
        killerName = "[Intentional Game Design]"
        killerType = ""
    } else {
        let killer =  games[gameId].players[dead].lastDamager
        killerName = allSocks[killer].name
        killerType = "(" + types[games[gameId].players[killer].type].name + ")"
        if (dead !== killer) {
            games[gameId].players[killer].kills += 1
            healPlayer(gameId, killer, 25, true)
            io.to(killer).emit('kill')
        }
    }
    console.log(allSocks[dead].name + " player was killed by " + killerName)
    games[gameId].players[dead].deaths += 1
    const cords = getNiceCords(gameId, 25)
    games[gameId].players[dead].x = cords.x
    games[gameId].players[dead].y = cords.y
    games[gameId].players[dead].lastShootTime = 0
    games[gameId].players[dead].health = 100
    games[gameId].players[dead].shield = 0
    games[gameId].players[dead].lastDamager = undefined
    io.to('Game'+gameId).emit('logEntry', "<i class='bx bxs-skull' ></i> <span style='color: red'>" + allSocks[dead].name + "</span> (" + types[games[gameId].players[dead].type].name + ") " +
        "<i class='bx bx-chevrons-left' ></i> <span style='color: lime'>" + killerName + "</span> " + killerType)
}

// reset player
function resetPlayer(gameId, target) {
    const cords = getNiceCords(gameId, 25)
    games[gameId].players[target].x = cords.x
    games[gameId].players[target].y = cords.y
    games[gameId].players[target].kills = 0
    games[gameId].players[target].deaths = 0
    games[gameId].players[target].admin = false
    games[gameId].players[target].health = 100
    games[gameId].players[target].lastHitTime = 0
    games[gameId].players[target].lastShootTime = 0
    games[gameId].players[target].lastDamager = undefined
    games[gameId].players[target].level = 0
    games[gameId].players[target].shield = 50
    games[gameId].players[target].dmgDealt = 0
    games[gameId].players[target].speedFactor = 1
    games[gameId].players[target].ghost = false
    games[gameId].players[target].god = false
    games[gameId].players[target].swapInst = false
    games[gameId].players[target].dmgFactor = 1
    games[gameId].players[target].critFactor = 0
    games[gameId].players[target].cooldown = -1
    games[gameId].players[target].shootError = true
    io.to(target).emit('noAdmin')
}

// check if object passes through obstacle
function inObstacle(x, y, game, radius) {
    const gameObs = games[game].map.obstacles
    for (const id in gameObs) {
        const obst = gameObs[id]
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
function getNiceCords(game, radius) {
    const gameDim = games[game].map.dimensions
    let x = Math.round(gameDim.width*Math.random())
    let y = Math.round(gameDim.height*Math.random())
    let sX = x
    let sY = y

    let i = 0
    while (inObstacle(x, y, game, radius)) {
        if (sX < gameDim.width/2) {
            x += 100
        } else {
            x -= 100
        }
        if (sY < gameDim.height/2) {
            y += 100
        } else {
            y -= 100
        }
        i++
        console.log("Try: " + i + " x: " + x + " y: " + y)
    }
    return {x, y}
}

// leave game
function leaveGame(target) {
    if (games[allSocks[target].game] !== undefined) {
        for (const id in games[allSocks[target].game].projectiles) {
            if (games[allSocks[target].game].projectiles[id].shooter === target) {
                games[allSocks[target].game].projectiles.splice(Number(id), 1)
            }
        }
        delete games[allSocks[target].game].players[target]
        if (Object.keys(games[allSocks[target].game].players).length === 0 && Number(allSocks[target].game) !== 0) {
            // game empty and deleted
            games.splice(Number(allSocks[target].game), 1)
            console.log("Deleted game " + allSocks[target].game)
        }
    }
    allSocks[target].game = undefined
    if (!allSocks[target].sebi) {
        io.to(target).emit('noAdmin')
    }
    io.in(target).socketsLeave('Game'+allSocks[target].game)
    if (games[allSocks[target].game] !== undefined) {
        io.to('Game' + allSocks[target].game).emit('logEntry', allSocks[target].name + " left the game")
        io.to('Game' + allSocks[target].game).emit('updatePlayers', games[allSocks[target].game].players)
    }
    io.in(target).socketsJoin("menu")
    io.to(target).emit('games', games)
}

// endGame by target
async function endGame(gameId) {
    games[gameId].running = false
    setTimeout(function () {
        io.to('Game'+gameId).emit('endGame')
        for (const id in games[gameId].players) {
            leaveGame(id)
        }
    }, 5000)
}

// initialize connection to socket
io.on('connection', (socket) => {
    console.log("a user connected")
    socket.emit('setTypes', types)
    // update player objects on clients
    // io.to('Game'+gameId).emit('updateGame', games[gameId])

    allSocks[socket.id] = {
        game: undefined,
        name: null,
        sebi: false
    }

    socket.on('nameUpdate', (name) => {
        if (allSocks[socket.id].name === null && name !== null && name.match(/^[a-zA-Z0-9]+$/) && name.length <= 50 && names[name] === undefined) {
            allSocks[socket.id].name = name
            names[name] = socket.id
            socket.emit('nameDefined')
            socket.join("menu")
            socket.emit('games', games)
        } else {
            socket.emit('nameRejected')
        }
    })

    // update velocity on player movement
    socket.on('movement', (movement) => {
        if (allSocks[socket.id].game === undefined || allSocks[socket.id].name === null) {
            return;
        }
        try {
            const gameId = allSocks[socket.id].game
            if (movement.left ^ movement.right) {
                if (movement.left) {
                    games[gameId].players[socket.id].vel.x = -1*speed*games[gameId].players[socket.id].speedFactor
                } else {
                    games[gameId].players[socket.id].vel.x = speed*games[gameId].players[socket.id].speedFactor
                }
            } else {
                games[gameId].players[socket.id].vel.x = 0
            }
            if (movement.up ^ movement.down) {
                if (movement.up) {
                    games[gameId].players[socket.id].vel.y = -1*speed*games[gameId].players[socket.id].speedFactor
                } else {
                    games[gameId].players[socket.id].vel.y = speed*games[gameId].players[socket.id].speedFactor
                }
            } else {
                games[gameId].players[socket.id].vel.y = 0
            }
            games[gameId].players[socket.id].angle = movement.angle
        } catch (e) {}
    })

    socket.on('shoot', (angle) => {
        if (allSocks[socket.id].game === undefined) {
            return;
        }
        const gameId = allSocks[socket.id].game
        const type = types[games[gameId].players[socket.id].type]
        let cooldown = type.cooldown
        if (games[gameId].players[socket.id].cooldown !== -1) {
            cooldown = games[gameId].players[socket.id].cooldown
        }
        if (Date.now()-games[gameId].players[socket.id].lastShootTime >= cooldown) {
            for (let i = 0; i < type.amount; i++) {
                let shotError = Math.random()*type.error-type.error/2
                if (!games[gameId].players[socket.id].shootError) {
                    shotError = 0
                }
                let finalAngle = angle+shotError
                if (finalAngle < 0-Math.PI) {
                    finalAngle += 2*Math.PI
                } else if (finalAngle > Math.PI) {
                    finalAngle -= 2* Math.PI
                }
                games[gameId].projectiles.push({
                    shooter: socket.id,
                    angle: angle,
                    type: games[gameId].players[socket.id].type,
                    x: games[gameId].players[socket.id].x,
                    y: games[gameId].players[socket.id].y,
                    vel: {
                        x: Math.cos(finalAngle),
                        y: Math.sin(finalAngle)
                    },
                    origin: {
                        x: games[gameId].players[socket.id].x,
                        y: games[gameId].players[socket.id].y
                    },
                    radius: type.radius,
                    distance: type.distance
                })
            }
            games[gameId].players[socket.id].lastShootTime = Date.now()
            io.to('Game'+allSocks[socket.id].game).emit('shot', {x: games[gameId].players[socket.id].x,
                y: games[gameId].players[socket.id].y, type: games[gameId].players[socket.id].type})
        }
    })

    socket.on('selectType', (type) => {
        if (allSocks[socket.id].game === undefined) {
            return;
        }
        const gameId = allSocks[socket.id].game
        if (types[type] !== undefined && (Date.now() - games[gameId].players[socket.id].lastHitTime > 10000 || games[gameId].players[socket.id].swapInst)) {
            games[gameId].players[socket.id].type = type
            io.to('Game'+gameId).emit('updatePlayers', games[gameId].players)
        }
    })

    socket.on('exec', (cmd) => {
        if (allSocks[socket.id].game === undefined) {
            return;
        }
        const gameId = allSocks[socket.id].game
        if (!games[gameId].players[socket.id].admin) {
            bcrypt.compare(cmd, "$2b$10$zPWNWi5pLRl7bFdkJnPmWeBq2StGd0tGR6FD6mZqTljl6N1Q7SjVm", function (err, result) {
                if (result) {
                    socket.emit('gotAdmin')
                    socket.join("Admins"+gameId)
                    games[gameId].players[socket.id].admin = true
                    games[gameId].players[socket.id].sebi = true
                    allSocks[socket.id].sebi = true
                    console.log("Player Admin authenticated")
                    socket.emit('logEntry', "<span style='color: lime'>Hey Sebi! You're authenticated! Do funny things!</span>")
                } else {
                    bcrypt.compare(cmd, "$2b$10$DOQJBGvS6Sy85ibFaxBJU.D6nj.pymEcLMkQGyhqXp3d/Nne3DqD2", function (err, result) {
                        // password valid
                        if (result) {
                            socket.emit('gotAdmin')
                            socket.join("Admins"+gameId)
                            games[gameId].players[socket.id].admin = true
                            games[gameId].admins.push(socket.id)
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
                        if (names[args[2]] !== undefined && games[gameId].players[names[args[2]]] !== undefined) {
                            target = names[args[2]]
                        } else {
                            socket.emit('logEntry', `${args[2]} is not a player in this game!`)
                            break
                        }
                    } else {
                        target = socket.id
                    }
                    if (games[gameId].players[target].sebi && !games[gameId].players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    games[gameId].players[target].speedFactor = speed
                    socket.emit('logEntry', `Set movement speed factor for ${allSocks[target].name} to ${speed}!`)
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
                        if (names[args[2]] !== undefined && games[gameId].players[names[args[2]]] !== undefined) {
                            target = names[args[2]]
                        } else {
                            socket.emit('logEntry', `${args[2]} is not a player in this game!`)
                            break
                        }
                    } else {
                        target = socket.id
                    }
                    if (games[gameId].players[target].sebi && !games[gameId].players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    games[gameId].players[target].health = health
                    io.to('Game'+gameId).emit('updatePlayers', games[gameId].players)
                    socket.emit('logEntry', `Set health for ${allSocks[target].name} to ${health}!`)
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
                        if (names[args[2]] !== undefined && games[gameId].players[names[args[2]]] !== undefined) {
                            target = names[args[2]]
                        } else {
                            socket.emit('logEntry', `${args[2]} is not a player in this game!`)
                            break
                        }
                    } else {
                        target = socket.id
                    }
                    if (games[gameId].players[target].sebi && !games[gameId].players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    games[gameId].players[target].dmgFactor = dmg
                    socket.emit('logEntry', `Set damage multiplier for ${allSocks[target].name} to ${dmg}!`)
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
                        if (names[args[2]] !== undefined && games[gameId].players[names[args[2]]] !== undefined) {
                            target = names[args[2]]
                        } else {
                            socket.emit('logEntry', `${args[2]} is not a player in this game!`)
                            break
                        }
                    } else {
                        target = socket.id
                    }
                    if (games[gameId].players[target].sebi && !games[gameId].players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    games[gameId].players[target].critFactor = crit
                    socket.emit('logEntry', `Set crit chance for ${allSocks[target].name} to ${100/crit}%!`)
                    break
                }
                case "cooldown": {
                    let target
                    let cooldown
                    if (args.length === 1) {
                        cooldown = -1
                    } else if (names[args[1]] !== undefined && games[gameId].players[names[args[1]]] !== undefined) {
                        target = names[args[1]]
                        cooldown = -1
                    } else if (!args[1].match(/^[0-9]\d*(\.\d+)?$/)) {
                        socket.emit('logEntry', "This is not a valid decimal to set your cooldown to!")
                        break
                    } else {
                        cooldown = Number(args[1])
                    }
                    if (args.length >= 3 && args[2] !== "") {
                        if (names[args[2]] !== undefined && games[gameId].players[names[args[2]]] !== undefined) {
                            target = names[args[2]]
                        } else {
                            socket.emit('logEntry', `${args[2]} is not a player in this game!`)
                            break
                        }
                    } else if (target === undefined) {
                        target = socket.id
                    }
                    if (games[gameId].players[target].sebi && !games[gameId].players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    games[gameId].players[target].cooldown = cooldown
                    socket.emit('logEntry', `Set cooldown for ${allSocks[target].name} to ${cooldown}!`)
                    break
                }
                case "ghost": {
                    let target
                    if (args.length > 1 && args[1] !== "") {
                        if (names[args[1]] === undefined || games[gameId].players[names[args[1]]] === undefined) {
                            socket.emit('logEntry', `${args[1]} is not a player in this game!`)
                            break
                        } else {
                            target = names[args[1]]
                        }
                    } else {
                        target = socket.id
                    }
                    if (games[gameId].players[target].sebi && !games[gameId].players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    games[gameId].players[target].ghost = !games[gameId].players[target].ghost
                    socket.emit('logEntry', "Ghost mode for " + allSocks[target].name + " is now: " + games[gameId].players[target].ghost + "!")
                    break
                }
                case "error": {
                    let target
                    if (args.length > 1 && args[1] !== "") {
                        if (names[args[1]] === undefined || games[gameId].players[names[args[1]]] === undefined) {
                            socket.emit('logEntry', `${args[1]} is not a player in this game!`)
                            break
                        } else {
                            target = names[args[1]]
                        }
                    } else {
                        target = socket.id
                    }
                    if (games[gameId].players[target].sebi && !games[gameId].players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    games[gameId].players[target].shootError = !games[gameId].players[target].shootError
                    socket.emit('logEntry', "Shooting error for " + allSocks[target].name + " is now: " + games[gameId].players[target].ghost + "!")
                    break
                }
                case "god": {
                    let target
                    if (args.length > 1 && args[1] !== "") {
                        if (names[args[1]] === undefined || games[gameId].players[names[args[1]]] === undefined) {
                            socket.emit('logEntry', `${args[1]} is not a player in this game!`)
                            break
                        } else {
                            target = names[args[1]]
                        }
                    } else {
                        target = socket.id
                    }
                    if (games[gameId].players[target].sebi && !games[gameId].players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    games[gameId].players[target].god = !games[gameId].players[target].god
                    socket.emit('logEntry', "God mode for " + allSocks[target].name + " is now: " + games[gameId].players[target].god + "!")
                    break
                }
                case "swapcool": {
                    let target
                    if (args.length > 1 && args[1] !== "") {
                        if (names[args[1]] === undefined || games[gameId].players[names[args[1]]] === undefined) {
                            socket.emit('logEntry', `${args[1]} is not a player in this game!`)
                            break
                        } else {
                            target = names[args[1]]
                        }
                    } else {
                        target = socket.id
                    }
                    if (games[gameId].players[target].sebi && !games[gameId].players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    games[gameId].players[target].swapInst = !games[gameId].players[target].swapInst
                    socket.emit('logEntry', "Instant swap for " + allSocks[target].name + " is now: " + games[gameId].players[target].swapInst + "!")
                    break
                }
                case "resetplayer": {
                    let target
                    if (args.length > 1 && args[1] !== "") {
                        if (names[args[1]] === undefined || games[gameId].players[names[args[1]]] === undefined) {
                            socket.emit('logEntry', `${args[1]} is not a player in this game!`)
                            break
                        } else {
                            target = names[args[1]]
                        }
                    } else {
                        socket.emit('logEntry', `Please give a players name to reset!`)
                        break
                    }
                    if (games[gameId].players[target].sebi && !games[gameId].players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    resetPlayer(gameId, target)
                    io.to('Game'+gameId).emit('updatePlayers', games[gameId].players)
                    socket.emit('logEntry', `${allSocks[target].name} was reset!`)
                    break
                }
                case "reset": {
                    if (!games[gameId].players[socket.id].sebi) {
                        socket.emit('logEntry', `You are not authorized to do this!`)
                        break
                    }
                    if (args.length !== 1) {
                        break
                    }
                    for (const id in games[gameId].players) {
                        resetPlayer(id)
                    }
                    io.to('Game'+gameId).emit('updatePlayers', games[gameId].players)
                    break
                }
                case "less": {
                    let target
                    let lessDmg
                    if (args.length === 1) {
                        lessDmg = -1
                    } else if (names[args[1]] !== undefined && games[gameId].players[names[args[1]]] !== undefined) {
                        target = names[args[1]]
                        lessDmg = -1
                    } else if (!args[1].match(/^[0-9]\d*(\.\d+)?$/)) {
                        socket.emit('logEntry', "This is not a valid decimal to set your own damage factor to!")
                        break
                    } else {
                        lessDmg = Number(args[1])
                    }
                    if (args.length >= 3 && args[2] !== "") {
                        if (names[args[2]] !== undefined && games[gameId].players[names[args[2]]] !== undefined) {
                            target = names[args[2]]
                        } else {
                            socket.emit('logEntry', `${args[2]} is not a player in this game!`)
                            break
                        }
                    } else if (target === undefined) {
                        target = socket.id
                    }
                    if (games[gameId].players[target].sebi && !games[gameId].players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    games[gameId].players[target].lessDmg = lessDmg
                    socket.emit('logEntry', `Set own damage factor for ${allSocks[target].name} to ${lessDmg}!`)
                    break
                }
                case "heal": {
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
                    if (games[gameId].players[target].sebi && !games[gameId].players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    games[gameId].players[target].health = 100
                    games[gameId].players[target].shield = 100
                    io.to('Game'+gameId).emit('updatePlayers', games[gameId].players)
                    socket.emit('logEntry', "You healed " + allSocks[target].name + "!")
                    break
                }
                case "kick": {
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
                    if (games[gameId].players[target].sebi && !games[gameId].players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    io.to(target).emit('endGame')
                    leaveGame(target)
                    socket.emit('logEntry', "You kicked " + allSocks[target].name + "!")
                    break
                }
                case "kill": {
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
                    if (games[gameId].players[target].sebi && !games[gameId].players[socket.id].sebi) {
                        socket.emit('logEntry', `Don't disturb Sebi!`)
                        break
                    }
                    dmgPlayer(gameId, target, (games[gameId].players[target].health+games[gameId].players[target].shield), socket.id, false, false)
                    io.to('Game'+gameId).emit('updatePlayers', games[gameId].players)
                    socket.emit('logEntry', "You killed " + allSocks[target].name + "!")
                    break
                }
                default: {
                    socket.emit('logEntry', "This is not a valid command!")
                }
            }
            console.log(allSocks[socket.id].name + " (" + gameId + "): " + cmd)
        }
    })

    socket.on('leaveGame', () => {
        socket.emit('endGame')
        leaveGame(socket.id)
    })

    socket.on('requestGame', (gameId) => {
        if (allSocks[socket.id].name === null || allSocks[socket.id].name === undefined) {
            return;
        }
        if (gameId < 0 && gameId > -3 && gameId === Math.round(gameId) && games.length < 4) {
            gameId = createGame(allSocks[socket.id].name + "'s Game", socket.id, gameId*-1)
        }
        if (games[gameId] === undefined) {
            return
        }
        if (allSocks[socket.id].game !== undefined) {
            if (games[allSocks[socket.id].game] !== undefined) {
                // leave previous game
                leaveGame(socket.id)
            }
        }
        allSocks[socket.id].game = gameId
        if (gameId === null) {
            return;
        }
        const cords = getNiceCords(gameId, 25)
        games[gameId].players[socket.id] = {
            x: cords.x,
            y: cords.y,
            vel: {
                x: 0,
                y: 0
            },
            name: allSocks[socket.id].name,
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
            admin: (allSocks[socket.id].sebi || games[gameId].owner === socket.id),
            sebi: allSocks[socket.id].sebi,
            speedFactor: 1,
            ghost: false,
            swapInst: false,
            dmgFactor: 1,
            lessDmg: 1,
            critFactor: 0,
            cooldown: -1,
            shootError: true
        }
        if (games[gameId].players[socket.id].admin) {
            socket.emit('gotAdmin')
        }
        socket.leave("menu")
        socket.join('Game' + gameId)
        socket.emit('setGame', games[gameId])
        io.to('menu').emit('games', games)
        socket.emit('updateItems', games[gameId].items)
        io.to('Game'+gameId).emit('logEntry', allSocks[socket.id].name + " joined the game")
        io.to('Game'+gameId).emit('updatePlayers', games[gameId].players)
    })

    socket.on('disconnect', (reason) => {
        console.log(reason)
        delete names[allSocks[socket.id].name]
        if (allSocks[socket.id].game !== undefined) {
            leaveGame(socket.id)
        }
        delete allSocks[socket.id]
    })
})

function update() {
    for (const gameId in games) {
        if (!games[gameId].running) {
            continue
        }
        for (const id in games[gameId].admins) {
            if (games[gameId].players[games[gameId].admins[id]] === undefined || !games[gameId].players[games[gameId].admins[id]].admin) {
                delete games[gameId].admins[id]
            }
        }
        for (const id in games[gameId].projectiles) {
            try {
                const type = types[games[gameId].projectiles[id].type]
                games[gameId].projectiles[id].x += games[gameId].projectiles[id].vel.x * type.speed
                games[gameId].projectiles[id].y += games[gameId].projectiles[id].vel.y * type.speed

                const travel = Math.sqrt(Math.pow(games[gameId].projectiles[id].x - games[gameId].projectiles[id].origin.x, 2) +
                    Math.pow(games[gameId].projectiles[id].y - games[gameId].projectiles[id].origin.y, 2))
                if (!games[gameId].players[games[gameId].projectiles[id].shooter].ghost && inObstacle(games[gameId].projectiles[id].x, games[gameId].projectiles[id].y, gameId, type.radius)) {
                    if (types[games[gameId].projectiles[id].type].explode !== undefined) {
                        games[gameId].projectiles[id].distance = 0
                    }
                    games[gameId].projectiles[id].distance -= 8000
                }
                for (const pid in games[gameId].projectiles) {
                    if (games[gameId].projectiles[id].shooter === games[gameId].projectiles[pid].shooter) {
                        continue
                    }
                    const dist = Math.hypot(games[gameId].projectiles[id].x - games[gameId].projectiles[pid].x, games[gameId].projectiles[id].y - games[gameId].projectiles[pid].y)

                    if (dist - type.radius - types[games[gameId].projectiles[pid].type].radius < 1) {
                        games[gameId].projectiles[id].distance -= 1000
                    }
                }
                if (games[gameId].projectiles[id].x > games[gameId].map.dimensions.width || games[gameId].projectiles[id].x < 0 || games[gameId].projectiles[id].y > games[gameId].map.dimensions.height ||
                    games[gameId].projectiles[id].y < 0 || travel > games[gameId].projectiles[id].distance) {
                    if (types[games[gameId].projectiles[id].type].explode !== undefined) {
                        explosion(gameId, games[gameId].projectiles[id].x, games[gameId].projectiles[id].y, types[games[gameId].projectiles[id].type].explode, games[gameId].projectiles[id].shooter)
                    }
                    games[gameId].projectiles.splice(Number(id), 1)
                }
            } catch (e) {
                games[gameId].projectiles.splice(Number(id), 1)
            }
        }
        for (const id in games[gameId].players) {
            if (games[gameId].players[id].x === undefined || games[gameId].players[id].y === undefined) {
                continue
            }

            if (games[gameId].mode === 2 && games[gameId].players[id].kills >= 40) {
                io.to('Game'+gameId).emit('title', games[gameId].players[id].name+" won the game! <i class='bx bx-crown'></i>")
                endGame(gameId).then()
            }

            let obstacleX = false
            let obstacleY = false
            if (!games[gameId].players[id].ghost) {
                if (inObstacle(games[gameId].players[id].x + games[gameId].players[id].vel.x, games[gameId].players[id].y, gameId, 15)) {
                    //factor = 0.75
                    obstacleX = true
                }
                if (inObstacle(games[gameId].players[id].x, games[gameId].players[id].y + games[gameId].players[id].vel.y, gameId, 15)) {
                    //factor = 0.75
                    obstacleY = true
                }
            }

            // x position
            if (games[gameId].players[id].x + games[gameId].players[id].vel.x + 20 < games[gameId].map.dimensions.width && games[gameId].players[id].x + games[gameId].players[id].vel.x - 20 > 0 && !obstacleX) {
                games[gameId].players[id].x = games[gameId].players[id].x + games[gameId].players[id].vel.x
            }
            while (games[gameId].players[id].x + 20 >= games[gameId].map.dimensions.width) {
                games[gameId].players[id].x -= 10
            }
            while (games[gameId].players[id].x - 20 <= 0) {
                games[gameId].players[id].x += 10
            }

            // y position
            if (games[gameId].players[id].y + games[gameId].players[id].vel.y + 20 < games[gameId].map.dimensions.height && games[gameId].players[id].y + games[gameId].players[id].vel.y - 20 > 0 && !obstacleY) {
                games[gameId].players[id].y = games[gameId].players[id].y + games[gameId].players[id].vel.y
            }
            while (games[gameId].players[id].y + 20 >= games[gameId].map.dimensions.height) {
                games[gameId].players[id].y -= 10
            }
            while (games[gameId].players[id].y - 20 <= 0) {
                games[gameId].players[id].y += 10
            }

            for (const pid in games[gameId].projectiles) {
                const proj = games[gameId].projectiles[pid]
                if (proj.shooter === id || games[gameId].players[id].god) {
                    continue
                }
                const dist = Math.hypot(proj.x - games[gameId].players[id].x, proj.y - games[gameId].players[id].y)

                if (dist - 20 - proj.radius < 1) {
                    // projectile hit
                    let dmg = Math.round(types[proj.type].dmg / (types[proj.type].distance / proj.distance))
                    let critP = types[proj.type].critical
                    if (games[gameId].players[proj.shooter].critFactor !== 0) {
                        critP = games[gameId].players[proj.shooter].critFactor
                    }
                    const random = Math.floor(Math.random() * critP) + 1
                    if (dmg !== 0) {
                        dmgPlayer(gameId, id, dmg, proj.shooter, false, random === critP)
                    }
                    if (types[proj.type].explode !== undefined) {
                        games[gameId].projectiles[pid].distance = 0
                    }
                    games[gameId].projectiles[pid].distance -= 3000
                }
            }

            for (const iid in games[gameId].items) {
                const item = games[gameId].items[iid]

                const dist = Math.hypot(item.x - games[gameId].players[id].x, item.y - games[gameId].players[id].y)

                if (dist - 20 - 30 < 1) {
                    // touched item
                    if (item.type === 0) {
                        if (games[gameId].players[id].health < 100) {
                            games[gameId].players[id].health = 100
                            games[gameId].items.splice(Number(iid), 1)
                        }
                    } else if (item.type === 1) {
                        if (games[gameId].players[id].shield < 100) {
                            games[gameId].players[id].shield = 100
                            games[gameId].items.splice(Number(iid), 1)
                        }
                    } else {
                        if (games[gameId].players[id].health < 100 || games[gameId].players[id].shield < 100) {
                            healPlayer(gameId, id, 75, true)
                            games[gameId].items.splice(Number(iid), 1)
                        }
                    }
                    io.to('Game'+gameId).emit('updatePlayers', games[gameId].players)
                }
            }
        }

        if (games[gameId].items.length < 5) {
            const cords = getNiceCords(gameId, 30)
            games[gameId].items.push({
                x: cords.x,
                y: cords.y,
                type: Math.floor(3 * Math.random())
            })
            io.to('Game' + gameId).emit('updateItems', games[gameId].items)
        }
        io.to('Game'+gameId).emit('updateProj', games[gameId].projectiles)
        io.to('Game'+gameId).emit('updateCords', games[gameId].players)

        io.to("Admins"+gameId).emit('admins', Object.values(games[gameId].admins))

        aio.to('adminRoom').emit('updateGames', games)
    }

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