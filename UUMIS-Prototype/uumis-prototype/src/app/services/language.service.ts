import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  currentLang: string = 'en';

  constructor(private authService: AuthService) {
    // 1. Check local storage
    const saved = localStorage.getItem('uumis_lang');
    if (saved) {
      this.currentLang = saved;
    }

    // 2. Override with DB preference if logged in
    const user = this.authService.getCurrentUser();
    if (user && user.languagePreference) {
      this.currentLang = user.languagePreference;
    }

    // 3. Ensure the Google Translate cookie matches the user's preference on initial load
    this.applyGoogleCookie(this.currentLang);
  }

  setLanguage(lang: string, saveToDb: boolean = true) {
    this.currentLang = lang;
    localStorage.setItem('uumis_lang', lang);

    // Set Google Translate Cookie
    this.applyGoogleCookie(lang);

    // Save to Database
    if (saveToDb) {
      const user = this.authService.getCurrentUser();
      if (user && user.id) {
        user.languagePreference = lang;
        localStorage.setItem('user', JSON.stringify(user));

        this.authService.updateUserProfile(user.id, { languagePreference: lang }).subscribe();
      }
    }

    // Reload the page so Google Translate activates instantly across the whole interface
    window.location.reload();
  }

  private applyGoogleCookie(lang: string) {
    if (lang === 'ms') {
      // Tell Google to translate English to Malay
      document.cookie = "googtrans=/en/ms; path=/";
    } else if (lang === 'th') {
      // Tell Google to translate English to Thai
      document.cookie = "googtrans=/en/th; path=/";
    } else {
      // Clear translation (Return to English)
      document.cookie = "googtrans=/en/en; path=/";
    }
  }
}
