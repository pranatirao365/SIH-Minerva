import { translations, Language } from '../constants/translations';

type EventListener = (lang: Language) => void;

class Translator {
  private currentLanguage: Language = 'en';
  private listeners: EventListener[] = [];

  setLanguage(lang: Language) {
    this.currentLanguage = lang;
    this.notifyListeners();
  }

  getLanguage(): Language {
    return this.currentLanguage;
  }

  translate(key: string, lang?: Language): string {
    const targetLang = lang || this.currentLanguage;
    return translations[key]?.[targetLang] || key;
  }

  t = (key: string): string => {
    return this.translate(key);
  };

  subscribe(listener: EventListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentLanguage));
  }
}

export const translator = new Translator();
export const t = translator.t.bind(translator);
