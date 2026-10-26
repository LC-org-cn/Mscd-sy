/**
 * MD3 主题增强脚本：material-esm 同款涟漪引擎
 * 规范来源：material-esm/material internal/ripple/ripple.js
 *   - 按压 450ms 生长（decelerate）、松开 375ms 淡出
 *   - hover 状态层 8% / press 12%（CSS ::before，此处只做按压涟漪）
 *   - 触摸延迟 150ms（避免滚动误触）
 * 目标：保持 app 操作逻辑不变，只增强视觉反馈。
 */
(() => {
    if (window.__md3Ripple) return;
    window.__md3Ripple = true;

    const EASING = {
        STANDARD: 'cubic-bezier(0.2, 0, 0, 1)',
        DECELERATE: 'cubic-bezier(0, 0, 0, 1)',
    };
    const PRESS_GROW_MS = 450;
    const FADE_OUT_MS = 375;
    const TOUCH_DELAY_MS = 150;

    const SELECTOR = [
        '.ena-btn',
        '.theme-card',
        '.song-menu-item',
        '.account-menu__item',
        '.ena-dropdown__item',
        '.side-nav a',
        '.search-tab',
        '.task-filter__btn',
        '.pagination-page',
        '.view-switcher-item',
        '.theme-card__meta',
    ].join(', ');

    const isMd3 = () => document.documentElement.getAttribute('data-theme') === 'md3';
    const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function spawnRipple(el, x, y) {
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2.2;
        const startX = x - rect.left;
        const startY = y - rect.top;
        const endX = rect.width / 2;
        const endY = rect.height / 2;
        const dx = endX - startX;
        const dy = endY - startY;

        const ripple = document.createElement('span');
        ripple.className = 'md3-ripple-instance';
        ripple.setAttribute('aria-hidden', 'true');
        Object.assign(ripple.style, {
            position: 'absolute',
            left: (startX - size / 2) + 'px',
            top: (startY - size / 2) + 'px',
            width: size + 'px',
            height: size + 'px',
            borderRadius: '9999px',
            pointerEvents: 'none',
            background: 'currentColor',
            opacity: '.12',
            zIndex: '0',
            transform: 'translate(0, 0) scale(0)',
            transformOrigin: 'center',
        });
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative';

        el.appendChild(ripple);
        const grow = ripple.animate(
            [
                { transform: 'translate(0, 0) scale(0)', opacity: '.12' },
                { transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: '.12' },
            ],
            { duration: PRESS_GROW_MS, easing: EASING.DECELERATE, fill: 'forwards' }
        );
        grow.onfinish = () => {
            const fade = ripple.animate([{ opacity: '.12' }, { opacity: '0' }], {
                duration: FADE_OUT_MS,
                easing: 'linear',
                fill: 'forwards',
            });
            fade.onfinish = () => ripple.remove();
        };
    }

    let touchTimer = null;
    let touchFired = false;

    document.addEventListener('pointerdown', (ev) => {
        if (!isMd3() || reduced()) return;
        if (ev.pointerType === 'touch') {
            // material-esm 同款触摸延迟：滑动滚动不触发涟漪
            touchFired = false;
            touchTimer = setTimeout(() => {
                const el = ev.target.closest && ev.target.closest(SELECTOR);
                if (el) { spawnRipple(el, ev.clientX, ev.clientY); touchFired = true; }
            }, TOUCH_DELAY_MS);
            return;
        }
        const el = ev.target.closest && ev.target.closest(SELECTOR);
        if (el) spawnRipple(el, ev.clientX, ev.clientY);
    }, { passive: true });

    document.addEventListener('pointermove', () => {
        if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
    }, { passive: true });

    document.addEventListener('pointerup', () => {
        if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
    }, { passive: true });
})();
