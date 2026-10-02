/* Small, self-contained sound and winter interactions shared by all pages. */
(() => {
    const read = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
    const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
    const tracks = JIANGHU_PLAYLIST;
    const music = document.createElement('details');
    music.className = 'music-box';
    music.innerHTML = `<summary><span aria-hidden="true">♪</span> 听风 · 琴匣</summary>
        <div class="music-content"><p class="music-caption">一曲入江湖</p>
        <label class="music-label" for="musicTrack">选一支曲 · 十三首</label><select id="musicTrack"></select>
        <p class="music-note"><a id="musicSource" target="_blank" rel="noopener noreferrer">原站听曲 ↗</a></p>
        <div class="music-actions"><button id="musicPrevious" type="button" aria-label="上一曲">‹</button><button id="musicPlay" type="button" aria-pressed="false">听曲</button><button id="musicNext" type="button" aria-label="下一曲">›</button></div>
        <label class="music-label" for="musicSeek">曲中行程</label><input id="musicSeek" class="music-seek" type="range" min="0" max="1000" value="0" disabled>
        <p class="music-time" id="musicTime">0:00 / 0:00</p>
        <label class="music-volume">音量 <input id="musicVolume" type="range" min="0" max="100" value="30"></label>
        <p id="musicStatus" role="status">轻叩听曲，声起此间。</p></div>`;
    document.body.append(music);
    const trackSelect = music.querySelector('#musicTrack'), play = music.querySelector('#musicPlay');
    const volume = music.querySelector('#musicVolume'), status = music.querySelector('#musicStatus');
    const seek = music.querySelector('#musicSeek'), timeLabel = music.querySelector('#musicTime');
    const source = music.querySelector('#musicSource'), audio = new Audio();
    audio.preload = 'none';
    tracks.forEach(item => { const option = document.createElement('option'); option.textContent = item.title; trackSelect.append(option); });
    let track = Math.max(0, Math.min(tracks.length - 1, Number(read('jianghu-song-track', '0')) || 0));
    volume.value = String(Math.max(0, Math.min(100, Number(read('jianghu-music-volume', '30')) || 0)));
    audio.volume = Number(volume.value) / 100;
    let request = 0;
    function syncPlay() {
        const active = !audio.paused;
        play.textContent = active ? '歇弦' : '听曲'; play.setAttribute('aria-pressed', String(active));
        music.classList.toggle('is-playing', active);
    }
    function loadTrack() {
        request++; audio.pause(); audio.src = tracks[track].url;
        trackSelect.selectedIndex = track; save('jianghu-song-track', track);
        source.href = `https://music.163.com/song?id=${new URL(tracks[track].url).searchParams.get('id').replace('.mp3', '')}`;
        seek.value = '0'; seek.disabled = true; timeLabel.textContent = '0:00 / 0:00';
        status.textContent = `已选 · ${tracks[track].title}`; syncPlay();
    }
    async function start() {
        const id = ++request;
        status.textContent = `正在寻曲 · ${tracks[track].title}`;
        try { await audio.play(); if (id === request) { syncPlay(); status.textContent = `正在听 · ${tracks[track].title}`; } }
        catch (error) { if (id === request && error.name !== 'AbortError') { syncPlay(); status.textContent = '音源暂不可用，可换一曲或打开原站。'; } }
    }
    play.addEventListener('click', () => {
        if (!audio.paused) { request++; audio.pause(); status.textContent = '曲暂歇，余音留在檐下。'; }
        else start();
    });
    function changeTrack(index, resume = !audio.paused) {
        track = (index + tracks.length) % tracks.length; loadTrack(); if (resume) start();
    }
    trackSelect.addEventListener('change', () => changeTrack(trackSelect.selectedIndex));
    music.querySelector('#musicPrevious').addEventListener('click', () => changeTrack(track - 1));
    music.querySelector('#musicNext').addEventListener('click', () => changeTrack(track + 1));
    const formatTime = seconds => { const s = Number.isFinite(seconds) ? Math.floor(seconds) : 0; return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
    function syncTime() {
        const ready = Number.isFinite(audio.duration) && audio.duration > 0;
        seek.disabled = !ready;
        seek.value = ready ? String(Math.round(audio.currentTime / audio.duration * 1000)) : '0';
        timeLabel.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    }
    audio.addEventListener('timeupdate', syncTime); audio.addEventListener('loadedmetadata', syncTime);
    audio.addEventListener('play', syncPlay); audio.addEventListener('pause', syncPlay);
    audio.addEventListener('ended', () => changeTrack(track + 1, true));
    audio.addEventListener('error', () => { syncPlay(); status.textContent = '音源暂不可用，可换一曲或打开原站。'; });
    seek.addEventListener('input', () => { if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = Number(seek.value) / 1000 * audio.duration; });
    volume.addEventListener('input', () => { audio.volume = Number(volume.value) / 100; save('jianghu-music-volume', volume.value); });
    window.addEventListener('pagehide', () => { request++; audio.pause(); });
    loadTrack();

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
        snowman.classList.add('desktop-pet');
        const nose = document.createElement('button');
        nose.type = 'button'; nose.className = 'snowman-nose';
        nose.setAttribute('aria-label', '拖动雪人；点击打开装扮；方向键移动'); nose.setAttribute('aria-expanded', 'false'); nose.setAttribute('aria-controls', 'petWardrobe');
        const hint = document.createElement('span'); hint.className = 'snowman-hint'; hint.textContent = '拖我走 · 点我换装';
        const hat = document.createElement('span'); hat.className = 'pet-bamboo-hat'; hat.setAttribute('aria-hidden', 'true');
        const wardrobe = document.createElement('div'); wardrobe.id = 'petWardrobe'; wardrobe.className = 'pet-wardrobe'; wardrobe.hidden = true;
        wardrobe.innerHTML = `<p>雪客 · 行囊</p><button type="button" data-dress="nose">安鼻子</button><button type="button" data-dress="hat">戴斗笠</button><button type="button" data-dress="scarf">系围巾</button><button type="button" data-reset>归位</button>`;
        snowman.append(hat, nose, hint, wardrobe);
        const dress = { nose:read('jianghu-pet-nose', 'false') === 'true', hat:read('jianghu-pet-hat', 'false') === 'true', scarf:read('jianghu-pet-scarf', 'true') === 'true' };
        function syncDress() {
            snowman.classList.toggle('has-nose', dress.nose); snowman.classList.toggle('has-bamboo-hat', dress.hat); snowman.classList.toggle('has-scarf', dress.scarf);
            wardrobe.querySelectorAll('[data-dress]').forEach(button => {
                const key = button.dataset.dress; button.setAttribute('aria-pressed', String(dress[key]));
                button.textContent = {nose:dress.nose ? '取下鼻子' : '安鼻子',hat:dress.hat ? '摘斗笠' : '戴斗笠',scarf:dress.scarf ? '解围巾' : '系围巾'}[key];
            });
        }
        wardrobe.addEventListener('click', event => {
            const button = event.target.closest('[data-dress]'); if (!button) return;
            const key = button.dataset.dress; dress[key] = !dress[key]; save(`jianghu-pet-${key}`, String(dress[key])); syncDress();
        });
        syncDress();
        let x = 0, y = 0, dragging = null, suppressClick = false;
        function place(left, top) {
            x = Math.max(8, Math.min(Math.max(8, innerWidth - 96), left));
            y = Math.max(30, Math.min(Math.max(30, innerHeight - 115), top));
            Object.assign(snowman.style, {left:`${x}px`,top:`${y}px`,right:'auto',bottom:'auto'});
            snowman.classList.toggle('pet-menu-left', x > innerWidth - 260);
            snowman.classList.toggle('pet-menu-down', y < 180);
        }
        function persistPosition() { save('jianghu-pet-position', JSON.stringify({x:x / Math.max(1, innerWidth - 96),y:y / Math.max(1, innerHeight - 115)})); }
        function reset() { place(Math.max(12, (innerWidth - 1140) / 2 - 31), innerHeight - 130); persistPosition(); }
        try {
            const position = JSON.parse(read('jianghu-pet-position', 'null'));
            if (position && Number.isFinite(position.x) && Number.isFinite(position.y)) place(position.x * (innerWidth - 96), position.y * (innerHeight - 115));
            else reset();
        } catch { reset(); }
        function closeWardrobe() { wardrobe.hidden = true; nose.setAttribute('aria-expanded', 'false'); }
        nose.addEventListener('pointerdown', event => {
            if (event.button !== 0) return;
            suppressClick = false; dragging = {id:event.pointerId,x:event.clientX,y:event.clientY,left:x,top:y,moved:false};
            nose.setPointerCapture(event.pointerId);
        });
        nose.addEventListener('pointermove', event => {
            if (!dragging || dragging.id !== event.pointerId) return;
            const dx = event.clientX - dragging.x, dy = event.clientY - dragging.y;
            if (!dragging.moved && Math.hypot(dx, dy) < 5) return;
            dragging.moved = true; closeWardrobe(); snowman.classList.add('is-dragging');
            place(dragging.left + dx, dragging.top + dy);
        });
        function release(event) {
            if (!dragging || dragging.id !== event.pointerId) return;
            suppressClick = dragging.moved; if (dragging.moved) persistPosition();
            dragging = null; snowman.classList.remove('is-dragging');
            if (nose.hasPointerCapture(event.pointerId)) nose.releasePointerCapture(event.pointerId);
        }
        nose.addEventListener('pointerup', release); nose.addEventListener('pointercancel', release);
        nose.addEventListener('click', () => {
            if (suppressClick) { suppressClick = false; return; }
            wardrobe.hidden = !wardrobe.hidden; nose.setAttribute('aria-expanded', String(!wardrobe.hidden));
        });
        nose.addEventListener('keydown', event => {
            const distance = event.shiftKey ? 25 : 10;
            const delta = {ArrowLeft:[-distance,0],ArrowRight:[distance,0],ArrowUp:[0,-distance],ArrowDown:[0,distance]}[event.key];
            if (delta) { event.preventDefault(); place(x + delta[0], y + delta[1]); persistPosition(); }
            if (event.key === 'Escape') closeWardrobe();
            if (event.key === 'Home') { event.preventDefault(); reset(); }
        });
        wardrobe.querySelector('[data-reset]').addEventListener('click', () => { reset(); closeWardrobe(); });
        document.addEventListener('pointerdown', event => { if (!snowman.contains(event.target)) closeWardrobe(); });
        window.addEventListener('resize', () => { place(x, y); persistPosition(); });
    }
})();
