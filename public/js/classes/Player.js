class Player {
    constructor({id, x, y, color, name, type, health, level, kills, deaths, shield, lastHitTime, dmgDealt, angle}) {
        this.id = id
        this.x = x
        this.y = y
        this.radius = 20 * devicePxRat
        this.color = color
        this.name = name
        this.level = level
        this.kills = kills
        this.deaths = deaths
        this.type = type
        this.health = health
        this.shield = shield
        this.lastHitTime = lastHitTime
        this.dmgDealt = dmgDealt
        this.angle = angle
    }

    draw() {
        c.beginPath()
        c.strokeStyle = "grey"
        c.lineWidth = types[this.type].barrel.w*devicePxRat
        c.moveTo(this.x*devicePxRat-cam.x, this.y*devicePxRat-cam.y)
        c.lineTo(this.x*devicePxRat-cam.x+(Math.cos(this.angle)*types[this.type].barrel.l*devicePxRat), this.y*devicePxRat-cam.y+(Math.sin(this.angle)*types[this.type].barrel.l*devicePxRat))
        c.stroke()
        c.closePath()
        c.beginPath()
        c.arc(this.x*devicePxRat-cam.x, this.y*devicePxRat-cam.y, this.radius, -1 * Math.PI, Math.PI, false)
        c.fillStyle = this.color
        c.fill()
        c.closePath()
        if (this.id !== ego) {
            c.fillStyle = 'lightgray'
            if (admins.includes(this.id)) {
                c.fillStyle = 'gold'
            }
            c.textAlign = 'center'
            c.font = (24*devicePxRat)+'px Arial'
            c.fillText(this.name, this.x*devicePxRat-cam.x, (this.y)*devicePxRat+this.radius*2-cam.y)
            c.fillStyle = 'lightgray'
            c.font = (16*devicePxRat)+'px Arial'
            c.fillText(types[this.type].name, this.x*devicePxRat-cam.x, (this.y)*devicePxRat+this.radius*2+(18*devicePxRat)-cam.y)
            c.fillStyle = 'lime'
            c.fillText(this.health + " | " + this.shield, this.x*devicePxRat-cam.x, (this.y)*devicePxRat+this.radius*2+(24*devicePxRat)+(16*devicePxRat)-cam.y)
        }
    }
}