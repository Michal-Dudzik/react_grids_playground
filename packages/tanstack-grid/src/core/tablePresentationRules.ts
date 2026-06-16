import type { GridPresentationRule } from '../types';
import {
  decorationAccentColors,
  defaultPresentationRules,
  presentationRuleCellDisplays,
  presentationRuleDecorations,
  presentationRuleOperators,
  presentationRuleTargets,
} from './tableConfig';
import { parseCurrency } from './tableAggregation';

export function cloneDefaultPresentationRules(): GridPresentationRule[] {
  return defaultPresentationRules.map((rule) => ({ ...rule })) as GridPresentationRule[];
}

export function createPresentationRule(overrides: Partial<GridPresentationRule> = {}): GridPresentationRule {
  const ruleId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `presentation-rule-${Date.now()}`;

  return {
    id: ruleId,
    name: 'New rule',
    enabled: true,
    target: 'cell',
    field: 'status',
    operator: 'equals',
    value: 'Live',
    decoration: 'info',
    backgroundColor: '',
    cellDisplay: 'value',
    textColor: '',
    ...overrides,
  } as GridPresentationRule;
}

export function normalizeColorValue(value: unknown): string {
  return /^#[0-9a-f]{6}$/i.test(String(value ?? '')) ? String(value) : '';
}

export function normalizePresentationRule(rule: unknown, index = 0): GridPresentationRule {
  const source = rule as Partial<GridPresentationRule> | null | undefined;
  const target = presentationRuleTargets.has(source?.target) ? source.target : 'cell';
  const operator = presentationRuleOperators.has(source?.operator) ? source.operator : 'equals';
  const decoration = presentationRuleDecorations.has(source?.decoration) ? source.decoration : 'info';
  const cellDisplay = presentationRuleCellDisplays.has(source?.cellDisplay) ? source.cellDisplay : 'value';

  return {
    id: source?.id ?? `presentation-rule-${index}`,
    name: String(source?.name || `Rule ${index + 1}`),
    enabled: source?.enabled !== false,
    target,
    field: String(source?.field || 'status'),
    operator: target === 'header' ? 'equals' : operator,
    value: String(source?.value ?? ''),
    decoration,
    backgroundColor: normalizeColorValue(source?.backgroundColor),
    cellDisplay: target === 'cell' ? cellDisplay : 'value',
    textColor: normalizeColorValue(source?.textColor),
  } as GridPresentationRule;
}

export function normalizePresentationRules(rules: unknown): GridPresentationRule[] {
  if (!Array.isArray(rules)) {
    return cloneDefaultPresentationRules();
  }

  return rules.map((rule, index) => normalizePresentationRule(rule, index));
}

export function getCellValue(row, columnId) {
  return row?.original?.[columnId] ?? '';
}

export function matchesPresentationRule(rule, { columnId, row, target }) {
  if (!rule.enabled || rule.target !== target) {
    return false;
  }

  if (target === 'header') {
    return rule.field === columnId;
  }

  if (!row) {
    return false;
  }

  if (target === 'cell' && rule.field !== columnId) {
    return false;
  }

  const actualValue = String(getCellValue(row, rule.field) ?? '').trim();
  const expectedValue = String(rule.value ?? '').trim();
  const normalizedActual = actualValue.toLowerCase();
  const normalizedExpected = expectedValue.toLowerCase();

  switch (rule.operator) {
    case 'equals':
      return normalizedActual === normalizedExpected;
    case 'notEquals':
      return normalizedActual !== normalizedExpected;
    case 'startsWith':
      return normalizedActual.startsWith(normalizedExpected);
    case 'endsWith':
      return normalizedActual.endsWith(normalizedExpected);
    case 'greaterThan':
      return parseCurrency(actualValue) > parseCurrency(expectedValue);
    case 'lessThan':
      return parseCurrency(actualValue) < parseCurrency(expectedValue);
    case 'empty':
      return actualValue.length === 0;
    case 'notEmpty':
      return actualValue.length > 0;
    case 'contains':
    default:
      return normalizedActual.includes(normalizedExpected);
  }
}

export function getMatchingPresentationRule(rules, context) {
  return rules.find((rule) => matchesPresentationRule(rule, context));
}

export function getPresentationClassName(target, rule) {
  return rule ? `tanstack-grid__presentation-${target}--${rule.decoration}` : '';
}

export function getPresentationTooltip(rule) {
  return rule ? `Presentation rule: ${rule.name}` : undefined;
}

export function getPresentationStyle(rule) {
  if (!rule) {
    return {};
  }

  return {
    ...(rule.backgroundColor ? { backgroundColor: rule.backgroundColor } : {}),
    ...(rule.textColor ? { color: rule.textColor } : {}),
  };
}

export function getPresentationAccent(rule) {
  return rule?.textColor || decorationAccentColors[rule?.decoration] || 'var(--accent)';
}

export function isTruthyDisplayValue(value) {
  return ['1', 'true', 'yes', 'y'].includes(String(value ?? '').trim().toLowerCase());
}
