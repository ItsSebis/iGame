class Player {
    constructor({x, y, color, name, velocity={x:0,y:0}}) {
        this.x = x
        this.y = y
        this.radius = 20 * window.devicePixelRatio
        this.color = color
        this.name = name
        this.velocity = velocity
    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
        c.closePath()
        c.beginPath()
        c.fillStyle = 'lightgray'
        c.textAlign = 'center'
        c.font = '24px Arial'
        c.fillText(this.name, this.x, this.y+this.radius*2, this.radius*4)
    }

    /*
    if (this.x + this.velocity.x + this.radius < canvas.width && this.x + this.velocity.x - this.radius > 0) {
        this.x = this.x + this.velocity.x
    }
    if (this.y + this.velocity.y + this.radius < canvas.height && this.y + this.velocity.y - this.radius > 0) {
        this.y = this.y + this.velocity.y
    }
    */
}