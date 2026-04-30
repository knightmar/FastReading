const {invoke} = window.__TAURI__.core;

let textEl;
let playBtn;
let current_wpm = 300;
let text_speed = 200;
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
            currentIndex = 0;
            updatePlayButtonLabel();
            break;
        }
    }
}

function updateAllSpeeds(source) {
    const text_speed_slider = document.querySelector("#text-speed");
    const wpm_input = document.querySelector("#wpm-input");

    if (source === 'slider') {
        const val = parseFloat(text_speed_slider.value);
        current_wpm = Math.round(50 * Math.pow(1.4, val));
        wpm_input.value = current_wpm;
    }
    else if (source === 'input') {
        current_wpm = parseInt(wpm_input.value) || 10;
        const sliderVal = Math.log(current_wpm / 50) / Math.log(1.4);
        text_speed_slider.value = Math.max(0, Math.min(11, sliderVal));
    }

    text_speed = (60000 * word_chunks) / current_wpm;
}

function updatePlayButtonLabel() {
    if (isPlaying) {
        playBtn.textContent = "Pause (Space)";
        playBtn.classList.remove("bg-green-600", "bg-gray-600");
        playBtn.classList.add("bg-yellow-600");
    } else {
        playBtn.textContent = currentIndex > 0 ? "Resume (Space)" : "Play (Space)";
        playBtn.classList.remove("bg-yellow-600", "bg-gray-600");
        playBtn.classList.add("bg-green-600");
    }
}

function togglePlay() {
    if (split_text.length === 0) return;
    isPlaying = !isPlaying;
    updatePlayButtonLabel();
    if (isPlaying) main_loop();
}

window.addEventListener("DOMContentLoaded", () => {
    textEl = document.querySelector("#text");
    playBtn = document.querySelector("#play_btn");
    const text_speed_slider = document.querySelector("#text-speed");
    const wpm_input = document.querySelector("#wpm-input");
    const text_size_slider = document.querySelector("#text-size");
    const text_size_input = document.querySelector("#text-size-input");
    const word_count_input = document.querySelector("#word-count");

    text_speed_slider.addEventListener("input", () => updateAllSpeeds('slider'));
    wpm_input.addEventListener("change", () => updateAllSpeeds('input'));

    word_count_input.addEventListener("input", (e) => {
        word_chunks = parseInt(e.target.value, 10) || 1;
        updateAllSpeeds('input');
    });

    const updateSize = (val) => {
        textEl.style.fontSize = `${val}px`;
        text_size_slider.value = val;
        text_size_input.value = val;
    };

    text_size_slider.addEventListener("input", (e) => updateSize(e.target.value));
    text_size_input.addEventListener("input", (e) => updateSize(e.target.value));

    document.querySelector("#load_text_btn").addEventListener("click", (e) => {
        e.preventDefault();
        load_text().then(() => textEl.textContent = "Texte chargé");
        e.currentTarget.blur();
    });

    playBtn.addEventListener("click", (e) => {
        e.preventDefault();
        togglePlay();
        e.currentTarget.blur();
    });

    document.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            e.preventDefault();
            togglePlay();
        }
    });

    text_speed_slider.value = 5;
    updateAllSpeeds('slider');
    updateSize(31);
});