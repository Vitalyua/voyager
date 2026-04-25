import {ContainerSpec} from './temperature-chart.types';

export const CONTAINER_PRESETS: Record<string, ContainerSpec> = {
    vaQMed21Standard:   {name: 'va-Q-med 21 Standard',   budgetKelvinHours: 820,  tauHours: 5,  initialInsideTemp: 3, targetRange: {min: 2, max: 8}},
    vaQMed21Premium:    {name: 'va-Q-med 21 Premium',    budgetKelvinHours: 1000, tauHours: 6,  initialInsideTemp: 3, targetRange: {min: 2, max: 8}},
    vaQProof23Standard: {name: 'va-Q-proof 23 Standard', budgetKelvinHours: 2900, tauHours: 8,  initialInsideTemp: 3, targetRange: {min: 2, max: 8}},
    vaQProof23Premium:  {name: 'va-Q-proof 23 Premium',  budgetKelvinHours: 3600, tauHours: 10, initialInsideTemp: 3, targetRange: {min: 2, max: 8}},
    vaQOne74:           {name: 'va-Q-one 74',            budgetKelvinHours: 3450, tauHours: 9,  initialInsideTemp: 3, targetRange: {min: 2, max: 8}},
    vaQTainerEUROx:     {name: 'va-Q-tainer EUROx',      budgetKelvinHours: 3260, tauHours: 24, initialInsideTemp: 3, targetRange: {min: 2, max: 8}},
};
