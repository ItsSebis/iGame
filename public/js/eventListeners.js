// shoot, shoot
addEventListener('mousedown', (event) => {
    mousedown = true
})
addEventListener('mousemove', (event) => {
    mouseAngle = Math.atan2(
        event.clientY - canvas.height * devicePxRat / 2,
        event.clientX - canvas.width * devicePxRat / 2
    )
})
addEventListener('mouseup', (event) => {
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