// shoot, shoot
addEventListener('mousedown', () => {
    mousedown = true
})
addEventListener('mousemove', (event) => {
    mouseAngle = Math.atan2(
        event.y - innerHeight / 2,
        event.x - innerWidth / 2
    )
    mousePos.x = event.x
    mousePos.y = event.y
})
addEventListener('mouseup', () => {
    mousedown = false
})

// movement pressed
addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === "a") {
        aPressed = true
    } else if (event.key.toLowerCase() === "d") {
        dPressed = true
    } else if (event.key.toLowerCase() === "w") {
        wPressed = true
    } else if (event.key.toLowerCase() === "s") {
        sPressed = true
    } else if (event.key === "1") {
        socket.emit('selectType', 1)
    } else if (event.key === "2") {
        socket.emit('selectType', 2)
    } else if (event.key === "3") {
        socket.emit('selectType', 3)
    }
})

// movement released
addEventListener('keyup', (event) => {
    if (event.key.toLowerCase() === "a") {
        aPressed = false
    } else if (event.key.toLowerCase() === "d") {
        dPressed = false
    } else if (event.key.toLowerCase() === "w") {
        wPressed = false
    } else if (event.key.toLowerCase() === "s") {
        sPressed = false
    }
})