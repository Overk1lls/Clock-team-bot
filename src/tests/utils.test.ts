import { createTask, fetchAPI, getRegionFromText, isStringIncluded } from '../lib/utils';

jest.mock('node-fetch');

import fetch from 'node-fetch';

const { Response } = jest.requireActual('node-fetch');

describe('Util Functions Test', () => {
    it('FetchAPI Test', async () => {
        fetch.mockReturnValue(Promise.resolve(new Response(5)));
        
        const response = await fetchAPI('123');

        expect(fetch).toHaveBeenCalled();
        expect(response).toEqual(5);
    });

    it('Get Region From Text Test', () => {
        const text = ['!test', 'eu', 'test'];
        let region = getRegionFromText(text);

        expect(region).toBe('eu');

        text[1] = 'us';
        region = getRegionFromText(text);

        expect(region).toBe('us');
    });

    it('Create Task Test', () => {
        let inc = 0;
        const interval = createTask(
            1000,
            () => {
                inc++;
                if (inc === 1) {
                    clearInterval(interval);
                }
            }
        );

        const num = 0;
        const interval_2 = createTask(
            1000,
            (inc: number) => {
                inc++;
                if (inc === 1) {
                    clearInterval(interval_2);
                }
            },
            num
        );

        expect(interval?.hasRef()).toBeTruthy();
        expect(interval_2?.hasRef()).toBeTruthy();
    });

    it('Is String Included Test', () => {
        enum Enumerator {
            ONE = '1',
            TWO = '2',
            THREE = '3',
        };
        const str = '1';

        const isIncluded = isStringIncluded(Enumerator, str);
        const isIncludedTwo = isStringIncluded(Enumerator, '4');

        expect(isIncluded).toBeTruthy();
        expect(isIncludedTwo).toBeFalsy();
    });
});