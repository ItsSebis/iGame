// shoot, shoot
addEventListener('click', (event) => {
    const angle = Math.atan2(
        event.clientY - canvas.height / 2,
        event.clientX - canvas.width / 2
    )

    console.log("Shoot!")
    socket.emit('shoot', angle)
    /*projectiles.push(
        new Projectile(canvas.width / 2, canvas.height / 2, 5, 'white', velocity)
    )*/
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

    const movement = {
        name: ign,
        left: aPressed,
        right: dPressed,
        up: wPressed,
        down: sPressed
    }
    socket.emit('movement', movement)
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

    const movement = {
        name: ign,
        left: aPressed,
        right: dPressed,
        up: wPressed,
        down: sPressed
    }
    socket.emit('movement', movement)
})