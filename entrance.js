/* A brief opening curtain: decorative only, never a navigation or input gate. */
(() => {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const seenKey = 'jianghu-entrance-seen-v1';
    let curtain = null, endTimer = 0;

    function clearEntrance() {
        clearTimeout(endTimer); endTimer = 0;
        curtain?.remove(); curtain = null;
        document.body.classList.remove('is-entering-jianghu');
    }

    function openEntrance() {
        clearEntrance();
        if (document.hidden || reducedMotion.matches) return;
        curtain = document.createElement('div');
        curtain.className = 'jianghu-entrance';
        curtain.setAttribute('aria-hidden', 'true');
        curtain.innerHTML = `<span class="jianghu-entrance-panel jianghu-entrance-panel--upper"></span>
            <span class="jianghu-entrance-panel jianghu-entrance-panel--lower"></span>
            <span class="jianghu-entrance-mark"><span class="jianghu-entrance-word">此间</span><span class="jianghu-entrance-rule"></span><span class="jianghu-entrance-label">一隅江湖</span></span>`;
        document.body.append(curtain);
        document.body.classList.add('is-entering-jianghu');
        // The panels finish at 1 s; a short cleanup margin keeps the total under 1.2 s.
        endTimer = setTimeout(clearEntrance, 1100);
    }

    const replayTrigger = target => target instanceof Element ? target.closest('[data-replay-entrance]') : null;
    document.addEventListener('click', event => {
        if (replayTrigger(event.target)) openEntrance();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') { clearEntrance(); return; }
        if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
        const trigger = replayTrigger(event.target);
        if (!trigger) return;
        // Native buttons already emit click for keyboard activation; do not double-play.
        if (trigger.matches('button,input') || (event.key === 'Enter' && trigger.matches('a[href]'))) return;
        event.preventDefault(); trigger.click();
    });
    window.addEventListener('jianghu:entrance', event => {
        if (event.detail?.action === 'replay') openEntrance();
    });
    window.addEventListener('pagehide', clearEntrance);
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearEntrance(); });
    reducedMotion.addEventListener?.('change', event => { if (event.matches) clearEntrance(); });

    const page = location.pathname.split('/').pop().toLowerCase();
    if ((page === '' || page === 'index.html') && !document.hidden && !reducedMotion.matches) {
        // If session storage is unavailable, skip autoplay instead of repeating on reload.
        try {
            if (!sessionStorage.getItem(seenKey)) {
                sessionStorage.setItem(seenKey, '1');
                openEntrance();
            }
        } catch {}
    }
})();
