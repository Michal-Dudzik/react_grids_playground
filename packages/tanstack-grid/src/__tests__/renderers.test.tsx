import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  createBooleanRenderer,
  createDateRenderer,
  createNumberRenderer,
} from '../index';

const context = {
  column: {},
  columnId: 'value',
  renderHighlightedText: (value: unknown) => String(value ?? ''),
  row: {},
  value: undefined,
};

describe('neutral grid renderers', () => {
  it('renders boolean, date and number values without Syncfusion helpers', () => {
    const booleanMarkup = renderToStaticMarkup(createBooleanRenderer()({ ...context, value: 1 }));
    const dateMarkup = renderToStaticMarkup(createDateRenderer({ locale: 'pl-PL' })({
      ...context,
      value: '2026-07-15',
    }));
    const numberMarkup = renderToStaticMarkup(createNumberRenderer({
      locale: 'pl-PL',
      minimumFractionDigits: 2,
    })({ ...context, value: '1234.5' }));

    expect(booleanMarkup).toContain('✓');
    expect(dateMarkup).toContain('15.07.2026');
    expect(numberMarkup).toContain('1234,50');
  });

  it('rejects calendar-invalid ISO date-only strings', () => {
    const renderer = createDateRenderer({ locale: 'pl-PL' });
    const invalidMarkup = renderToStaticMarkup(renderer({
      ...context,
      value: '2026-02-30',
    }));

    expect(invalidMarkup).toBe('');
  });

  it('parses locale-formatted number strings using Intl separators', () => {
    const renderer = createNumberRenderer({
      locale: 'de-DE',
      minimumFractionDigits: 2,
    });

    const validMarkup = renderToStaticMarkup(renderer({
      ...context,
      value: '1.234,56',
    }));
    const invalidMarkup = renderToStaticMarkup(renderer({
      ...context,
      value: 'not-a-number',
    }));

    expect(validMarkup).toContain('1.234,56');
    expect(invalidMarkup).toBe('');
  });
});
