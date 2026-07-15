import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from 'react';
import { defaultGridComponents } from '../components/GridComponents';
import type { GridColumnPreferencesAdapter, GridComponents, GridProviderValue, GridThemeTokens } from '../types';

const GridConfigContext = createContext<GridProviderValue>({});

export interface GridProviderProps extends GridProviderValue {
  children?: ReactNode;
}

const themeTokenToCssVariable: Record<keyof GridThemeTokens, `--${string}`> = {
  accent: '--ts-grid-accent',
  accentSoft: '--ts-grid-accent-soft',
  accentStrong: '--ts-grid-accent-strong',
  background: '--ts-grid-bg',
  border: '--ts-grid-border',
  borderStrong: '--ts-grid-border-strong',
  danger: '--ts-grid-danger',
  info: '--ts-grid-info',
  rowAltBackground: '--grid-row-alt-bg',
  shadow: '--ts-grid-shadow-md',
  success: '--ts-grid-success',
  surface: '--ts-grid-surface',
  surfaceMuted: '--ts-grid-surface-muted',
  text: '--ts-grid-text',
  textMuted: '--ts-grid-text-muted',
  warning: '--ts-grid-warning',
};

export function mergeGridComponents(
  providerComponents?: GridComponents,
  propComponents?: GridComponents,
): Required<GridComponents> {
  return {
    ...defaultGridComponents,
    ...(providerComponents ?? {}),
    ...(propComponents ?? {}),
  };
}

export function mergeColumnPreferences(
  providerPreferences?: GridColumnPreferencesAdapter,
  overridePreferences?: GridColumnPreferencesAdapter,
): GridColumnPreferencesAdapter {
  const provider = providerPreferences ?? {};
  const overrides = overridePreferences ?? {};
  const merged: GridColumnPreferencesAdapter = {};
  const load = overrides.load ?? provider.load;
  const save = overrides.save ?? provider.save;
  const reset = overrides.reset ?? provider.reset;

  if (typeof load === 'function') {
    merged.load = load;
  }
  if (typeof save === 'function') {
    merged.save = save;
  }
  if (typeof reset === 'function') {
    merged.reset = reset;
  }

  return merged;
}

export function buildGridThemeStyle(themeTokens?: GridThemeTokens): CSSProperties | undefined {
  if (!themeTokens) {
    return undefined;
  }

  const style = Object.entries(themeTokens).reduce<Record<string, string>>((currentStyle, [tokenKey, tokenValue]) => {
    if (!tokenValue) {
      return currentStyle;
    }

    const cssVariable = themeTokenToCssVariable[tokenKey as keyof GridThemeTokens];

    if (cssVariable) {
      currentStyle[cssVariable] = tokenValue;
    }

    return currentStyle;
  }, {});

  return Object.keys(style).length > 0 ? (style as CSSProperties) : undefined;
}

export function GridProvider({ children, ...value }: GridProviderProps) {
  const contextValue = useMemo(
    () => ({
      ...value,
      columnPreferences: value.columnPreferences,
      components: {
        ...(value.components ?? {}),
      },
      defaults: {
        ...(value.defaults ?? {}),
      },
      labels: {
        ...(value.labels ?? {}),
      },
      themeTokens: {
        ...(value.themeTokens ?? {}),
      },
    }),
    [
      value.columnPreferences,
      value.components,
      value.defaults,
      value.formatMessage,
      value.labels,
      value.locale,
      value.themeTokens,
    ],
  );

  return <GridConfigContext.Provider value={contextValue}>{children}</GridConfigContext.Provider>;
}

export function useGridConfig(): GridProviderValue {
  return useContext(GridConfigContext);
}
