import {
    mergePresentationConfigs,
    normalizePresentationConfig,
} from "./presentationSchema.js";

export function loadPresentationConfig(storageKey, defaults = undefined) {
    const normalizedDefaults = normalizePresentationConfig(defaults);

    if (!storageKey || typeof window === "undefined" || !window.localStorage) {
        return normalizedDefaults;
    }

    try {
        const rawValue = window.localStorage.getItem(storageKey);
        if (!rawValue) {
            return normalizedDefaults;
        }

        return mergePresentationConfigs(normalizedDefaults, JSON.parse(rawValue));
    } catch (error) {
        console.warn("Failed to load grid presentation config", error);
        return normalizedDefaults;
    }
}

export function savePresentationConfig(storageKey, config) {
    const normalizedConfig = normalizePresentationConfig(config);

    if (!storageKey || typeof window === "undefined" || !window.localStorage) {
        return normalizedConfig;
    }

    try {
        window.localStorage.setItem(storageKey, JSON.stringify(normalizedConfig));
    } catch (error) {
        console.warn("Failed to save grid presentation config", error);
    }

    return normalizedConfig;
}

export function resetPresentationConfig(storageKey, defaults = undefined) {
    const normalizedDefaults = normalizePresentationConfig(defaults);

    if (!storageKey || typeof window === "undefined" || !window.localStorage) {
        return normalizedDefaults;
    }

    try {
        window.localStorage.removeItem(storageKey);
    } catch (error) {
        console.warn("Failed to reset grid presentation config", error);
    }

    return normalizedDefaults;
}
