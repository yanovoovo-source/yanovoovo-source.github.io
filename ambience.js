/* Small, self-contained sound and winter interactions shared by all pages. */
(() => {
    const read = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
    const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
    const music = document.createElement('details');
    music.className = 'music-box';
    music.innerHTML = `<summary><span aria-hidden="true">♪</span> 听风 · 琴匣</summary>
        <div class="music-content"><p class="music-caption">一曲入江湖</p>
        <label class="music-label" for="musicTrack">选一支曲</label>
        <select id="musicTrack"><option>渡口听风</option><option>夜行长街</option><option>雪落孤舟</option></select>
        <p class="music-note">五声音阶 · 合成弦音</p>
        <div class="music-actions"><button id="musicPlay" type="button" aria-pressed="false">听曲</button><button id="musicNext" type="button" aria-label="下一曲">换一曲</button></div>
        <label class="music-volume">音量 <input id="musicVolume" type="range" min="0" max="100" value="30"></label>
        <p id="musicStatus" role="status">轻叩听曲，声起此间。</p></div>`;
    document.body.append(music);
    const trackSelect = music.querySelector('select');
    const play = music.querySelector('#musicPlay');
    const volume = music.querySelector('input');
    const status = music.querySelector('#musicStatus');
    const tracks = [
        { beat: .64, root: 196, notes: [0,2,4,7,9,7,4,2,0,null,2,4,9,7,4,null] },
        { beat: .48, root: 220, notes: [0,7,4,2,4,9,7,null,12,9,7,4,2,4,0,null] },
        { beat: .84, root: 174.61, notes: [12,null,9,7,4,null,2,0,7,null,4,2,0,null,null,null] }
    ];
    let track = Math.max(0, Math.min(2, Number(read('jianghu-music-track', '0')) || 0));
    trackSelect.selectedIndex = track;
    volume.value = String(Math.max(0, Math.min(100, Number(read('jianghu-music-volume', '30')) || 0)));
    let context, master, timer, playing = false, step = 0, nextTime = 0;
    function setup() {
        if (context) return;
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) throw new Error('unsupported');
        context = new Audio();
        master = context.createGain();
        master.gain.value = 0;
        const echo = context.createDelay(1), feedback = context.createGain(), soft = context.createBiquadFilter();
        echo.delayTime.value = .31; feedback.gain.value = .19;
        soft.type = 'lowpass'; soft.frequency.value = 2200;
        master.connect(context.destination);
        master.connect(echo); echo.connect(soft); soft.connect(feedback); feedback.connect(echo); soft.connect(context.destination);
    }
    function note(frequency, when, strength) {
        const envelope = context.createGain();
        envelope.gain.setValueAtTime(0, when);
        envelope.gain.linearRampToValueAtTime(strength, when + .015);
        envelope.gain.exponentialRampToValueAtTime(.0001, when + 2.4);
        envelope.connect(master);
        [1, 2, 3].forEach((harmonic, index) => {
            const oscillator = context.createOscillator(), weight = context.createGain();
            oscillator.type = 'sine'; oscillator.frequency.value = frequency * harmonic;
            weight.gain.value = [1, .24, .07][index];
            oscillator.connect(weight); weight.connect(envelope);
            oscillator.start(when); oscillator.stop(when + 2.5);
            oscillator.onended = () => { oscillator.disconnect(); weight.disconnect(); if (index === 2) envelope.disconnect(); };
        });
    }
    function schedule() {
        if (!playing) return;
        const score = tracks[track];
        nextTime = Math.max(nextTime, context.currentTime);
        while (nextTime < context.currentTime + .18) {
            const pitch = score.notes[step % score.notes.length];
            if (pitch !== null) note(score.root * 2 ** (pitch / 12), nextTime, .32);
            if (step % 8 === 0) note(score.root / 2, nextTime, .16);
            nextTime += score.beat * (step % 4 === 3 ? 1.35 : 1);
            step++;
        }
        timer = window.setTimeout(schedule, 80);
    }
    function stop() {
        playing = false; clearTimeout(timer);
        if (context) master.gain.setTargetAtTime(0, context.currentTime, .07);
        play.textContent = '听曲'; play.setAttribute('aria-pressed', 'false');
        status.textContent = '曲暂歇，余音留在檐下。';
        music.classList.remove('is-playing');
    }
    play.addEventListener('click', async () => {
        if (playing) { stop(); return; }
        play.disabled = true;
        try {
            setup(); await context.resume();
            playing = true; nextTime = context.currentTime + .05;
            master.gain.setTargetAtTime(Number(volume.value) / 100 * .45, context.currentTime, .12);
            play.textContent = '歇弦'; play.setAttribute('aria-pressed', 'true');
            music.classList.add('is-playing'); status.textContent = `正在听 · ${trackSelect.options[track].text}`;
            schedule();
        } catch { status.textContent = '此浏览器暂时无法奏乐，请换个浏览器试试。'; }
        finally { play.disabled = false; }
    });
    function changeTrack() {
        track = trackSelect.selectedIndex; step = 0; save('jianghu-music-track', track);
        if (context) nextTime = context.currentTime + .08;
        status.textContent = playing ? `正在听 · ${trackSelect.options[track].text}` : '曲已选好，轻叩听曲。';
    }
    trackSelect.addEventListener('change', changeTrack);
    music.querySelector('#musicNext').addEventListener('click', () => { trackSelect.selectedIndex = (track + 1) % tracks.length; changeTrack(); });
    volume.addEventListener('input', () => {
        save('jianghu-music-volume', volume.value);
        if (playing) master.gain.setTargetAtTime(Number(volume.value) / 100 * .45, context.currentTime, .05);
    });
    window.addEventListener('pagehide', stop);

    // Piles sit on each actual component edge; every silhouette is slightly different.
    document.querySelectorAll('.archive-mast,.page-mast,.paper-card,.journal-card,.book-card,.mechanism-widget,.mechanism-list,.shelf-note article').forEach(element => {
        element.classList.add('snow-bearing');
        const cap = document.createElement('span');
        cap.className = 'settled-snow'; cap.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < 8; i++) {
            const mound = document.createElement('i');
            mound.style.setProperty('--sx', `${i * 12 - 2 + Math.random() * 3}%`);
            mound.style.setProperty('--sw', `${15 + Math.random() * 10}%`);
            mound.style.setProperty('--sh', `${40 + Math.random() * 60}%`);
            cap.append(mound);
        }
        element.append(cap);
    });
    const ground = document.createElement('div');
    ground.className = 'snow-floor'; ground.setAttribute('aria-hidden', 'true'); document.body.append(ground);
    let snowDepth = .2;
    setInterval(() => {
        if (document.hidden) return;
        if (document.body.dataset.weather === 'snow') snowDepth = Math.min(1, snowDepth + .009);
        else snowDepth = .2;
        document.body.style.setProperty('--snow-depth', snowDepth.toFixed(3));
    }, 1000);
    const snowman = document.querySelector('.snowman');
    if (snowman) {
        snowman.removeAttribute('aria-hidden');
        const nose = document.createElement('button');
        nose.type = 'button'; nose.className = 'snowman-nose';
        nose.setAttribute('aria-label', '给雪人安上胡萝卜鼻子'); nose.setAttribute('aria-pressed', 'false');
        const hint = document.createElement('span'); hint.className = 'snowman-hint'; hint.textContent = '给我安个鼻子';
        snowman.append(nose, hint);
        nose.addEventListener('click', () => {
            const attached = snowman.classList.toggle('has-nose');
            nose.setAttribute('aria-pressed', String(attached));
            nose.setAttribute('aria-label', attached ? '取下雪人的胡萝卜鼻子' : '给雪人安上胡萝卜鼻子');
            hint.textContent = attached ? '这下能闻到梅香了' : '给我安个鼻子';
        });
    }
})();
