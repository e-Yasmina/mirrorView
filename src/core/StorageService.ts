import { DEFAULT_TRANSFORMS, TransformSettings } from '../types/camera';

const STORAGE_KEY = 'mirrorview_settings_v1';

export class StorageService {
  public static loadSettings(): TransformSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return { ...DEFAULT_TRANSFORMS };
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_TRANSFORMS,
        ...parsed
      };
    } catch (e) {
      console.warn('Failed to load settings from localStorage, using defaults', e);
      return { ...DEFAULT_TRANSFORMS };
    }
  }

  public static saveSettings(settings: TransformSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }
  }

  public static resetSettings(): TransformSettings {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to reset settings in localStorage', e);
    }
    return { ...DEFAULT_TRANSFORMS };
  }
}
