let audio = document.getElementById('audio')

let audioCtx = null;
let audioSource = null;
let dynAudio1 = null
let dynAudio2 = null
let dynAudio3 = null
let start_ctx = false

let songList = [
    {
        name: 'Victim',
        author: 'Front Line Assembly',
        audio: 'front-line-assembly-victim.mp3',
        cover: 'front-line-assembly-victim.jpg',
    },
    {
        name: 'Brain Reconstruction',
        author: 'SynthElectronix',
        audio: 'Brain_Reconstruction.mp3',
        cover: 'Brain_Reconstruction.jpg',
    },
    {
        name: 'Naked In The Rain',
        author: 'Red Hot Chili Peppers',
        audio: 'rhcp-Naked_In_The_Rain.mp3',
        cover: 'BSSM.jpg',
    }
]
let songPos = 0

const getSongTime = () => `${Math.floor(audio.duration / 60)}:${Math.floor(audio.duration % 60).toString().padStart(2, '0')}`
audio.addEventListener('loadedmetadata', () => {
    document.getElementById("duration").innerText = getSongTime()
})

const play = () => {
    audio.volume = 0.5
    audio.play()
}

const prev = () => {
    if (audio.currentTime < 4) {
        songPos = songPos === 0 ? songList.length - 1 : songPos - 1
        const song = songList[songPos]
        document.getElementById("song-name").innerText = song.name
        document.getElementById("author").innerText = song.author
        document.getElementById("covers-item").src = `images/covers/${song.cover}`
        audio.src = `audio/${song.audio}`
        if (document.getElementById('play-pause').classList.contains('pause'))
            play()
    }
    else
        audio.currentTime = 0
}

const next = () => {
    songPos = songList.length - songPos === 1 ? 0 : songPos + 1
    const song = songList[songPos]
    audio.src = `audio/${song.audio}`
    document.getElementById("covers-item").src = `images/covers/${song.cover}`
    document.getElementById("song-name").innerText = song.name
    document.getElementById("author").innerText = song.author
    if (document.getElementById('play-pause').classList.contains('pause'))
        play()
}

audio.addEventListener('timeupdate',(e) => {
    const {duration, currentTime} = e.srcElement
    let progress = (currentTime / duration) * 100
    document.getElementById("current-bar").style.width = `${progress}%`
    document.getElementById("current-time").innerText =
        `${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}`

    if (duration === currentTime)
        next()
})

document.getElementById("time").addEventListener('click', e => {
    const clickPosition = e.offsetX;
    const blockWidth = e.target.offsetWidth;
    audio.currentTime = (clickPosition / blockWidth) * audio.duration
})

document.getElementById("time").addEventListener('mousemove', e => {
    const position = e.offsetX;
    const blockWidth = e.target.offsetWidth;
    document.getElementById("hover-bar").style.width = `${(position / blockWidth) * 100}%`
})

document.getElementById("time").addEventListener('mouseleave', e => {
    document.getElementById("hover-bar").style.width = '0'
})

const start = () => {
    start_ctx = true
    audioCtx = new AudioContext();
    audioSource = audioCtx.createMediaElementSource(audio);
    dynAudio1 = new DynamicAudio(audio, audioCtx, audioSource)
    dynAudio2 = new DynamicAudio(audio, audioCtx, audioSource)
    dynAudio3 = new DynamicAudio(audio, audioCtx, audioSource)

    dynAudio2.setPosition("left")
    dynAudio3.setPosition("right")

    dynAudio2.waveform()
    dynAudio3.waveform()
    document.getElementById('context-selection').style.display = "flex"
}

document.querySelector('.play').addEventListener('click', () => {
    if (!start_ctx)
        start()
    audio.volume = 0.5
    let playButton = document.getElementById("play-pause")
    if (!playButton.classList.contains('pause')) {
        document.getElementById("rectangle").style.border = "4px solid lime"
        play()
        playButton.classList.add('pause')
        playButton.classList.remove('play')
    } else {
        document.getElementById("rectangle").style.border = "4px solid orangered"
        playButton.classList.remove('pause')
        playButton.classList.add('play')
        audio.pause()
    }

    dynAudio1.subMove()
})

document.querySelector('#next').addEventListener('click', next)
document.querySelector('#prev').addEventListener('click', prev)

document.querySelectorAll('.ctx-select-button')
    .forEach(e => e.addEventListener('click', (e) => {
        const el = e.target
        const clsList = el.parentElement.parentElement.classList
    if (clsList.contains("right") || clsList.contains("left")) {
        clsList.contains("right") ? dynAudio3.cancelAnimation() : dynAudio2.cancelAnimation()

        document.querySelectorAll('.ctx-select-button').forEach(e => {
            if (el.id[1] === e.id[1])
                e.classList.remove('ctx-sb-clicked')
        })
        el.classList.add('ctx-sb-clicked')

        const tv = (side, type) => {
            const ctx = side === 'left' ? dynAudio2 : dynAudio3
            ctx.clearCanvas()
            const tv = side === 'left' ? 'analyzer1' : 'analyzer2'
            const analyzer = type === 'oscillograph' ? 'screen' : 'compressor'
            const media = document.getElementById(`${tv}`)

            if (media.style.display === 'none')
                media.style.display = "flex"
            media.innerHTML = `<img src="images/project/${analyzer}.jpeg" class="tv">`
            type === 'oscillograph' ? ctx.waveform() : ctx.compressor(13)
        }

        const gasOn = (side) => {
            const ctx = side === 'left' ? dynAudio2 : dynAudio3
            const tv = side === 'left' ? '#analyzer1' : '#analyzer2'
            document.querySelector(`${tv}`).style.display = "none"
            ctx.gas()
        }

        const actions = {
            'OL': () => tv('left', 'oscillograph'),
            'CL': () => tv('left', 'compressor'),
            'GL': () => gasOn('left'),
            'OR': () => tv('right', 'oscillograph'),
            'CR': () => tv('right', 'compressor'),
            'GR': () => gasOn('right')
        };
        actions[el.id]()
    }
}))