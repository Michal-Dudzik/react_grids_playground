import { demoRows } from './rows';
import { demoDataScenarios, demoDataSets } from './scenarios';

export { demoRows, demoDataScenarios, demoDataSets };

export function getDemoRows(scenario = 'default') {
  return demoDataSets[scenario] ?? demoDataSets.default;
}
