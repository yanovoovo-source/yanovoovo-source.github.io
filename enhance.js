/* Small editorial interactions; ordinary links remain usable without JavaScript. */
(() => {
    const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
    const sceneChoices = [...document.querySelectorAll('[data-scene-choice]')];
    const syncChoices = () => sceneChoices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.sceneChoice === document.body.dataset.scene)));
    sceneChoices.forEach(button => button.addEventListener('click', () => {
        const index = scenes.findIndex(scene => scene.id === button.dataset.sceneChoice);
        if (index < 0) return;
        sceneIndex = index; applyScene(); syncChoices();
    }));
    if (sceneChoices.length) {
        syncChoices();
        new MutationObserver(syncChoices).observe(document.body, {attributes:true,attributeFilter:['data-scene']});
    }

    const books = [...document.querySelectorAll('.book-card[data-reading]')];
    const filters = [...document.querySelectorAll('[data-reading-filter]')];
    if (books.length && filters.length) {
        const count = document.createElement('p'); count.className = 'shelf-filter-count'; count.setAttribute('role', 'status');
        document.querySelector('.shelf-filters').after(count);
        function filterBooks(value) {
            let visible = 0;
            books.forEach(book => { book.hidden = value !== 'all' && book.dataset.reading !== value; if (!book.hidden) visible++; });
            filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.readingFilter === value)));
            count.textContent = `案头藏书 · ${String(visible).padStart(2, '0')} 卷`;
        }
        filters.forEach(button => button.addEventListener('click', () => filterBooks(button.dataset.readingFilter)));
        filterBooks('all');
    }

    const fortune = document.querySelector('#fortuneText'), ask = document.querySelector('#fortuneButton');
    if (fortune && ask) {
        let draws = 0;
        const heading = document.createElement('div'); heading.className = 'fortune-slip-meta';
        heading.innerHTML = '<span>问剑 · 日常一签</span><small>未启</small>';
        fortune.before(heading);
        ask.addEventListener('click', () => {
            heading.querySelector('small').textContent = `第 ${String(++draws).padStart(2, '0')} 签`;
            if (!reducedMotion.matches && fortune.animate) fortune.animate([{opacity:.25,transform:'translateY(4px)'},{opacity:1,transform:'none'}],{duration:260,easing:'ease-out'});
        });
    }

    const tiles = [...document.querySelectorAll('.gallery-tile')];
    if (!tiles.length || typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;
    const descriptions = ['花枝探过檐角，灯火沿水巷向远处铺开。','朱门相对，长街深处仍有未散的灯火。','一塔旧影，几重屋檐，春色落在城中。'];
    const pictures = tiles.map((tile, index) => ({url:tile.href,title:tile.querySelector('span')?.firstChild?.textContent.trim() || `江湖画卷 ${index + 1}`,alt:tile.querySelector('img')?.alt || '江湖画卷',description:descriptions[index] || ''}));
    const viewer = document.createElement('dialog'); viewer.className = 'art-lightbox';
    viewer.setAttribute('aria-labelledby', 'artViewerTitle');
    viewer.innerHTML = `<div class="art-viewer-toolbar"><span>浮光掠影 <small>PRIVATE COLLECTION</small></span><button type="button" data-art-close aria-label="关闭画卷" autofocus>×</button></div>
        <div class="art-viewer-layout"><div class="art-viewer-stage"><button type="button" data-art-previous aria-label="上一幅画">‹</button><img id="artViewerImage" width="720" height="1280" decoding="async" alt=""><button type="button" data-art-next aria-label="下一幅画">›</button></div>
        <section class="art-viewer-caption"><div><p class="art-viewer-counter"></p><h2 id="artViewerTitle"></h2><p class="art-viewer-description"></p><div class="art-viewer-thumbnails" aria-label="选择画卷">${pictures.map((picture,index) => `<button type="button" data-art-index="${index}" aria-label="查看${picture.title}" aria-pressed="false"><img src="${picture.url}" alt="" width="40" height="56" loading="lazy"></button>`).join('')}</div></div>
        <div class="art-viewer-footnote"><a class="art-viewer-original" data-art-original target="_blank" rel="noopener noreferrer">展开原图 ↗</a><p>左右切换 · ESC 收卷<br>手机也可以左右轻扫</p></div></section></div>`;
    document.body.append(viewer);
    const image = viewer.querySelector('#artViewerImage'), title = viewer.querySelector('#artViewerTitle');
    let current = 0, opener = null, swipe = null;
    function show(index) {
        current = (index + pictures.length) % pictures.length;
        const picture = pictures[current]; image.src = picture.url; image.alt = picture.alt;
        title.textContent = picture.title;
        viewer.querySelector('.art-viewer-counter').textContent = `画卷 / ${String(current + 1).padStart(2, '0')} — ${String(pictures.length).padStart(2, '0')}`;
        viewer.querySelector('.art-viewer-description').textContent = picture.description;
        viewer.querySelector('.art-viewer-original').href = picture.url;
        viewer.querySelectorAll('[data-art-index]').forEach(button => button.setAttribute('aria-pressed', Number(button.dataset.artIndex) === current ? 'true' : 'false'));
    }
    function close() { if (viewer.open) viewer.close(); }
    tiles.forEach((tile, index) => {
        tile.setAttribute('aria-label', `展开${pictures[index].title}画卷`);
        tile.addEventListener('click', event => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault(); opener = tile; show(index);
            viewer.showModal(); document.documentElement.classList.add('art-viewer-open');
        });
    });
    viewer.querySelector('[data-art-close]').addEventListener('click', close);
    viewer.querySelector('[data-art-next]').addEventListener('click', () => show(current + 1));
    viewer.querySelector('[data-art-previous]').addEventListener('click', () => show(current - 1));
    viewer.querySelectorAll('[data-art-index]').forEach(button => button.addEventListener('click', () => show(Number(button.dataset.artIndex))));
    viewer.addEventListener('cancel', event => { event.preventDefault(); close(); });
    viewer.addEventListener('close', () => { document.documentElement.classList.remove('art-viewer-open'); swipe = null; if (opener?.isConnected) opener.focus({preventScroll:true}); });
    viewer.addEventListener('keydown', event => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); show(current + (event.key === 'ArrowRight' ? 1 : -1)); }
    });
    viewer.addEventListener('click', event => {
        if (event.target !== viewer) return;
        const rect = viewer.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    });
    const stage = viewer.querySelector('.art-viewer-stage');
    stage.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') swipe = {x:event.clientX,y:event.clientY}; });
    stage.addEventListener('pointerup', event => {
        if (!swipe) return;
        const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y; swipe = null;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) show(current + (dx < 0 ? 1 : -1));
    });
    stage.addEventListener('pointercancel', () => { swipe = null; });
    addEventListener('pagehide', close);
})();
