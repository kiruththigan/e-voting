import { isValidAadhar, isValidAge, normalizePartyName, isOTPExpired } from '@/lib/utils';

describe('Utility Functions', () => {
    describe('isValidAadhar', () => {
        it('should return true for valid 12-digit Aadhar', () => {
            expect(isValidAadhar('123456789012')).toBe(true);
        });

        it('should return false for Aadhar with less than 12 digits', () => {
            expect(isValidAadhar('12345')).toBe(false);
        });

        it('should return false for Aadhar with more than 12 digits', () => {
            expect(isValidAadhar('1234567890123')).toBe(false);
        });

        it('should return false for Aadhar with non-numeric characters', () => {
            expect(isValidAadhar('12345678901a')).toBe(false);
        });
    });

    describe('isValidAge', () => {
        it('should return true for age 18 or above', () => {
            expect(isValidAge(18)).toBe(true);
            expect(isValidAge(25)).toBe(true);
        });

        it('should return false for age below 18', () => {
            expect(isValidAge(17)).toBe(false);
            expect(isValidAge(10)).toBe(false);
        });

        it('should respect custom minimum age', () => {
            expect(isValidAge(24, 25)).toBe(false);
            expect(isValidAge(25, 25)).toBe(true);
        });
    });

    describe('normalizePartyName', () => {
        it('should trim and lowercase party name', () => {
            expect(normalizePartyName('  BJP  ')).toBe('bjp');
            expect(normalizePartyName('Congress')).toBe('congress');
        });

        it('should handle already normalized names', () => {
            expect(normalizePartyName('aap')).toBe('aap');
        });
    });

    describe('isOTPExpired', () => {
        it('should return true for expired OTP', () => {
            const pastDate = new Date(Date.now() - 1000); // 1 second ago
            expect(isOTPExpired(pastDate)).toBe(true);
        });

        it('should return false for valid OTP', () => {
            const futureDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
            expect(isOTPExpired(futureDate)).toBe(false);
        });
    });
});
