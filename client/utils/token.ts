export const getUserIdFromToken = (token: string | null): number | null => {
    if (!token) return null;
    try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = atob(payloadBase64);
        const payload = JSON.parse(decodedPayload);
        return payload.id || null;
    } catch (error) {
        console.error("Failed to decode token:", error);
        return null;
    }
};