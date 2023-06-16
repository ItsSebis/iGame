class Projectile {
    constructor({x, y, radius, color}) {
        this.x = x
        this.y = y
        this.radius = radius*devicePxRat
        this.color = color
    }

    draw() {
        c.beginPath()
        c.fillStyle = this.color
        c.arc(this.x*devicePxRat-cam.x, this.y*devicePxRat-cam.y, this.radius, 0, Math.PI * 2, false)
        c.fill()
    }
}