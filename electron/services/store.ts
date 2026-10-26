import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { AppSettings, DEFAULT_SETTINGS } from '../../src/types';

export class SettingsStore {
  private filePath: string;
  private settings: AppSettings;

  constructor() {
    let userDataPath = '';
    try {
      userDataPath = app.getPath('userData');
    } catch {
      userDataPath = process.cwd();
    }

    this.filePath = path.join(userDataPath, 'streamchat-config.json');
    this.settings = this.load();
  }

  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  public saveSettings(newSettings: Partial<AppSettings>): AppSettings {
    this.settings = {
      ...this.settings,
      ...newSettings
    };

    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (err) {
      console.error('[SettingsStore] Error saving settings to file:', err);
    }

    return { ...this.settings };
  }

  private load(): AppSettings {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed
        };
      }
    } catch (err) {
      console.warn('[SettingsStore] Could not read settings file, using defaults:', err);
    }

    return { ...DEFAULT_SETTINGS };
  }
}

export const settingsStore = new SettingsStore();
