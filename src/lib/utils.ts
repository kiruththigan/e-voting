export function isValidAadhar(aadhar: string): boolean {
    return /^\d{12}$/.test(aadhar);
}
export function isValidAge(age: number, minAge: number = 18): boolean {
    return age >= minAge;
}


export function normalizePartyName(party: string): string {
    return party.trim().toLowerCase();
}


export function isOTPExpired(otpExpires: Date): boolean {
    return new Date() > new Date(otpExpires);
}
