import { createTask, getRegionFromText, isStringIncluded } from '../lib/utils';

describe('Util Functions Test', () => {
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
        const interval2 = createTask(
            1000,
            (inc: number) => {
                inc++;
                if (inc === 1) {
                    clearInterval(interval2);
                }
            },
            num
        );

        expect(interval?.hasRef()).toBeTruthy();
        expect(interval2?.hasRef()).toBeTruthy();
    });

    it('Is String Included Test', () => {
        enum Enumerator {
            ONE = '1',
            TWO = '2',
            THREE = '3',
        }
        const str = '1';

        const isIncluded = isStringIncluded(Enumerator, str);
        const isIncludedTwo = isStringIncluded(Enumerator, '4');

        expect(isIncluded).toBeTruthy();
        expect(isIncludedTwo).toBeFalsy();
    });
});
