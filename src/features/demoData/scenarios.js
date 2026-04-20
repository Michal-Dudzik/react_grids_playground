import { demoRows } from './rows';

export const demoDataSets = {
  default: demoRows,
  topPerformers: demoRows.filter((row) => row.status === 'Live'),
  reviewQueue: demoRows.filter((row) => row.status === 'Review'),
  drafts: demoRows.filter((row) => row.status === 'Draft'),
  empty: [],
};

export const demoDataScenarios = Object.keys(demoDataSets);
