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
    (document.querySelector('.scene-controls') || document.body).append(music);
    document.addEventListener('pointerdown', event => { if (!music.contains(event.target)) music.open = false; });
    music.addEventListener('keydown', event => { if (event.key === 'Escape') { music.open = false; music.querySelector('summary').focus(); } });
    const trackSelect = music.querySelector('#musicTrack'), play = music.querySelector('#musicPlay');
    const volume = music.querySelector('#musicVolume'), status = music.querySelector('#musicStatus');
    const seek = music.querySelector('#musicSeek'), timeLabel = music.querySelector('#musicTime');
    const source = music.querySelector('#musicSource'), audio = new Audio();
    audio.preload = 'none';
    tracks.forEach(item => { const option = document.createElement('option'); option.textContent = item.title; trackSelect.append(option); });
    let track = Math.max(0, Math.min(tracks.length - 1, Number(read('jianghu-song-track', '0')) || 0));
    volume.value = String(Math.max(0, Math.min(100, Number(read('jianghu-music-volume', '30')) || 0)));
    audio.volume = Number(volume.value) / 100;
    let request = 0, loading = false, seeking = false;
    function syncPlay() {
        const active = !audio.paused;
        play.textContent = loading ? '取消寻曲' : active ? '歇弦' : '听曲'; play.setAttribute('aria-pressed', String(active || loading));
        play.setAttribute('aria-busy', String(loading));
        music.classList.toggle('is-playing', active);
    }
    function loadTrack() {
        request++; loading = seeking = false; audio.pause(); audio.src = tracks[track].url;
        trackSelect.selectedIndex = track; save('jianghu-song-track', track);
        source.href = `https://music.163.com/song?id=${new URL(tracks[track].url).searchParams.get('id').replace('.mp3', '')}`;
        seek.value = '0'; seek.disabled = true; timeLabel.textContent = '0:00 / 0:00';
        status.textContent = `已选 · ${tracks[track].title}`; syncPlay();
    }
    async function start() {
        const id = ++request;
        loading = true; syncPlay();
        status.textContent = `正在寻曲 · ${tracks[track].title}`;
        try { await audio.play(); if (id === request) { loading = false; syncPlay(); status.textContent = `正在听 · ${tracks[track].title}`; } }
        catch (error) { if (id === request) { loading = false; syncPlay(); if (error.name !== 'AbortError') status.textContent = '音源暂不可用，可换一曲或打开原站。'; } }
    }
    play.addEventListener('click', () => {
        if (loading || !audio.paused) { request++; loading = false; audio.pause(); syncPlay(); status.textContent = '曲暂歇，余音留在檐下。'; }
        else start();
    });
    function changeTrack(index, resume = loading || !audio.paused) {
        track = (index + tracks.length) % tracks.length; loadTrack(); if (resume) start();
    }
    trackSelect.addEventListener('change', () => changeTrack(trackSelect.selectedIndex));
    music.querySelector('#musicPrevious').addEventListener('click', () => changeTrack(track - 1));
    music.querySelector('#musicNext').addEventListener('click', () => changeTrack(track + 1));
    const formatTime = seconds => { const s = Number.isFinite(seconds) ? Math.floor(seconds) : 0; return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
    function syncTime() {
        if (!music.open || document.hidden || seeking) return;
        const ready = Number.isFinite(audio.duration) && audio.duration > 0;
        seek.disabled = !ready;
        seek.value = ready ? String(Math.round(audio.currentTime / audio.duration * 1000)) : '0';
        timeLabel.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    }
    music.addEventListener('toggle', () => { if (music.open) syncTime(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) syncTime(); });
    audio.addEventListener('timeupdate', syncTime); audio.addEventListener('loadedmetadata', syncTime);
    audio.addEventListener('play', syncPlay); audio.addEventListener('pause', syncPlay);
    audio.addEventListener('ended', () => changeTrack(track + 1, true));
    audio.addEventListener('error', () => { loading = false; syncPlay(); status.textContent = '音源暂不可用，可换一曲或打开原站。'; });
    seek.addEventListener('input', () => {
        seeking = true;
        timeLabel.textContent = `${formatTime(Number(seek.value) / 1000 * audio.duration)} / ${formatTime(audio.duration)}`;
    });
    seek.addEventListener('change', () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = Number(seek.value) / 1000 * audio.duration;
        seeking = false; syncTime();
    });
    seek.addEventListener('pointercancel', () => { seeking = false; syncTime(); });
    seek.addEventListener('blur', () => { seeking = false; syncTime(); });
    volume.addEventListener('input', () => { audio.volume = Number(volume.value) / 100; });
    volume.addEventListener('change', () => save('jianghu-music-volume', volume.value));
    window.addEventListener('pagehide', () => { request++; loading = false; audio.pause(); save('jianghu-music-volume', volume.value); });
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
    let snowDepth = .2, snowTimer = 0, snowfall = .7;
    function growSnow() {
        snowTimer = 0;
        if (document.hidden || document.body.dataset.weather !== 'snow' || snowDepth >= 1) return;
        snowDepth = Math.min(1, snowDepth + (.004 + snowfall * .009) * 3);
        document.body.style.setProperty('--snow-depth', snowDepth.toFixed(3));
        if (snowDepth < 1) snowTimer = setTimeout(growSnow, 3000);
    }
    function syncSnow() {
        clearTimeout(snowTimer); snowTimer = 0;
        if (document.body.dataset.weather !== 'snow') {
            if (snowDepth !== .2) { snowDepth = .2; document.body.style.setProperty('--snow-depth', '.2'); }
        } else if (!document.hidden && snowDepth < 1) snowTimer = setTimeout(growSnow, 3000);
    }
    new MutationObserver(syncSnow).observe(document.body, {attributes:true,attributeFilter:['data-weather']});
    window.addEventListener('jianghu-weather-pulse', event => { snowfall = event.detail.intensity; });
    document.addEventListener('visibilitychange', syncSnow);
    window.addEventListener('pagehide', () => { clearTimeout(snowTimer); snowTimer = 0; });
    window.addEventListener('pageshow', syncSnow);
    syncSnow();
    const snowman = document.querySelector('.snowman');
    if (snowman) {
        snowman.removeAttribute('aria-hidden');
        snowman.classList.add('desktop-pet');
        const sculpture = document.createElement('div');
        sculpture.className = 'pet-sculpture'; sculpture.setAttribute('aria-hidden', 'true');
        sculpture.innerHTML = JIANGHU_SNOWMAN_ART;
        snowman.prepend(sculpture);
        const nose = document.createElement('button');
        nose.type = 'button'; nose.className = 'snowman-nose';
        nose.setAttribute('aria-label', '拖动雪人；点击打开装扮；方向键移动'); nose.setAttribute('aria-expanded', 'false'); nose.setAttribute('aria-controls', 'petWardrobe');
        const hint = document.createElement('span'); hint.className = 'snowman-hint'; hint.textContent = '拖动随行 · 点我换装';
        const hat = document.createElement('span'); hat.className = 'pet-bamboo-hat'; hat.setAttribute('aria-hidden', 'true');
        const outfits = [
            {id:'vermilion',name:'朱砂围巾',note:'一抹暖意'},
            {id:'moon',name:'月白披风',note:'清风拂衣'},
            {id:'swordsman',name:'玄衣剑客',note:'负剑而行'},
            {id:'traveler',name:'蓑衣斗笠',note:'风雪归人'},
            {id:'winter',name:'绒帽冬装',note:'围炉听雪'},
            {id:'bare',name:'素雪本色',note:'一身清白'}
        ];
        let outfit = read('jianghu-pet-outfit', 'vermilion');
        if (!outfits.some(item => item.id === outfit)) outfit = 'vermilion';
        const wardrobe = document.createElement('div'); wardrobe.id = 'petWardrobe'; wardrobe.className = 'pet-wardrobe pet-wardrobe-panel'; wardrobe.hidden = true;
        wardrobe.setAttribute('role', 'group'); wardrobe.setAttribute('aria-label', '雪客衣柜');
        wardrobe.innerHTML = `<div class="pet-wardrobe-heading"><div><p>雪客 · 行装</p><small>给随行的它，换一身江湖</small></div><button type="button" class="pet-wardrobe-close" aria-label="收起衣柜">×</button></div>
            <div class="pet-outfit-grid">${outfits.map(item => `<button type="button" data-outfit="${item.id}" aria-pressed="false"><i class="pet-outfit-swatch" aria-hidden="true"></i><span>${item.name}<small>${item.note}</small></span></button>`).join('')}</div>
            <p class="pet-accessory-label">随身小物</p><div class="pet-accessory-actions"><button type="button" data-dress="nose">安鼻子</button><button type="button" data-dress="hat">戴斗笠</button><button type="button" data-dress="scarf">系围巾</button></div>
            <button type="button" data-reset class="pet-reset">回到身旁 <span aria-hidden="true">↙</span></button>`;
        snowman.append(hat, nose, hint, wardrobe);
        const dress = { nose:read('jianghu-pet-nose', 'true') === 'true', hat:read('jianghu-pet-hat', String(outfit === 'traveler')) === 'true', scarf:read('jianghu-pet-scarf', String(outfit !== 'bare')) === 'true' };
        function syncOutfit() {
            snowman.dataset.outfit = outfit;
            wardrobe.querySelectorAll('[data-outfit]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.outfit === outfit)));
        }
        function syncDress() {
            snowman.classList.toggle('has-nose', dress.nose); snowman.classList.toggle('has-bamboo-hat', dress.hat); snowman.classList.toggle('has-scarf', dress.scarf);
            wardrobe.querySelectorAll('[data-dress]').forEach(button => {
                const key = button.dataset.dress; button.setAttribute('aria-pressed', String(dress[key]));
                button.textContent = {nose:dress.nose ? '取下鼻子' : '安鼻子',hat:dress.hat ? '摘斗笠' : '戴斗笠',scarf:dress.scarf ? '解围巾' : '系围巾'}[key];
            });
        }
        wardrobe.addEventListener('click', event => {
            const outfitButton = event.target.closest('button[data-outfit]');
            if (outfitButton) {
                outfit = outfitButton.dataset.outfit; save('jianghu-pet-outfit', outfit);
                dress.hat = outfit === 'traveler'; dress.scarf = outfit !== 'bare';
                save('jianghu-pet-hat', String(dress.hat)); save('jianghu-pet-scarf', String(dress.scarf));
                syncOutfit(); syncDress(); positionWardrobe(); return;
            }
            const button = event.target.closest('[data-dress]'); if (!button) return;
            const key = button.dataset.dress; dress[key] = !dress[key]; save(`jianghu-pet-${key}`, String(dress[key])); syncDress();
        });
        syncOutfit(); syncDress();
        let x = 0, y = 0, dragging = null, suppressClick = false, dragFrame = 0;
        let petWidth = 104, petHeight = 132, petBottom = 16;
        function measurePet() {
            const style = getComputedStyle(snowman);
            petWidth = parseFloat(style.width) || 104; petHeight = parseFloat(style.height) || 132;
            const dock = document.querySelector('.scene-controls');
            petBottom = innerWidth <= 760 && dock ? Math.max(16, innerHeight - dock.getBoundingClientRect().top + 14) : 16;
        }
        measurePet();
        const petWidthLimit = () => Math.max(8, innerWidth - petWidth - 8);
        const petHeightLimit = () => Math.max(30, innerHeight - petHeight - petBottom);
        function positionWardrobe() {
            if (wardrobe.hidden) return;
            wardrobe.style.maxHeight = `${Math.max(120, innerHeight - petBottom - 24)}px`;
            const menu = wardrobe.getBoundingClientRect(), gap = 10;
            let left = x + petWidth + gap;
            if (left + menu.width > innerWidth - 12) left = x - menu.width - gap;
            left = Math.max(12, Math.min(innerWidth - menu.width - 12, left));
            let preferredTop = y + petHeight - menu.height;
            if (left < x + petWidth && left + menu.width > x) {
                if (y - menu.height - gap >= 12) preferredTop = y - menu.height - gap;
                else if (y + petHeight + gap + menu.height <= innerHeight - petBottom) preferredTop = y + petHeight + gap;
            }
            const top = Math.max(12, Math.min(innerHeight - petBottom - menu.height, preferredTop));
            Object.assign(wardrobe.style, {left:`${left - x}px`,right:'auto',top:`${top - y}px`,bottom:'auto'});
        }
        function place(left, top) {
            x = Math.max(8, Math.min(petWidthLimit(), left));
            y = Math.max(30, Math.min(petHeightLimit(), top));
            Object.assign(snowman.style, {left:`${x}px`,top:`${y}px`,right:'auto',bottom:'auto'});
            snowman.classList.toggle('pet-menu-left', x > innerWidth - 128);
            snowman.classList.toggle('pet-menu-down', y < 180);
            positionWardrobe();
        }
        function persistPosition() { save('jianghu-pet-position', JSON.stringify({x:x / petWidthLimit(),y:y / petHeightLimit()})); }
        function reset() { place(Math.max(12, (innerWidth - 1140) / 2 - 31), petHeightLimit() - 15); persistPosition(); }
        try {
            const position = JSON.parse(read('jianghu-pet-position', 'null'));
            if (position && Number.isFinite(position.x) && Number.isFinite(position.y)) place(position.x * petWidthLimit(), position.y * petHeightLimit());
            else reset();
        } catch { reset(); }
        function closeWardrobe() { wardrobe.hidden = true; nose.setAttribute('aria-expanded', 'false'); }
        new MutationObserver(() => {
            if (document.body.dataset.weather !== 'snow') {
                if (snowman.contains(document.activeElement)) document.querySelector('#weatherSwitch')?.focus({preventScroll:true});
                closeWardrobe();
            }
        }).observe(document.body, {attributes:true,attributeFilter:['data-weather']});
        nose.addEventListener('pointerdown', event => {
            if (event.button !== 0) return;
            measurePet(); suppressClick = false; dragging = {id:event.pointerId,x:event.clientX,y:event.clientY,left:x,top:y,moved:false};
            nose.setPointerCapture(event.pointerId);
        });
        nose.addEventListener('pointermove', event => {
            if (!dragging || dragging.id !== event.pointerId) return;
            const dx = event.clientX - dragging.x, dy = event.clientY - dragging.y;
            if (!dragging.moved && Math.hypot(dx, dy) < 5) return;
            if (!dragging.moved) { dragging.moved = true; closeWardrobe(); snowman.classList.add('is-dragging'); }
            dragging.targetX = Math.max(8, Math.min(petWidthLimit(), dragging.left + dx));
            dragging.targetY = Math.max(30, Math.min(petHeightLimit(), dragging.top + dy));
            if (!dragFrame) dragFrame = requestAnimationFrame(() => {
                dragFrame = 0; if (!dragging) return;
                snowman.style.setProperty('--pet-dx', `${dragging.targetX - dragging.left}px`);
                snowman.style.setProperty('--pet-dy', `${dragging.targetY - dragging.top}px`);
            });
        });
        function release(event) {
            if (!dragging || dragging.id !== event.pointerId) return;
            cancelAnimationFrame(dragFrame); dragFrame = 0;
            if (dragging.moved) place(dragging.targetX, dragging.targetY);
            snowman.style.setProperty('--pet-dx', '0px'); snowman.style.setProperty('--pet-dy', '0px');
            suppressClick = dragging.moved; if (dragging.moved) persistPosition();
            dragging = null; snowman.classList.remove('is-dragging');
            if (nose.hasPointerCapture(event.pointerId)) nose.releasePointerCapture(event.pointerId);
        }
        nose.addEventListener('pointerup', release); nose.addEventListener('pointercancel', release);
        nose.addEventListener('click', () => {
            if (suppressClick) { suppressClick = false; return; }
            wardrobe.hidden = !wardrobe.hidden; nose.setAttribute('aria-expanded', String(!wardrobe.hidden));
            if (!wardrobe.hidden) positionWardrobe();
        });
        nose.addEventListener('keydown', event => {
            const distance = event.shiftKey ? 25 : 10;
            const delta = {ArrowLeft:[-distance,0],ArrowRight:[distance,0],ArrowUp:[0,-distance],ArrowDown:[0,distance]}[event.key];
            if (delta) { event.preventDefault(); place(x + delta[0], y + delta[1]); persistPosition(); }
            if (event.key === 'Escape') closeWardrobe();
            if (event.key === 'Home') { event.preventDefault(); reset(); }
        });
        wardrobe.querySelector('[data-reset]').addEventListener('click', () => { reset(); closeWardrobe(); });
        wardrobe.querySelector('.pet-wardrobe-close').addEventListener('click', () => { closeWardrobe(); nose.focus({preventScroll:true}); });
        wardrobe.addEventListener('keydown', event => { if (event.key === 'Escape') { closeWardrobe(); nose.focus({preventScroll:true}); } });
        document.addEventListener('pointerdown', event => { if (!snowman.contains(event.target)) closeWardrobe(); });
        let petResizeTimer = 0;
        window.addEventListener('resize', () => {
            clearTimeout(petResizeTimer);
            petResizeTimer = setTimeout(() => { measurePet(); place(x, y); }, 140);
        }, {passive:true});
        window.addEventListener('pagehide', () => clearTimeout(petResizeTimer));
    }
})();
