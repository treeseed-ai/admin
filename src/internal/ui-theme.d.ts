export type ThemePreference = {
  scheme: string;
  mode: 'light' | 'dark' | 'system';
};

export declare function normalizeThemePreference(input: unknown): ThemePreference;
