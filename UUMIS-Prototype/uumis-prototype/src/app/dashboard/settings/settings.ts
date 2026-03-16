import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service'; // Adjust path!

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html'
})
export class SettingsComponent implements OnInit {
  selectedLanguage: string = 'en';

  constructor(private location: Location, public lang: LanguageService) {}

  ngOnInit() {
    this.selectedLanguage = this.lang.currentLang;
  }

  goBack() {
    this.location.back();
  }

  saveChanges() {
    // This will trigger the Google Cookie and reload the page automatically!
    this.lang.setLanguage(this.selectedLanguage);
  }

  cancel() {
    this.selectedLanguage = this.lang.currentLang;
    this.goBack();
  }
}
