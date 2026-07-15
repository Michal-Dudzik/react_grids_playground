import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import {
  enUS,
  GridProvider,
  plPL,
} from '@react-grids-playground/tanstack-grid';
import apiClient from '../api/apiClient';
import { useAppLocale } from './locale';

function getColumnPreferencesEndpoint({ appId, gridId, languageCode }) {
  const query = new URLSearchParams({
    appId: String(appId),
    gridId: String(gridId),
  });

  if (languageCode) {
    query.set('languageCode', languageCode);
  }

  return `/api/SysUserInfo/gridColumnsByUser?${query}`;
}

function requireGridIdentity(context) {
  if (context?.appId === undefined || context?.gridId === undefined) {
    throw new Error('Column preferences require both appId and gridId.');
  }
}

const portalColumnPreferences = {
  async load(context = {}) {
    requireGridIdentity(context);

    return apiClient.get(getColumnPreferencesEndpoint(context), {
      cache: true,
      cacheTTL: 5 * 60 * 1000,
      signal: context.signal,
    });
  },
  async reset(context = {}) {
    requireGridIdentity(context);
    const endpoint = getColumnPreferencesEndpoint(context);
    const response = await apiClient.delete(endpoint, { signal: context.signal });
    apiClient.clearCache(`gridColumnsByUser?appId=${context.appId}&gridId=${context.gridId}`);
    return response;
  },
  async save({ payload, ...context }) {
    requireGridIdentity(context);
    const endpoint = getColumnPreferencesEndpoint(context);
    const response = await apiClient.put(endpoint, payload, { signal: context.signal });
    apiClient.clearCache(`gridColumnsByUser?appId=${context.appId}&gridId=${context.gridId}`);
    return response;
  },
};

const portalThemeTokens = {
  accent: 'rgb(var(--color-button-accent, 182 84 60))',
  accentSoft: 'rgb(var(--color-button-accent, 182 84 60) / 0.14)',
  accentStrong: 'rgb(var(--color-button-accent-hover, 143 61 41))',
  background: 'rgb(var(--color-background-base, 245 241 232))',
  border: 'rgb(var(--color-border, 58 51 43) / 0.14)',
  borderStrong: 'rgb(var(--color-border, 58 51 43) / 0.24)',
  danger: 'rgb(var(--color-danger, 185 62 53))',
  info: 'rgb(var(--color-info, 62 114 168))',
  shadow: 'var(--shadow-md)',
  success: 'rgb(var(--color-success, 47 143 99))',
  surface: 'rgb(var(--color-background-default, 255 253 248))',
  surfaceMuted: 'rgb(var(--color-background-fill, 255 251 245) / 0.92)',
  text: 'rgb(var(--color-text-base, 35 29 24))',
  textMuted: 'rgb(var(--color-text-muted, 98 86 73))',
  warning: 'rgb(var(--color-warning, 197 127 37))',
};

function interpolateDefaultMessage(message, values) {
  if (!values) {
    return message;
  }

  return message.replace(/\{([^}]+)\}/g, (placeholder, key) =>
    Object.hasOwn(values, key) ? String(values[key]) : placeholder,
  );
}

export function PortalGridProvider({ children }) {
  const intl = useIntl();
  const { locale } = useAppLocale();
  const formatMessage = useCallback((descriptor, values) => {
    if (Object.hasOwn(intl.messages, descriptor.id)) {
      return intl.formatMessage(descriptor, values);
    }

    return interpolateDefaultMessage(descriptor.defaultMessage, values);
  }, [intl]);

  return (
    <GridProvider
      columnPreferences={portalColumnPreferences}
      formatMessage={formatMessage}
      labels={locale === 'pl-PL' ? plPL : enUS}
      locale={locale}
      themeTokens={portalThemeTokens}
    >
      {children}
    </GridProvider>
  );
}
