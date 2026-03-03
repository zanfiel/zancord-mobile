import { createFileBackend, createMMKVBackend, createStorage, wrapSync } from "@core/vendetta/storage";
import { getLoaderConfigPath } from "@lib/api/native/loader";

export interface Settings {
    debuggerUrl: string;
    enableAutoDebugger?: boolean;
    developerSettings: boolean;
    enableDiscordDeveloperSettings: boolean;
    safeMode?: {
        enabled: boolean;
        currentThemeId?: string;
    };
    enableEvalCommand?: boolean;
}

export interface LoaderConfig {
    customLoadUrl: {
        enabled: boolean;
        url: string;
    };
    loadReactDevTools: boolean;
}

export const settings = wrapSync(createStorage<Settings>(createMMKVBackend("ZANCORD_SETTINGS")));

export const loaderConfig = wrapSync(createStorage<LoaderConfig>(
    createFileBackend(getLoaderConfigPath(), {
        customLoadUrl: {
            enabled: false,
            url: "http://localhost:4040/zancord.js"
        }
    })
));
