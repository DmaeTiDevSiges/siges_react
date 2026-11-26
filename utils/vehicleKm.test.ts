import { needsKmConfirmation } from './vehicleKm';

describe('needsKmConfirmation', () => {
    it('pede confirmação só acima de 50 km', () => {
        expect(needsKmConfirmation(117779, 117914)).toBe(true);
        expect(needsKmConfirmation(100, 151)).toBe(true);
        expect(needsKmConfirmation(100, 150)).toBe(false);
    });
    it('final zero, vazio ou sem inicial não pede', () => {
        expect(needsKmConfirmation(100, 0)).toBe(false);
        expect(needsKmConfirmation(100, null)).toBe(false);
        expect(needsKmConfirmation(undefined, 900)).toBe(false);
    });
});
