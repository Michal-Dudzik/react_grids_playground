import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { IntlProvider } from 'react-intl';
import { L10n, loadCldr, setCulture, setCurrencyCode } from '@syncfusion/ej2-base';
import likelySubtags from 'cldr-data/supplemental/likelySubtags.json';
import numberingSystems from 'cldr-data/supplemental/numberingSystems.json';
import currencyData from 'cldr-data/supplemental/currencyData.json';
import weekData from 'cldr-data/supplemental/weekData.json';
import enNumbers from 'cldr-data/main/en/numbers.json';
import enCurrencies from 'cldr-data/main/en/currencies.json';
import enCaGregorian from 'cldr-data/main/en/ca-gregorian.json';
import enTimeZoneNames from 'cldr-data/main/en/timeZoneNames.json';
import plNumbers from 'cldr-data/main/pl/numbers.json';
import plCurrencies from 'cldr-data/main/pl/currencies.json';
import plCaGregorian from 'cldr-data/main/pl/ca-gregorian.json';
import plTimeZoneNames from 'cldr-data/main/pl/timeZoneNames.json';
import { appMessages, syncfusionMessages } from './i18nMessages';

const LocaleContext = createContext(null);
const storageKey = 'react-grids-playground-locale';
const loadedCldrLocales = new Set();

const localeConfigs = {
  'en-US': {
    cldr: [enNumbers, enCurrencies, enCaGregorian, enTimeZoneNames],
    currency: 'USD',
    syncfusionCulture: 'en',
  },
  'pl-PL': {
    cldr: [plNumbers, plCurrencies, plCaGregorian, plTimeZoneNames],
    currency: 'PLN',
    syncfusionCulture: 'pl',
  },
};

L10n.load(syncfusionMessages);

function normalizeLocale(locale) {
  return String(locale ?? '').toLowerCase().startsWith('pl') ? 'pl-PL' : 'en-US';
}

function getInitialLocale() {
  if (typeof window === 'undefined') {
    return 'en-US';
  }

  const savedLocale = window.localStorage.getItem(storageKey);

  if (savedLocale === 'en-US' || savedLocale === 'pl-PL') {
    return savedLocale;
  }

  return normalizeLocale(window.navigator.language);
}

export function initSyncfusionLocale(locale) {
  const normalizedLocale = normalizeLocale(locale);
  const config = localeConfigs[normalizedLocale] ?? localeConfigs['en-US'];

  if (!loadedCldrLocales.has(normalizedLocale)) {
    loadCldr(likelySubtags, numberingSystems, currencyData, weekData, ...config.cldr);
    loadedCldrLocales.add(normalizedLocale);
  }

  setCulture(config.syncfusionCulture);
  setCurrencyCode(config.currency);
}

export function AppLocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    const initialLocale = getInitialLocale();
    initSyncfusionLocale(initialLocale);
    return initialLocale;
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, locale);
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale: (nextLocale) => {
        const normalizedLocale = normalizeLocale(nextLocale);
        initSyncfusionLocale(normalizedLocale);
        setLocaleState(normalizedLocale);
      },
      toggleLocale: () => {
        const normalizedLocale = locale === 'pl-PL' ? 'en-US' : 'pl-PL';
        initSyncfusionLocale(normalizedLocale);
        setLocaleState(normalizedLocale);
      },
    }),
    [locale],
  );

  return (
    <LocaleContext.Provider value={value}>
      <IntlProvider
        key={locale}
        defaultLocale="en-US"
        locale={locale}
        messages={appMessages[locale] ?? appMessages['en-US']}
      >
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}

export function useAppLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error('useAppLocale must be used within AppLocaleProvider.');
  }

  return context;
}
