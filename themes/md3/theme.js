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

/**
 * MD3 增强 II：
 * 1) range active 轨分色（--md3-range-val 百分比注入）
 * 2) MD3 tooltip（替代原生 title 白框：plain tooltip 4px 圆角、inverse-surface 底）
 */
(() => {
    if (window.__md3Enhance) return;
    window.__md3Enhance = true;

    const isMd3 = () => document.documentElement.getAttribute('data-theme') === 'md3';
    const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- range 分色 ---- */
    function paintRange(input) {
        const min = Number(input.min) || 0;
        const max = Number(input.max) || 100;
        const val = Number(input.value) || 0;
        const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
        input.style.setProperty('--md3-range-val', pct + '%');
    }

    function initRanges() {
        if (!isMd3()) return;
        document.querySelectorAll('.ena-range').forEach((el) => {
            paintRange(el);
            if (!el.__md3RangeBound) {
                el.__md3RangeBound = true;
                el.addEventListener('input', () => paintRange(el));
            }
        });
    }

    /* ---- MD3 tooltip ---- */
    let tipEl = null;
    let tipTimer = null;

    function getTip() {
        if (!tipEl) {
            tipEl = document.createElement('div');
            tipEl.className = 'md3-tooltip';
            tipEl.setAttribute('role', 'tooltip');
            document.body.appendChild(tipEl);
        }
        return tipEl;
    }

    function showTip(target) {
        const label = target.getAttribute('data-md3-tip') || target.getAttribute('title');
        if (!label) return;
        const tip = getTip();
        tip.textContent = label;
        tip.classList.add('is-visible');
        const rect = target.getBoundingClientRect();
        const tw = tip.offsetWidth;
        const th = tip.offsetHeight;
        let left = rect.left + rect.width / 2 - tw / 2;
        left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
        let top = rect.top - th - 6;
        if (top < 8) top = rect.bottom + 6;
        tip.style.left = left + 'px';
        tip.style.top = top + 'px';
    }

    function hideTip() {
        if (tipEl) tipEl.classList.remove('is-visible');
    }

    const TIP_DELAY_MS = 350;
    const TIP_SELECTOR = '.ena-btn[title], .player-play[title], .side-nav a[title], .song-row [title]';

    document.addEventListener('pointerover', (ev) => {
        if (!isMd3()) return;
        if (ev.pointerType === 'touch') return;
        const el = ev.target.closest && ev.target.closest(TIP_SELECTOR);
        if (!el) return;
        // 原生 title 抑制：转存后移除，浏览器不再弹原生白框
        const title = el.getAttribute('title');
        if (title) {
            el.setAttribute('data-md3-tip', title);
            el.removeAttribute('title');
        }
        if (reduced()) return;
        clearTimeout(tipTimer);
        tipTimer = setTimeout(() => showTip(el), TIP_DELAY_MS);
    }, { passive: true });

    document.addEventListener('pointerout', (ev) => {
        if (!tipEl) return;
        clearTimeout(tipTimer);
        hideTip();
    }, { passive: true });

    document.addEventListener('pointerdown', hideTip, { passive: true });
    window.addEventListener('blur', hideTip);
    window.addEventListener('scroll', hideTip, { passive: true });

    /* ---- 初始与视图变化时重刷 range ---- */
    const init = () => initRanges();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    // 视图挂载后（innerHTML 重建）重扫
    const mo = new MutationObserver(() => initRanges());
    mo.observe(document.documentElement, { childList: true, subtree: true });
})();
