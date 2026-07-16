import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { theme as antdTheme } from 'antd';
import type { ThemeConfig } from 'antd';

const STORAGE_DARK = 'dark-mode';
const STORAGE_ULTRA = 'isUltraDarkThemeEnabled';

function readBool(key: string, fallback: boolean): boolean {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  return raw === 'true';
}

function applyDom(isDark: boolean, isUltra: boolean) {
  document.body.setAttribute('class', isDark ? 'dark' : 'light');
  if (isUltra) {
    document.documentElement.setAttribute('data-theme', 'ultra-dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  const msg = document.getElementById('message');
  if (msg) msg.className = isDark ? 'dark' : 'light';
}

// module load so the document is in the right theme before React mounts.
const initialDark = readBool(STORAGE_DARK, true);
const initialUltra = readBool(STORAGE_ULTRA, false);
applyDom(initialDark, initialUltra);

const HACKER_GREEN = '#00ff66';
const HACKER_GREEN_HOVER = '#39ff8e';
const HACKER_GREEN_ACTIVE = '#00cc52';
const HACKER_FONT = "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const DARK_TOKENS = {
  colorBgBase: '#050705',
  colorBgLayout: '#050705',
  colorBgContainer: '#0a0f0a',
  colorBgElevated: '#0e150e',
  colorPrimary: HACKER_GREEN,
  colorPrimaryHover: HACKER_GREEN_HOVER,
  colorPrimaryActive: HACKER_GREEN_ACTIVE,
  colorLink: HACKER_GREEN,
  colorLinkHover: HACKER_GREEN_HOVER,
  colorInfo: HACKER_GREEN,
  fontFamily: HACKER_FONT,
};
const ULTRA_DARK_TOKENS = {
  colorBgBase: '#000',
  colorBgLayout: '#000',
  colorBgContainer: '#060906',
  colorBgElevated: '#0a0f0a',
  colorPrimary: HACKER_GREEN,
  colorPrimaryHover: HACKER_GREEN_HOVER,
  colorPrimaryActive: HACKER_GREEN_ACTIVE,
  colorLink: HACKER_GREEN,
  colorLinkHover: HACKER_GREEN_HOVER,
  colorInfo: HACKER_GREEN,
  fontFamily: HACKER_FONT,
};
const DARK_LAYOUT_TOKENS = {
  bodyBg: '#050705',
  headerBg: '#020402',
  headerColor: HACKER_GREEN,
  footerBg: '#050705',
  siderBg: '#020402',
  triggerBg: '#0a0f0a',
  triggerColor: HACKER_GREEN,
};
const ULTRA_DARK_LAYOUT_TOKENS = {
  bodyBg: '#000',
  headerBg: '#000',
  headerColor: HACKER_GREEN,
  footerBg: '#000',
  siderBg: '#000',
  triggerBg: '#060906',
  triggerColor: HACKER_GREEN,
};
const DARK_MENU_TOKENS = {
  darkItemBg: '#020402',
  darkSubMenuItemBg: '#050705',
  darkPopupBg: '#0a0f0a',
  darkItemSelectedBg: 'rgba(0, 255, 102, 0.12)',
  darkItemSelectedColor: HACKER_GREEN,
  darkItemHoverColor: HACKER_GREEN_HOVER,
};
const ULTRA_DARK_MENU_TOKENS = {
  darkItemBg: '#000',
  darkSubMenuItemBg: '#000',
  darkPopupBg: '#060906',
  darkItemSelectedBg: 'rgba(0, 255, 102, 0.12)',
  darkItemSelectedColor: HACKER_GREEN,
  darkItemHoverColor: HACKER_GREEN_HOVER,
};
const DARK_CARD_TOKENS = {
  colorBorderSecondary: 'rgba(0, 255, 102, 0.10)',
};
const ULTRA_DARK_CARD_TOKENS = {
  colorBorderSecondary: 'rgba(0, 255, 102, 0.08)',
};
const STATISTIC_TOKENS = {
  contentFontSize: 17,
  titleFontSize: 11,
};
const LIGHT_CONTRAST_TOKENS = {
  colorTextDescription: 'rgba(0, 0, 0, 0.58)',
  colorTextTertiary: 'rgba(0, 0, 0, 0.58)',
  colorTextPlaceholder: '#767676',
  colorError: '#cf1322',
  colorErrorText: '#cf1322',
  colorSuccessText: '#237804',
};
const LIGHT_BUTTON_TOKENS = {
  colorPrimary: '#0958d9',
  colorPrimaryHover: '#2468e5',
  colorPrimaryActive: '#073ea8',
};

export function buildAntdThemeConfig(isDark: boolean, isUltra: boolean): ThemeConfig {
  if (!isDark) {
    return {
      algorithm: antdTheme.defaultAlgorithm,
      token: LIGHT_CONTRAST_TOKENS,
      components: {
        Statistic: STATISTIC_TOKENS,
        Button: LIGHT_BUTTON_TOKENS,
      },
    };
  }
  return {
    algorithm: antdTheme.darkAlgorithm,
    token: isUltra ? ULTRA_DARK_TOKENS : DARK_TOKENS,
    components: {
      Layout: isUltra ? ULTRA_DARK_LAYOUT_TOKENS : DARK_LAYOUT_TOKENS,
      Menu: isUltra ? ULTRA_DARK_MENU_TOKENS : DARK_MENU_TOKENS,
      Card: isUltra ? ULTRA_DARK_CARD_TOKENS : DARK_CARD_TOKENS,
      Statistic: STATISTIC_TOKENS,
    },
  };
}

export function pauseAnimationsUntilLeave(elementId: string): void {
  document.documentElement.setAttribute('data-theme-animations', 'off');
  const el = document.getElementById(elementId);
  if (!el) return;
  const restore = () => {
    document.documentElement.removeAttribute('data-theme-animations');
    el.removeEventListener('mouseleave', restore);
    el.removeEventListener('touchend', restore);
  };
  el.addEventListener('mouseleave', restore);
  el.addEventListener('touchend', restore);
}

interface ThemeContextValue {
  isDark: boolean;
  isUltra: boolean;
  toggleTheme: () => void;
  toggleUltra: () => void;
  antdThemeConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(initialDark);
  const [isUltra, setIsUltra] = useState<boolean>(initialUltra);

  useEffect(() => {
    applyDom(isDark, isUltra);
    localStorage.setItem(STORAGE_DARK, String(isDark));
    localStorage.setItem(STORAGE_ULTRA, String(isUltra));
  }, [isDark, isUltra]);

  const toggleTheme = useCallback(() => setIsDark((v) => !v), []);
  const toggleUltra = useCallback(() => setIsUltra((v) => !v), []);

  const antdThemeConfig = useMemo(() => buildAntdThemeConfig(isDark, isUltra), [isDark, isUltra]);

  const value = useMemo<ThemeContextValue>(
    () => ({ isDark, isUltra, toggleTheme, toggleUltra, antdThemeConfig }),
    [isDark, isUltra, toggleTheme, toggleUltra, antdThemeConfig],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
