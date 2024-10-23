const drawFlame = (ctx, canvas, x, h) => {
    let height = 400 / 255 * h
    const gradient = ctx.createRadialGradient(x,800, height,x,800,height / 5);
    gradient.addColorStop(0, "rgba(0, 0, 255, 0.8)");
    gradient.addColorStop(1, "white");

    ctx.shadowColor = 'yellow';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(x, canvas.height - height, 10, height, 0, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
}

const rotateLine = (ctx, canvas, angle, x0, x1, y1) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x1 - x0 * Math.cos(angle * Math.PI / 180),
        y1 - x0 * Math.sin(angle * Math.PI / 180) * 1.9)
    ctx.stroke()
}


class DynamicAudio {
    analyser
    ctx = {}
    canvas = {}

    constructor(audio, audioCtx, audioSource) {
        document.querySelectorAll(".canvas").forEach(c => {
            this.canvas[c.id] = c
            this.canvas[c.id].width = window.innerWidth / 2;
            this.canvas[c.id].height = window.innerHeight;
            this.ctx[c.id] = c.getContext("2d");
        })

        this.analyser = audioCtx.createAnalyser();
        audioSource.connect(this.analyser);
        this.analyser.connect(audioCtx.destination);
    }

    setup(fftSize) {
        this.analyser.fftSize = fftSize;
        let bufferLength = this.analyser.frequencyBinCount;
        let dataArray = new Uint8Array(bufferLength);
        let barWidth = this.canvas["canvas1"].width / bufferLength;

        return [dataArray, barWidth, bufferLength]
    }

    subMove() {
        let [dataArray] = this.setup(256)
        let dynAudio = this
        const time = 50
        const animate = () => {
            dynAudio.analyser.getByteFrequencyData(dataArray);
            if (dataArray[0] > 254) {
                const diff = 12 / time
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
                            e.style.width = `${60 - diff * i}px`
                            e.style.height = `${60 - diff * i}px`
                        })
                    }, i)
                }

                setTimeout(() => {
                    requestAnimationFrame(animate)
                }, time * 2)
            } else
                requestAnimationFrame(animate);
        }
        animate()
    }

    gas(canvas) {
        let [dataArray, barWidth, bufferLength] = this.setup(64)
        let dynAudio = this
        const animate = () => {
            let x = 10;
            dynAudio.ctx[canvas].clearRect(0, 0, dynAudio.canvas[canvas].width, dynAudio.canvas[canvas].height);
            dynAudio.analyser.getByteFrequencyData(dataArray);
            for (let i = 0; i < bufferLength; i++) {
                let data = canvas === 'canvas1' ? dataArray[i] : dataArray[bufferLength - i - 1]
                drawFlame(this.ctx[canvas], this.canvas[canvas], x, data)
                x += barWidth;
            }

            requestAnimationFrame(animate);
        }
        animate()
    }

    waveform(canv) {
        let [x0, y0, x1] = canv === 'canvas1' ? [70, 200, 413] : [285, 200, 413]
        let [dataArray, barWidth, bufferLength] = this.setup(1024)
        let dynAudio = this
        const ctx = this.ctx[canv]
        const canvas = this.canvas[canv]

        function animateWaveform() {
            ctx.clearRect(0, 0, canvas.width,canvas.height);
            dynAudio.analyser.getByteTimeDomainData(dataArray);

            ctx.strokeStyle = "white"
            ctx.beginPath()
            const sliceWidth = x1 / bufferLength;
            let x = x0
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 256
                let y = v * y0 * 3 + y0 * 0.5
                if (i === 0)
                    ctx.moveTo(x, y0 * 2)
                else
                    ctx.lineTo(x, y)
                x += sliceWidth
            }
            ctx.lineTo(x1 + x0, y0 * 2);
            ctx.stroke();
            requestAnimationFrame(animateWaveform)
        }
        animateWaveform()
    }

    compressor(canv, sensitivity) {
        let [x1, y1] = canv === "canvas1" ? [280, 640] : [493, 640]
        let [dataArray, barWidth, bufferLength] = this.setup(128)
        let dynAudio = this
        let angle = 35
        const ctx = this.ctx[canv]
        const canvas = this.canvas[canv]
        const [x0, delay] = [160, 4]
        const animate = () => {
            dynAudio.analyser.getByteFrequencyData(dataArray);
            ctx.strokeStyle = "lime"
            ctx.lineWidth = "5"
            let st_angle = 35
                let calc_angle = (dataArray[31] - 130) * (110 * sensitivity) / 650 + 35
                for (let i = angle; i < calc_angle; i++) {
                    setTimeout(() => rotateLine(ctx, canvas, i, x0, x1, y1), (i - st_angle) * delay)
                    angle = i
                }
                setTimeout(() => {
                    st_angle = angle
                    for (let i = angle; i >= 35; i--) {
                        setTimeout(() => rotateLine(ctx, canvas, i, x0, x1, y1), (st_angle - angle) * delay)
                        angle = i
                    }
                    setTimeout(() => requestAnimationFrame(animate), (st_angle - 35) * delay + 100)
                }, 56 * delay)
        }
        animate()
    }
}

let [dynAudio1, dynAudio2, dynAudio3] = [null, null, null]

document.getElementById('button').addEventListener('click', () => {
    let audio = document.getElementById('audio')
    audio.play()
    const audioCtx = new AudioContext();
    let audioSource = audioCtx.createMediaElementSource(audio);
    dynAudio1 = new DynamicAudio(audio, audioCtx, audioSource)
    dynAudio2 = new DynamicAudio(audio, audioCtx, audioSource)
    dynAudio3 = new DynamicAudio(audio, audioCtx, audioSource)
})
document.getElementById('audio').addEventListener('play', () => {
    dynAudio1.subMove()
    dynAudio2.gas("canvas1")
    dynAudio3.gas("canvas2")
    // dynAudio2.waveform("canvas1")
    // dynAudio2.waveform("canvas2")
})