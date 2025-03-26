import { IAppConfig } from "./model/app-config.model";
import fs from 'fs/promises';
import path from 'path';

let appConfig: IAppConfig | undefined;

/** Reads the app config, caches it, and returns it. */
export async function getAppConfig(): Promise<IAppConfig> {
    if (!appConfig) {
        const configPath = path.join(__dirname, '..', 'app-config.json');
        const configJson = await fs.readFile(configPath, 'utf-8');
        appConfig = JSON.parse(configJson) as IAppConfig;
        convertFilePathsToAbsolute(appConfig);
    }
    return appConfig;
}

/** Converts all file paths on a specified target object, and nested objects, to be absolute paths. */
function convertFilePathsToAbsolute(target: object): void {
    const recast: { [key: string]: any; } = target;

    for (let n in recast) {
        const value = recast[n];
        const valueType = typeof value;
        if (valueType === 'string') {
            if (/^\.\.?\//.test(value as string)) {
                recast[n] = path.join(__dirname, '..', value);
            }
        } else if (valueType === 'object' && !!valueType) {
            convertFilePathsToAbsolute(value);
        }
    }
}