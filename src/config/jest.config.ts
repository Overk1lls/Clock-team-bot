import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    verbose: true,
    preset: 'ts-jest',
    transform: {},
    extensionsToTreatAsEsm: ['.ts'],
    globals: {
        'ts-jest': {
            'useESM': true
        }
    },
    testEnvironment: 'node'
};

export default config;