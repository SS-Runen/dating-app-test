export function tokenizeLocation(location: string | null): string[] {
    if (!location) return [];
    return location
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
}

export function calculateAge(birthdate: string) {
    const today = new Date();
    const birthDate = new Date(birthdate);
    return today.getFullYear() - birthDate.getFullYear();
}

export function validatePhoneNumber(phone: string) {
    return /^(09|\+639)\d{9}$/.test(phone);
}
