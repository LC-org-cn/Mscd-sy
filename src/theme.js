export const THEME_MODES = [
    { id: 'auto', label: '跟随系统' },
    { id: 'light', label: '日间' },
    { id: 'dark', label: '夜间' },
];

export const THEME_VAR_NAMES = [
    '--bg-top', '--bg-side', '--bg-player', '--bg-input', '--bg-menu', '--bg-float',
    '--bg-overlay', '--bg-surface', '--bg-surface-hover', '--bg-subtle', '--bg-cover', '--bg-wipe',
    '--text-primary', '--text-secondary', '--text-tertiary',
    '--border', '--border-strong', '--border-faint', '--fill-light',
    '--hover-bg', '--progress-track', '--progress-track-hover',
    '--range-track', '--overlay-cover', '--overlay-detail',
    '--fill', '--border-line', '--hover-text',
    '--scrollbar-thumb', '--scrollbar-thumb-hover', '--scrim',
    '--waveform', '--success', '--warning', '--danger', '--info',
    '--tree-bg-2', '--tree-bg-3',
];

const DARK_QUERY = '(prefers-color-scheme: dark)';

let darkQuery = null;

function getDarkQuery() {
    if (darkQuery !== null) return darkQuery;
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    darkQuery = window.matchMedia(DARK_QUERY);
    return darkQuery;
}

export function prefersDark() {
    const q = getDarkQuery();
    return q ? q.matches : false;
}

export function onSystemThemeChange(handler) {
    const q = getDarkQuery();
    if (!q) return;
    if (typeof q.addEventListener === 'function') {
        q.addEventListener('change', handler);
    } else if (typeof q.addListener === 'function') {
        q.addListener(handler);
    }
}

/** 'auto' follows the OS; 'light' and 'dark' are pinned. */
export function resolveMode(mode) {
    if (mode === 'light' || mode === 'dark') return mode;
    return prefersDark() ? 'dark' : 'light';
}

export function hexToRgb(hex) {
    let h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (h.length !== 6) return { r: 0, g: 0, b: 0 };
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function hexToHsl(hex) {
    const { r, g, b } = hexToRgb(hex);
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        else if (max === gn) h = ((bn - rn) / d + 2) / 6;
        else h = ((rn - gn) / d + 4) / 6;
    }
    return { h: h * 360, s, l };
}

function hsl(h, s, l) {
    return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l)}%)`;
}

function hsla(h, s, l, a) {
    return `hsla(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l)}%, ${a})`;
}

function hslToHex(h, s, l) {
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
        const k = (n + h / 30) % 12;
        const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return '#' + f(0) + f(8) + f(4);
}

function pickOnColor(hex) {
    const { r, g, b } = hexToRgb(hex);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? '#1f2937' : '#ffffff';
}

export function generateThemeVars(themeHex, mode = 'auto') {
    const { h, s, l } = hexToHsl(themeHex);
    const resolved = resolveMode(mode);
    const isLight = resolved === 'light';

    // Lifts dark accents so they stay visible against dark surfaces, while
    // keeping enough contrast for the white text drawn on top of them.
    let accentHex = themeHex;
    if (!isLight && l < 0.5) {
        accentHex = hslToHex(h, Math.max(s, 0.4), 0.4);
    }

    const sBg = Math.min(0.42, Math.max(0.04, s * 0.55));
    const sText = Math.min(0.55, Math.max(0.06, s * 0.65));

    const hoverTextL = isLight ? 20 : 80;

    const accent = {
        '--fill': accentHex,
        '--border-line': accentHex,
        '--hover-text': isLight ? hslToHex(h, s, Math.min(l, 0.3)) : hsl(h, s, 88),
        '--on-accent': pickOnColor(accentHex),
    };

    if (isLight) {
        return {
            ...accent,
            '--bg-top': hsla(h, sBg, 90, 0.92),
            '--bg-side': hsla(h, sBg, 85, 0.94),
            '--bg-player': hsla(h, sBg, 90, 0.92),
            '--bg-input': hsla(h, sBg * 0.8, 99, 0.75),
            '--bg-menu': hsl(h, sBg, 99),
            '--bg-float': hsl(h, sBg, 97),
            '--bg-overlay': hsla(h, sBg, 97, 0.9),
            '--bg-surface': hsl(h, sBg, 99),
            '--bg-surface-hover': hsl(h, sBg, 100),
            '--bg-subtle': hsla(h, sBg, 0, 0.03),
            '--bg-cover': hsl(h, sBg, 88),
            '--bg-wipe': hsl(h, sBg, 92),
            '--text-primary': hsl(h, sText * 0.55, 13),
            '--text-secondary': hsl(h, sText * 0.5, 40),
            '--text-tertiary': hsl(h, sText * 0.45, 52),
            '--border': hsl(h, sBg, 86),
            '--border-strong': hsl(h, sBg * 0.8, 55),
            '--border-faint': hsla(h, sBg, 0, 0.07),
            '--fill-light': hsl(h, sBg, 87),
            '--progress-track': hsla(h, sBg, 0, 0.1),
            '--progress-track-hover': hsla(h, sBg, 0, 0.16),
            '--range-track': hsla(h, sBg, 0, 0.14),
            '--overlay-cover': hsla(h, sBg, 0, 0.5),
            '--overlay-detail': hsla(h, sBg, 94, 0.75),
            '--scrollbar-thumb': hsl(h, 0, 83),
            '--scrollbar-thumb-hover': hsl(h, 0, 72),
            '--scrim': hsla(0, 0, 0, 0.45),
            '--waveform': '#000000',
            '--success': '#10b981',
            '--warning': '#f59e0b',
            '--danger': '#ef4444',
            '--info': '#3b82f6',
            '--tree-bg-2': hsla(h, sBg, 0, 0.025),
            '--tree-bg-3': hsla(h, sBg, 0, 0.05),
        };
    }

    return {
        ...accent,
        '--bg-top': hsla(h, sBg, 9, 0.94),
        '--bg-side': hsla(h, sBg, 3, 0.96),
        '--bg-player': hsla(h, sBg, 9, 0.94),
        '--bg-input': hsla(h, sBg, 22, 0.7),
        '--bg-menu': hsl(h, sBg, 10),
        '--bg-float': hsl(h, sBg, 18),
        '--bg-overlay': hsla(h, sBg, 13, 0.92),
        '--bg-surface': hsl(h, sBg, 15),
        '--bg-surface-hover': hsl(h, sBg, 19),
        '--bg-subtle': hsla(h, sBg, 100, 0.04),
        '--bg-cover': hsl(h, sBg, 22),
        '--bg-wipe': hsl(h, sBg, 14),
        '--text-primary': hsl(h, sText * 0.3, 96),
        '--text-secondary': hsl(h, sText * 0.5, 78),
        '--text-tertiary': hsl(h, sText * 0.6, 60),
        '--border': hsl(h, sBg, 25),
        '--border-strong': hsl(h, sBg * 0.9, 48),
        '--border-faint': hsla(h, sBg, 100, 0.08),
        '--fill-light': hsl(h, sBg, 22),
        '--progress-track': hsla(h, sBg, 100, 0.14),
        '--progress-track-hover': hsla(h, sBg, 100, 0.2),
        '--range-track': hsla(h, sBg, 100, 0.18),
        '--overlay-cover': hsla(h, sBg, 0, 0.6),
        '--overlay-detail': hsla(h, sBg, 8, 0.8),
        '--scrollbar-thumb': hsl(h, 0, 26),
        '--scrollbar-thumb-hover': hsl(h, 0, 36),
        '--scrim': hsla(h, sBg, 0, 0.6),
        '--waveform': hsl(h, sBg, 92),
        '--success': hsl(158, 0.64, 45),
        '--warning': hsl(38, 0.92, 55),
        '--danger': hsl(0, 0.84, 63),
        '--info': hsl(214, 0.9, 66),
        '--tree-bg-2': hsla(h, sBg, 100, 0.03),
        '--tree-bg-3': hsla(h, sBg, 100, 0.06),
    };
}

/*
 * Material Design 3 动态取色：以用户选择的种子色按 MD3 tonal 规则
 * 派生 primary / container / surface 全套变量（HSL 近似 tonal palette）。
 * 由 theme-manager 在 manifest accent.engine === 'md3' 时调用。
 */
export function generateMd3Vars(themeHex, mode = 'auto') {
    const { h, s } = hexToHsl(themeHex);
    const resolved = resolveMode(mode);
    const isLight = resolved === 'light';

    // 色度钳制：保留种子色特征，同时落在 MD3 视觉边界内
    // （地板值取低：MD3 对中性种子的 tonal palette 色度本就很低）
    const cP = Math.min(0.85, Math.max(0.08, s));         // primary 色度
    const cC = Math.min(0.60, Math.max(0.04, s * 0.45));  // container 色度
    const cN = Math.min(0.14, Math.max(0.008, s * 0.18)); // neutral 表面色度

    if (isLight) {
        const primary = hslToHex(h, cP, 0.40);
        return {
            '--md3-primary': primary,
            '--md3-on-primary': pickOnColor(primary),
            '--md3-primary-container': hslToHex(h, cC, 0.89),
            '--md3-on-primary-container': hslToHex(h, cC, 0.14),
            '--md3-secondary-container': hslToHex(h, cN, 0.88),
            '--md3-on-secondary-container': hslToHex(h, cN, 0.12),
            '--md3-error-container': '#f9dedc',
            '--md3-on-error-container': '#410e0b',
            '--md3-inverse-surface': hslToHex(h, cN, 0.20),
            '--md3-inverse-on-surface': hslToHex(h, cN, 0.95),
            '--md3-on-surface': hslToHex(h, cN, 0.12),
            '--md3-primary-hover': hsla(h, cP, 0.40, 0.10),

            '--fill': primary,
            '--border-line': primary,
            '--hover-text': primary,
            '--on-accent': pickOnColor(primary),
            '--on-accent-muted': 'rgba(255, 255, 255, 0.70)',
            '--on-accent-faint': 'rgba(255, 255, 255, 0.62)',
            '--fill-light': hsla(h, cP, 0.40, 0.10),
            '--selection-box-bg': hsla(h, cP, 0.40, 0.12),

            '--bg-page': hslToHex(h, cN, 0.985),
            '--bg-top': hslToHex(h, cN, 0.955),
            '--bg-side': hslToHex(h, cN, 0.965),
            '--bg-player': hslToHex(h, cN, 0.955),
            '--bg-input': hslToHex(h, cN, 0.90),
            '--bg-menu': hslToHex(h, cN, 0.925),
            '--bg-float': hslToHex(h, cN, 0.925),
            '--bg-overlay': hsla(h, cN, 0.925, 0.95),
            '--bg-surface': hslToHex(h, cN, 0.965),
            '--bg-surface-hover': hslToHex(h, cN, 0.945),
            '--bg-subtle': hsla(h, cN, 0.10, 0.04),
            '--bg-cover': hslToHex(h, cN, 0.90),
            '--bg-wipe': hslToHex(h, cN, 0.925),
            '--text-primary': hslToHex(h, cN, 0.10),
            '--text-secondary': hslToHex(h, cN, 0.28),
            '--text-tertiary': hslToHex(h, cN, 0.46),
            '--border': hslToHex(h, cN, 0.78),
            '--border-strong': hslToHex(h, cN, 0.46),
            '--border-faint': hsla(h, cN, 0.78, 0.5),
            '--hover-bg': hsla(h, cN, 0.10, 0.08),
            '--progress-track': hsla(h, cN, 0.10, 0.10),
            '--progress-track-hover': hsla(h, cN, 0.10, 0.16),
            '--range-track': hsla(h, cN, 0.10, 0.12),
            '--overlay-detail': hsla(h, cN, 0.985, 0.72),
            '--waveform': hslToHex(h, cN, 0.10),
            '--scrollbar-thumb': hslToHex(h, cN, 0.78),
            '--scrollbar-thumb-hover': hslToHex(h, cN, 0.46),
            '--scrim': 'rgba(0, 0, 0, 0.4)',
            '--shadow-color': 'rgba(0, 0, 0, 0.15)',
            '--tree-bg-2': hsla(h, cN, 0.10, 0.03),
            '--tree-bg-3': hsla(h, cN, 0.10, 0.06),
        };
    }

    const primary = hslToHex(h, cP, 0.80);
    const onPrimary = hslToHex(h, Math.max(cP * 0.7, 0.15), 0.22);
    return {
        '--md3-primary': primary,
        '--md3-on-primary': onPrimary,
        '--md3-primary-container': hslToHex(h, cP, 0.32),
        '--md3-on-primary-container': hslToHex(h, cC, 0.90),
        '--md3-secondary-container': hslToHex(h, cN, 0.28),
        '--md3-on-secondary-container': hslToHex(h, cN, 0.88),
        '--md3-error-container': '#8c1d18',
        '--md3-on-error-container': '#f9dedc',
        '--md3-inverse-surface': hslToHex(h, cN, 0.90),
        '--md3-inverse-on-surface': hslToHex(h, cN, 0.15),
        '--md3-on-surface': hslToHex(h, cN, 0.92),
        '--md3-primary-hover': hsla(h, cP, 0.80, 0.10),

        '--fill': primary,
        '--border-line': primary,
        '--hover-text': primary,
        '--on-accent': onPrimary,
        '--on-accent-muted': hsla(h, cP, 0.22, 0.75),
        '--on-accent-faint': hsla(h, cP, 0.22, 0.70),
        '--fill-light': hsla(h, cP, 0.80, 0.10),
        '--selection-box-bg': hsla(h, cP, 0.80, 0.16),

        '--bg-page': hslToHex(h, cN, 0.07),
        '--bg-top': hslToHex(h, cN, 0.13),
        '--bg-side': hslToHex(h, cN, 0.10),
        '--bg-player': hslToHex(h, cN, 0.13),
        '--bg-input': hslToHex(h, cN, 0.21),
        '--bg-menu': hslToHex(h, cN, 0.16),
        '--bg-float': hslToHex(h, cN, 0.16),
        '--bg-overlay': hsla(h, cN, 0.16, 0.95),
        '--bg-surface': hslToHex(h, cN, 0.10),
        '--bg-surface-hover': hslToHex(h, cN, 0.13),
        '--bg-subtle': hsla(h, cN, 0.90, 0.05),
        '--bg-cover': hslToHex(h, cN, 0.21),
        '--bg-wipe': hslToHex(h, cN, 0.13),
        '--text-primary': hslToHex(h, cN, 0.90),
        '--text-secondary': hslToHex(h, cN, 0.78),
        '--text-tertiary': hslToHex(h, cN, 0.58),
        '--border': hslToHex(h, cN, 0.28),
        '--border-strong': hslToHex(h, cN, 0.58),
        '--border-faint': hsla(h, cN, 0.28, 0.6),
        '--hover-bg': hsla(h, cN, 0.90, 0.08),
        '--progress-track': hsla(h, cN, 0.90, 0.14),
        '--progress-track-hover': hsla(h, cN, 0.90, 0.2),
        '--range-track': hsla(h, cN, 0.90, 0.18),
        '--overlay-detail': hsla(h, cN, 0.07, 0.8),
        '--waveform': hslToHex(h, cN, 0.90),
        '--scrollbar-thumb': hslToHex(h, cN, 0.28),
        '--scrollbar-thumb-hover': hslToHex(h, cN, 0.45),
        '--scrim': 'rgba(0, 0, 0, 0.6)',
        '--shadow-color': 'rgba(0, 0, 0, 0.45)',
        '--tree-bg-2': hsla(h, cN, 0.90, 0.04),
        '--tree-bg-3': hsla(h, cN, 0.90, 0.08),
    };
}

export function applyThemeVars(vars) {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(vars)) {
        root.style.setProperty(k, v);
    }
}

const PAGE_BG = { light: '#f0f0f0', dark: '#171717' };

export function applyColorScheme(mode) {
    const resolved = resolveMode(mode);
    const root = document.documentElement;
    root.style.setProperty('color-scheme', resolved);
    root.style.setProperty('--bg-page', PAGE_BG[resolved]);
}

export function clearThemeVars() {
    const root = document.documentElement;
    for (const name of THEME_VAR_NAMES) {
        root.style.removeProperty(name);
    }
    applyColorScheme('light');
}