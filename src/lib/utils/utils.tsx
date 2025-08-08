export const validatePhoneNumber = (phone: string) => {
    return /^(09|\+639)\d{9}$/.test(phone);
}

export const guid = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
};

export const calculateAge = (birthdate: string) => {
    const today = new Date();
    const birthDate = new Date(birthdate);
    return today.getFullYear() - birthDate.getFullYear();
}