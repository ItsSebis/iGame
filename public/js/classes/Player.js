class Player {
    constructor({x, y, color, name, type, health, level, kills, deaths, shield, lastHitTime}) {
        this.x = x
        this.y = y
        this.radius = 20 * window.devicePixelRatio
        this.color = color
        this.name = name
        this.level = level
        this.kills = kills
        this.deaths = deaths
        this.type = type
        this.health = health
        this.shield = shield
        this.lastHitTime = lastHitTime
    }

    draw() {
        c.beginPath()
        c.arc(this.x*devicePxRat-cam.x, this.y*devicePxRat-cam.y, this.radius, -1 * Math.PI, Math.PI, false)
        c.fillStyle = this.color
        c.fill()
        c.closePath()
        if (this.color !== 'blue') {
            c.fillStyle = 'lightgray'
            c.textAlign = 'center'
            c.font = (24*devicePxRat)+'px Arial'
            c.fillText(this.name, this.x*devicePxRat-cam.x, (this.y)*devicePxRat+this.radius*2-cam.y)
            c.font = (16*devicePxRat)+'px Arial'
            c.fillText(typeNames[this.type], this.x*devicePxRat-cam.x, (this.y)*devicePxRat+this.radius*2+(18*devicePxRat)-cam.y)
            c.fillStyle = 'lime'
            c.fillText(this.health + " | " + this.shield, this.x*devicePxRat-cam.x, (this.y)*devicePxRat+this.radius*2+(24*devicePxRat)+(16*devicePxRat)-cam.y)
        }
    }
}