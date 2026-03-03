import { patcher } from "@lib/api";
import { registerCommand } from "@lib/api/commands";
import { createStorage } from "@lib/api/storage";
import { logger } from "@lib/utils/logger";

import { registeredPlugins } from ".";
import { ZancordPluginObject } from "./types";

type DisposableFn = (...props: any[]) => () => unknown;
function shimDisposableFn<F extends DisposableFn>(unpatches: (() => void)[], f: F): F {
    const dummy = ((...props: Parameters<F>) => {
        const up = f(...props);
        unpatches.push(up);
        return up;
    }) as F;

    for (const key in f) if (typeof f[key] === "function") {
        // @ts-ignore
        dummy[key] = shimDisposableFn(unpatches, f[key] as DisposableFn);
    }

    return dummy;
}

export function createZancordPluginApi(id: string) {
    const disposers = new Array<DisposableFn>;

    // proxying this would be a good idea
    const object = {
        ...window.zancord,
        api: {
            ...window.zancord.api,
            patcher: {
                before: shimDisposableFn(disposers, patcher.before),
                after: shimDisposableFn(disposers, patcher.after),
                instead: shimDisposableFn(disposers, patcher.instead)
            },
            commands: {
                ...window.zancord.api.commands,
                registerCommand: shimDisposableFn(disposers, registerCommand)
            },
            flux: {
                ...window.zancord.api.flux,
                intercept: shimDisposableFn(disposers, window.zancord.api.flux.intercept)
            }
        },
        // Added something in here? Make sure to also update ZancordPluginProperty in ./types
        plugin: {
            createStorage: <T extends object = any>() => createStorage<T>(`plugins/storage/${id}.json`),
            manifest: registeredPlugins.get(id),
            logger
        }
    } as unknown as ZancordPluginObject;

    return {
        object,
        disposers,
    };
}
