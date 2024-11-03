class DynamicAudio {
    static audio
    analyser
    ctx
    canvas
    bufferLength
    dataArray
    barWidth
    position
    borders
    flag = true
    animation

    constructor(audio, audioCtx, audioSource) {
        DynamicAudio.audio = audio
        this.analyser = audioCtx.createAnalyser()
        audioSource.connect(this.analyser)
        this.analyser.connect(audioCtx.destination)
    }

    setCanvas(canvas) {
        this.canvas = canvas
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
        this.ctx = canvas.getContext("2d")
    }

    setup(fftSize) {
        this.analyser.fftSize = fftSize;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        this.barWidth = this.canvas?.width / (this.bufferLength * 2);
    }

    canvas_setup(lineWidth, strokeStyle, shadowColor, shadowBlur) {
        this.ctx.lineWidth = lineWidth
        this.ctx.strokeStyle = strokeStyle
        this.ctx.shadowColor = shadowColor
        this.ctx.shadowBlur = shadowBlur
    }

    subMove() {
        this.setup(256)
        let dynAudio = this
        const time = 30
        const animate = () => {
            dynAudio.analyser.getByteFrequencyData(this.dataArray);
            if (this.dataArray[0] > 230) {
                const diff = 2 / time
                const subs = document.querySelectorAll('.subs-item')
                for (let i = 0; i < time; i++) {
                    setTimeout(() => {
                        subs.forEach(e => {
                            e.style.width = `${28 + diff * i}%`
                            e.style.height = `${14.5 + diff * i}%`
                        })
                    }, i)
                }
                for (let i = 0; i < time; i++) {
                    setTimeout(() => {
                        subs.forEach(e => {
                            e.style.width = `${30 - diff * i}%`
                            e.style.height = `${16.5 - diff * i}%`
                        })
                    }, 2 * time + i)
                }

                setTimeout(() => {
                    this.animation = requestAnimationFrame(animate);
                }, 3 * time)
            } else
                this.animation = requestAnimationFrame(animate);
        }
        animate()
    }

    drawFlame = (x, h) => {
        let height = this.canvas.height / 255 * h
        const gradient = this.ctx.createRadialGradient(x,900, height, x,950,height / 5);
        gradient.addColorStop(0, "rgba(0, 0, 255, 0.8)");
        gradient.addColorStop(0.7, "white");

        this.ctx.beginPath();
        this.canvas_setup("1", "white", 'yellow', 10)
        this.ctx.ellipse(x, this.canvas.height - height, 24, height, 0, 0, 2 * Math.PI);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }

    gas() {
        this.ctx.fillStyle = "white"
        this.setup(64)
        const animate = () => {
            let x = this.canvas.id === 'left-canvas' ? 15 : this.canvas.width - 15
            const x1 = this.canvas.width / 28
            this.clearCanvas()
            this.analyser.getByteFrequencyData(this.dataArray)
            for (let i = 0; i < this.bufferLength; i++) {
                let data = this.dataArray[i]
                this.drawFlame(x, data / 2)
                this.canvas.id === 'left-canvas' ? x += x1 : x -= x1;
            }
            this.animation = requestAnimationFrame(animate);
        }
        animate()
    }

    oscillograph() {
        const x1 = this.canvas.width
        let x0 = 0, y0 = this.canvas.height / 2
        this.setup(256)
        const ctx = this.ctx

        const animate = () => {
            this.clearCanvas()
            this.analyser.getByteTimeDomainData(this.dataArray)

            ctx.beginPath()
            this.canvas_setup("5", "white", null, 0)
            const sliceWidth = x1 / this.bufferLength;
            let x = x0
            for (let i = 0; i < this.bufferLength; i++) {
                let y = 0.03204 * Math.pow(this.dataArray[i], 2) - 1.4454 * this.dataArray[i] + 78
                if (i === 0)
                    ctx.moveTo(x, y0)
                else
                    ctx.lineTo(x, y)
                x += sliceWidth
            }
            ctx.lineTo(x1 + x0, y0);
            ctx.stroke();

            this.animation = requestAnimationFrame(animate);
        }
        animate()
    }

    rotateLine(angle, x0, x1, y1) {
        this.clearCanvas()
        this.ctx.beginPath()
        this.canvas_setup("12", "lime", null, 0)
        this.ctx.moveTo(x1, y1)
        this.ctx.lineTo(x1 - x0 * Math.cos(angle * Math.PI / 180),
            y1 - x0 * Math.sin(angle * Math.PI / 180))
        this.ctx.stroke()
    }

    compressor(sensitivity) {
        let x1 = this.canvas.width / 2, y1 = this.canvas.height
        this.setup(128)
        const nullAngle = 34
        const x0 = 600, delay = 5
        const animate = () => {
            this.analyser.getByteFrequencyData(this.dataArray)
            let calc_angle = (this.dataArray[31] - 110) * (110 * sensitivity) / 750 + nullAngle
            if (this.dataArray[31] > 110 && this.flag === true && !DynamicAudio.audio.paused) {
                this.flag = false
                for (let i = nullAngle; i < calc_angle; i++) {
                    setTimeout(() => this.rotateLine(i, x0, x1, y1), i * delay)
                }

                for (let i = calc_angle; i >= nullAngle; i--) {
                    setTimeout(() => {
                        this.rotateLine(i, x0, x1, y1)
                        if (Math.abs(nullAngle - i) <= 1) {
                            this.flag = true
                            setTimeout(() => requestAnimationFrame(animate), 100)
                        }
                    },delay * (calc_angle) + (calc_angle - i - 1) * delay)
                }
            } else
                requestAnimationFrame(animate)
        }
        animate()
    }

    cancelAnimation() {
        cancelAnimationFrame(this?.animation)
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
}