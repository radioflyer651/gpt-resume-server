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
    }
    return appConfig;
}
