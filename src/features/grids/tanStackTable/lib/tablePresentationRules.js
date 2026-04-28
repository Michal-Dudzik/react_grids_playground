import {
  decorationAccentColors,
  defaultPresentationRules,
  presentationRuleCellDisplays,
  presentationRuleDecorations,
  presentationRuleOperators,
  presentationRuleTargets,
  presentationRulesStateKey,
} from './tableConfig';
import { parseCurrency } from './tableAggregation';

export function cloneDefaultPresentationRules() {
  return defaultPresentationRules.map((rule) => ({ ...rule }));
}

export function createPresentationRule(overrides = {}) {
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
  };
}

export function normalizeColorValue(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value ?? '')) ? value : '';
}

export function normalizePresentationRule(rule, index = 0) {
  const target = presentationRuleTargets.has(rule?.target) ? rule.target : 'cell';
  const operator = presentationRuleOperators.has(rule?.operator) ? rule.operator : 'equals';
  const decoration = presentationRuleDecorations.has(rule?.decoration) ? rule.decoration : 'info';
  const cellDisplay = presentationRuleCellDisplays.has(rule?.cellDisplay) ? rule.cellDisplay : 'value';

  return {
    id: rule?.id ?? `presentation-rule-${index}`,
    name: String(rule?.name || `Rule ${index + 1}`),
    enabled: rule?.enabled !== false,
    target,
    field: String(rule?.field || 'status'),
    operator: target === 'header' ? 'equals' : operator,
    value: String(rule?.value ?? ''),
    decoration,
    backgroundColor: normalizeColorValue(rule?.backgroundColor),
    cellDisplay: target === 'cell' ? cellDisplay : 'value',
    textColor: normalizeColorValue(rule?.textColor),
  };
}

export function normalizePresentationRules(rules) {
  if (!Array.isArray(rules)) {
    return cloneDefaultPresentationRules();
  }

  return rules.map((rule, index) => normalizePresentationRule(rule, index));
}

export function readPresentationRules() {
  if (typeof window === 'undefined') {
    return cloneDefaultPresentationRules();
  }

  try {
    const storedRules = JSON.parse(window.localStorage.getItem(presentationRulesStateKey) ?? 'null');
    return storedRules === null ? cloneDefaultPresentationRules() : normalizePresentationRules(storedRules);
  } catch {
    return cloneDefaultPresentationRules();
  }
}

export function writePresentationRules(rules) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(presentationRulesStateKey, JSON.stringify(rules));
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
