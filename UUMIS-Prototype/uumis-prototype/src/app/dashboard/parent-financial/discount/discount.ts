import { Component, OnInit } from '@angular/core';
import { Location, CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-discount',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './discount.html',
  styleUrls: ['./discount.css']
})
export class DiscountComponent implements OnInit {

  showPreviewModal: boolean = false;
  previewType: 'image' | 'pdf' | null = null;
  previewContent: SafeResourceUrl | string | null = null;

  activeDiscounts: any[] = [];

  constructor(
    private location: Location,
    private sanitizer: DomSanitizer,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadActiveDiscounts();
  }

  loadActiveDiscounts() {
    // Only fetches discounts that the Staff has toggled to "Active"
    this.authService.getActiveDiscounts().subscribe({
      next: (data) => this.activeDiscounts = data,
      error: () => console.log('Failed to fetch discounts')
    });
  }

  goBack(): void {
    this.location.back();
  }

  openPreview(discount: any): void {
    this.previewType = discount.fileType;
    if (discount.fileType === 'pdf') {
      this.previewContent = this.sanitizer.bypassSecurityTrustResourceUrl(discount.fileUrl);
    } else {
      this.previewContent = discount.fileUrl;
    }
    this.showPreviewModal = true;
  }

  closePreview(): void {
    this.showPreviewModal = false;
    this.previewContent = null;
  }

  downloadFlyer(discount: any): void {
    if (discount.fileUrl) {
      const a = document.createElement('a');
      a.href = discount.fileUrl;
      a.download = discount.fileName || 'discount_flyer';
      a.click();
    }
  }
}
