const {invoke} = window.__TAURI__.core;

let textEl;
let playBtn;
let text_speed = 1.0;
let word_chunks = 1;
let split_text = [];
let currentIndex = 0;
let isPlaying = false;

async function load_text() {
    const rawText = await invoke("load_text");
    split_text = rawText.match(/\S+/g) || [];
    currentIndex = 0;
    isPlaying = false;
    updatePlayButtonLabel();
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main_loop() {
    while (isPlaying && currentIndex < split_text.length) {
        let end_slice_i = Math.min(currentIndex + word_chunks, split_text.length);

        textEl.textContent = split_text.slice(currentIndex, end_slice_i).join(" ");

        await sleep(text_speed);

        currentIndex += word_chunks;

        if (currentIndex >= split_text.length) {
            isPlaying = false;
            currentIndex = 0; // On revient au début pour la prochaine fois
            updatePlayButtonLabel();
            console.log("Finished displaying the text");
            break;
        }
    }
}

function updatePlayButtonLabel() {
    if (isPlaying) {
        playBtn.textContent = "Pause";
        playBtn.classList.replace("bg-green-600", "bg-yellow-600");
    } else {
        if (currentIndex > 0) {
            playBtn.textContent = "Resume";
            playBtn.classList.replace("bg-yellow-600", "bg-green-600");
        } else {
            playBtn.textContent = "Play";
            playBtn.classList.replace("bg-yellow-600", "bg-green-600");
        }
    }
}

function togglePlay() {
    if (split_text.length === 0) return;

    isPlaying = !isPlaying;
    updatePlayButtonLabel();

    if (isPlaying) {
        main_loop();
    }
}


window.addEventListener("DOMContentLoaded", () => {
    textEl = document.querySelector("#text");
    playBtn = document.querySelector("#play_btn");

    const text_speed_slider = document.querySelector("#text-speed");
    const wpm_input = document.querySelector("#wpm-input");
    const text_size_slider = document.querySelector("#text-size");
    const text_size_input = document.querySelector("#text-size-input");
    const word_count_input = document.querySelector("#word-count");

    const updateSpeedFromSlider = () => {
        const val = parseFloat(text_speed_slider.value);
        text_speed = 600 * Math.pow(0.8, val);
        const wpm = Math.round(60000 / text_speed);
        wpm_input.value = wpm;
    };

    const updateSpeedFromWPM = () => {
        let wpm = parseInt(wpm_input.value);
        if (wpm < 1) wpm = 1;

        text_speed = 60000 / wpm;

        // calc log scale for the speed (line is too hard to control)
        const val = Math.log(100 / wpm) / Math.log(0.8);
        text_speed_slider.value = Math.max(0, Math.min(10, val));
    };

    const updateSize = (val) => {
        textEl.style.fontSize = `${val}px`;
        text_size_slider.value = val;
        text_size_input.value = val;
    };

    // events
    text_speed_slider.addEventListener("input", updateSpeedFromSlider);
    wpm_input.addEventListener("change", updateSpeedFromWPM);

    text_size_slider.addEventListener("input", (e) => updateSize(e.target.value));
    text_size_input.addEventListener("input", (e) => updateSize(e.target.value));

    word_count_input.addEventListener("input", (e) => {
        word_chunks = parseInt(e.target.value, 10) || 1;
    });

    document.querySelector("#load_text_btn").addEventListener("click", (e) => {
        e.preventDefault();
        load_text().then(() => console.log("Text loaded"));
    });

    document.querySelector("#play_btn").addEventListener("click", (e) => {
        e.preventDefault();
        main_loop().then(() => console.log("Finished"));
    });

    text_speed_slider.value = 5;
    updateSpeedFromSlider();
    updateSize(31);
});