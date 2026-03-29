import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App { // <--- FIX: Changed from 'AppComponent' back to 'App'
  title = 'uumis-prototype';

  showLangModal: boolean = false;
  isDashboard: boolean = false;

  constructor(private router: Router) {
    // This checks the URL. If you are inside the dashboard, it shows the translate button!
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isDashboard = event.urlAfterRedirects.includes('/dashboard');
      }
    });
  }

  toggleLangModal() {
    this.showLangModal = !this.showLangModal;
  }

  switchLanguage(lang: string) {
    this.showLangModal = false;
    if (lang === 'en') {
      const domains = [window.location.hostname, '.' + window.location.hostname, 'localhost', ''];
      domains.forEach(d => {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${d}; path=/;`;
      });
      window.location.reload();
      return;
    }

    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event('change'));
    }
  }
}
