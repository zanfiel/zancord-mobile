import { VdThemeInfo } from "@lib/addons/themes";
import { removeCacheFile } from "./fs";

// @ts-ignore
const pyonLoaderIdentity = globalThis.__PYON_LOADER__;
// @ts-ignore
const zancordLoaderIdentity = globalThis.__vendetta_loader;

export interface ZancordLoaderIdentity {
    name: string;
    features: {
        loaderConfig?: boolean;
        devtools?: {
            prop: string;
            version: string;
        },
        themes?: {
            prop: string;
        };
    };
}

export function isZancordLoader() {
    return zancordLoaderIdentity != null;
}

export function isPyonLoader() {
    return pyonLoaderIdentity != null;
}

function polyfillZancordLoaderIdentity() {
    if (!isPyonLoader() || isZancordLoader()) return null;

    const loader = {
        name: pyonLoaderIdentity.loaderName,
        features: {} as Record<string, any>
    };

    if (isLoaderConfigSupported()) loader.features.loaderConfig = true;
    if (isSysColorsSupported()) {
        loader.features.syscolors = {
            prop: "__vendetta_syscolors"
        };

        Object.defineProperty(globalThis, "__vendetta_syscolors", {
            get: () => getSysColors(),
            configurable: true
        });
    }
    if (isThemeSupported()) {
        loader.features.themes = {
            prop: "__vendetta_theme"
        };

        Object.defineProperty(globalThis, "__vendetta_theme", {
            // get: () => getStoredTheme(),
            get: () => {
                // PyonXposed only returns keys it parses, making custom keys like Themes+' to gone
                const id = getStoredTheme()?.id;
                if (!id) return null;

                const { themes } = require("@lib/addons/themes");
                return themes[id] ?? getStoredTheme() ?? null;
            },
            configurable: true
        });
    }

    Object.defineProperty(globalThis, "__vendetta_loader", {
        get: () => loader,
        configurable: true
    });

    return loader as ZancordLoaderIdentity;
}

export function getLoaderIdentity() {
    if (isPyonLoader()) {
        return pyonLoaderIdentity;
    } else if (isZancordLoader()) {
        return getZancordLoaderIdentity();
    }

    return null;
}

export function getZancordLoaderIdentity(): ZancordLoaderIdentity | null {
    // @ts-ignore
    if (globalThis.__vendetta_loader) return globalThis.__vendetta_loader;
    return polyfillZancordLoaderIdentity();
}

// add to __vendetta_loader anyway
getZancordLoaderIdentity();

export function getLoaderName() {
    if (isPyonLoader()) return pyonLoaderIdentity.loaderName;
    else if (isZancordLoader()) return zancordLoaderIdentity.name;

    return "Unknown";
}

export function getLoaderVersion(): string | null {
    if (isPyonLoader()) return pyonLoaderIdentity.loaderVersion;
    return null;
}

export function isLoaderConfigSupported() {
    if (isPyonLoader()) {
        return true;
    } else if (isZancordLoader()) {
        return zancordLoaderIdentity!!.features.loaderConfig;
    }

    return false;
}

export function isThemeSupported() {
    if (isPyonLoader()) {
        return pyonLoaderIdentity.hasThemeSupport;
    } else if (isZancordLoader()) {
        return zancordLoaderIdentity!!.features.themes != null;
    }

    return false;
}

export function getStoredTheme(): VdThemeInfo | null {
    if (isPyonLoader()) {
        return pyonLoaderIdentity.storedTheme;
    } else if (isZancordLoader()) {
        const themeProp = zancordLoaderIdentity!!.features.themes?.prop;
        if (!themeProp) return null;
        // @ts-ignore
        return globalThis[themeProp] || null;
    }

    return null;
}

export function getThemeFilePath() {
    if (isPyonLoader()) {
        return "zancord/current-theme.json";
    } else if (isZancordLoader()) {
        return "zancord_theme.json";
    }

    return null;
}

export function isReactDevToolsPreloaded() {
    if (isPyonLoader()) {
        return Boolean(window.__REACT_DEVTOOLS__);
    }
    if (isZancordLoader()) {
        return zancordLoaderIdentity!!.features.devtools != null;
    }

    return false;
}

export function getReactDevToolsProp(): string | null {
    if (!isReactDevToolsPreloaded()) return null;

    if (isPyonLoader()) {
        window.__zancord_rdt = window.__REACT_DEVTOOLS__.exports;
        return "__zancord_rdt";
    }

    if (isZancordLoader()) {
        return zancordLoaderIdentity!!.features.devtools!!.prop;
    }

    return null;
}

export function getReactDevToolsVersion() {
    if (!isReactDevToolsPreloaded()) return null;

    if (isPyonLoader()) {
        return window.__REACT_DEVTOOLS__.version || null;
    }
    if (isZancordLoader()) {
        return zancordLoaderIdentity!!.features.devtools!!.version;
    }

    return null;
}

export function isSysColorsSupported() {
    if (isPyonLoader()) return pyonLoaderIdentity.isSysColorsSupported;
    else if (isZancordLoader()) {
        return zancordLoaderIdentity!!.features.syscolors != null;
    }

    return false;
}

export function getSysColors() {
    if (!isSysColorsSupported()) return null;
    if (isPyonLoader()) {
        return pyonLoaderIdentity.sysColors;
    } else if (isZancordLoader()) {
        return zancordLoaderIdentity!!.features.syscolors!!.prop;
    }

    return null;
}

export function getLoaderConfigPath() {
    if (isPyonLoader()) {
        return "zancord/loader.json";
    } else if (isZancordLoader()) {
        return "zancord_loader.json";
    }

    return "loader.json";
}

export function isFontSupported() {
    if (isPyonLoader()) return pyonLoaderIdentity.fontPatch === 2;

    return false;
}

export async function clearBundle() {
    // TODO: This should be not be hardcoded, maybe put in loader.json?
    return void await removeCacheFile("bundle.js");
}