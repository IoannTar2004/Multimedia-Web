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
        const canvas = document.querySelector('canvas')
        this.canvas = canvas
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
        this.ctx = canvas.getContext("2d")
        DynamicAudio.audio = audio
        this.analyser = audioCtx.createAnalyser()
        audioSource.connect(this.analyser)
        this.analyser.connect(audioCtx.destination)
    }

    setPosition(position) {
        this.position = position
        this.borders = position === 'left' ? {
            x: 0,
            x1: this.canvas.width / 2
        } : {
            x: this.canvas.width / 2,
            x1: this.canvas.width
        }
    }

    setup(fftSize) {
        this.analyser.fftSize = fftSize;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        this.barWidth = this.canvas.width / (this.bufferLength * 2);
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
                const diff = 10 / time
                const subs = document.querySelectorAll('.subs-item')
                for (let i = 0; i < time; i++) {
                    setTimeout(() => {
                        subs.forEach(e => {
                            e.style.width = `${48 + diff * i}px`
                            e.style.height = `${48 + diff * i}px`
                        })
                    }, i)
                }
                for (let i = 0; i < time; i++) {
                    setTimeout(() => {
                        subs.forEach(e => {
                            e.style.width = `${58 - diff * i}px`
                            e.style.height = `${58 - diff * i}px`
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
        let height = 400 / 255 * h
        const gradient = this.ctx.createRadialGradient(x,900, height, x,950,height / 5);
        gradient.addColorStop(0, "rgba(0, 0, 255, 0.8)");
        gradient.addColorStop(0.7, "white");

        this.ctx.beginPath();
        this.canvas_setup("1", "white", 'yellow', 10)
        this.ctx.ellipse(x, this.canvas.height - height, 10, height, 0, 0, 2 * Math.PI);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }

    gas() {
        this.ctx.fillStyle = "white"
        this.setup(64)
        const animate = () => {
            let x = this.position === 'left' ? 10 : 770
            this.clearCanvas()
            this.analyser.getByteFrequencyData(this.dataArray)
            for (let i = 0; i < this.bufferLength; i++) {
                let data = this.position === 'left' ? this.dataArray[i] : this.dataArray[this.bufferLength - i - 1]
                this.drawFlame(x, data / 1.8)
                x += this.barWidth;
            }
            this.animation = requestAnimationFrame(animate);
        }
        animate()
    }

    waveform() {
        const x1 = 413
        let [x0, y0] = this.position === "left" ? [70, 573] : [1050, 573]
        this.setup(1024)
        const ctx = this.ctx

        const animate = () => {
            this.clearCanvas()
            this.analyser.getByteTimeDomainData(this.dataArray)

            ctx.beginPath()
            this.canvas_setup("1", "white", null, 0)
            const sliceWidth = x1 / this.bufferLength;
            let x = x0
            for (let i = 0; i < this.bufferLength; i++) {
                let y = 2 * this.dataArray[i] + 317
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
        this.canvas_setup("5", "lime", null, 0)
        this.ctx.moveTo(x1, y1)
        this.ctx.lineTo(x1 - x0 * Math.cos(angle * Math.PI / 180),
            y1 - x0 * Math.sin(angle * Math.PI / 180))
        this.ctx.stroke()
    }

    compressor(sensitivity) {
        let [x1, y1] = this.position === "left" ? [280, 687] : [1258, 687]
        this.setup(128)
        const nullAngle = 33
        const [x0, delay] = [155, 5]
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
        this.ctx.clearRect(this.borders.x, 0, this.borders.x1, this.canvas.height)
    }
}