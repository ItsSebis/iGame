// shoot, shoot
addEventListener('mousedown', () => {
    if (!term) {
        mousedown = true
    }
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
    if (!term) {
        mousedown = false
    }
})

// movement pressed
addEventListener('keydown', (event) => {
    if (!term) {
        switch (event.key.toLowerCase()) {
            case "a": {
                aPressed = true
                break
            }
            case "d": {
                dPressed = true
                break
            }
            case "w": {
                wPressed = true
                break
            }
            case "s": {
                sPressed = true
                break
            }
        }
        if (event.key.match(/^[1-9]+$/) && types[Number(event.key)] !== undefined) {
            socket.emit('selectType', Number(event.key))
        } else if (event.key.toLowerCase() === "e") {
            mousedown = !mousedown
        }
    }

    if (event.altKey && event.ctrlKey && event.key.toLowerCase() === "t") {
        term = !term
    } else if (term && event.key === "Escape") {
        term = false
    } else if (term && event.key === "Enter") {
        document.querySelector("#termForm").submit()
    } else if (term && event.key === "ArrowUp") {
        if (curCmd !== 0) {
            curCmd--
            document.querySelector("#term").value = recmd[curCmd]
        }
    } else if (term && event.key === "ArrowDown") {
        if (curCmd < recmd.length-1) {
            curCmd++
            document.querySelector("#term").value = recmd[curCmd]
        } else if (curCmd === recmd.length-1) {
            curCmd++
            document.querySelector("#term").value = ""
        }
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