import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
// 1. Import Service
import { LanguageService } from '../../language.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styles: []
})
export class SettingsComponent implements OnInit {

  selectedLanguage: string = 'en';

  // 2. Inject Service as 'lang' (public so HTML can access it)
  constructor(private location: Location, public lang: LanguageService) {}

  ngOnInit() {
    // 加载当前服务中的语言状态
    this.selectedLanguage = this.lang.currentLang;
  }

  goBack() {
    this.location.back();
  }

  saveChanges() {
    // 3. Apply changes via service
    this.lang.setLanguage(this.selectedLanguage);

    // Optional: Show alert in the correct language
    const msg = this.selectedLanguage === 'en' ? 'Language updated successfully!' : 'Bahasa berjaya dikemas kini!';
    alert(msg);
  }

  cancel() {
    this.selectedLanguage = this.lang.currentLang;
    this.goBack();
  }
}
