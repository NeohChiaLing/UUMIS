import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { AuthService } from '../../../services/auth.service';

interface DiscountItem {
  id?: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  fileName: string | null;
  fileUrl: string | null;
  safeUrl?: SafeUrl | SafeResourceUrl | null;
  fileType: 'image' | 'pdf' | null;
  isActive: boolean;
}

@Component({
  selector: 'app-discount',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './discount.html',
  styleUrl: './discount.css'
})
export class DiscountComponent implements OnInit {

  showModal: boolean = false;
  isEditing: boolean = false;
  editingId: number | null = null;
  formData: DiscountItem = this.getEmptyForm();

  showPreviewModal: boolean = false;
  previewContent: SafeResourceUrl | SafeUrl | string | null = null;
  previewType: 'image' | 'pdf' | null = null;
  previewTitle: string = '';

  showDownloadConfirm: boolean = false;
  itemToDownload: DiscountItem | null = null;

  discounts: DiscountItem[] = [];

  constructor(
    private location: Location,
    private sanitizer: DomSanitizer,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadDiscounts();
  }

  loadDiscounts() {
    this.authService.getAllDiscounts().subscribe({
      next: (data: any[]) => {
        this.discounts = data.map(item => {
          let sUrl = null;

          // Fallback to check BOTH camelCase and snake_case properties to guarantee safety
          const fileUrl = item.fileUrl || item.file_url;
          const fileType = item.fileType || item.file_type;
          const startDate = item.startDate || item.start_date;
          const endDate = item.endDate || item.end_date;
          const fileName = item.fileName || item.file_name;

          if (fileUrl) {
            if (fileType === 'pdf') {
              sUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
            } else {
              sUrl = this.sanitizer.bypassSecurityTrustUrl(fileUrl);
            }
          }

          return {
            ...item,
            fileUrl,
            fileType,
            startDate,
            endDate,
            fileName,
            safeUrl: sUrl
          };
        });
      },
      error: () => console.log('Failed to fetch discounts')
    });
  }

  goBack() { this.location.back(); }

  openPreview(item: DiscountItem) {
    if (!item.fileUrl) { alert('No file to preview.'); return; }
    this.previewType = item.fileType;
    this.previewTitle = item.fileName || 'Preview';

    this.previewContent = item.safeUrl || item.fileUrl;

    this.showPreviewModal = true;
  }

  closePreview() {
    this.showPreviewModal = false;
    this.previewContent = null;
  }

  askDownload(item: DiscountItem) {
    if (!item.fileUrl) { alert('No file available to download.'); return; }
    this.itemToDownload = item;
    this.showDownloadConfirm = true;
  }

  confirmDownload() {
    if (this.itemToDownload && this.itemToDownload.fileUrl) {
      const link = document.createElement('a');
      link.href = this.itemToDownload.fileUrl;
      link.download = this.itemToDownload.fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    this.showDownloadConfirm = false;
    this.itemToDownload = null;
  }

  getEmptyForm(): DiscountItem {
    const today = new Date().toISOString().split('T')[0];
    return { title: '', description: '', startDate: today, endDate: today, fileName: null, fileUrl: null, safeUrl: null, fileType: null, isActive: true };
  }

  openAddModal() {
    this.isEditing = false;
    this.editingId = null;
    this.formData = this.getEmptyForm();
    this.showModal = true;
  }

  openEditModal(item: DiscountItem) {
    this.isEditing = true;
    this.editingId = item.id!;
    this.formData = { ...item };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.formData = this.getEmptyForm();
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.formData.fileName = file.name;
      if (file.type.startsWith('image/')) {
        this.formData.fileType = 'image';
      } else if (file.type === 'application/pdf') {
        this.formData.fileType = 'pdf';
      } else {
        alert('Only Image (JPG/PNG) or PDF files are allowed.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.formData.fileUrl = e.target.result;

        if (this.formData.fileType === 'pdf') {
          this.formData.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(e.target.result);
        } else {
          this.formData.safeUrl = this.sanitizer.bypassSecurityTrustUrl(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (!this.formData.title || !this.formData.startDate || !this.formData.endDate) {
      alert('Please fill in required fields (Title, Dates).'); return;
    }

    const payload = { ...this.formData };
    delete payload.safeUrl;

    if (this.isEditing && this.editingId) {
      this.authService.updateDiscount(this.editingId, payload).subscribe({
        next: () => { this.loadDiscounts(); this.closeModal(); },
        error: () => alert('Failed to update discount.')
      });
    } else {
      this.authService.createDiscount(payload).subscribe({
        next: () => { this.loadDiscounts(); this.closeModal(); },
        error: () => alert('Failed to save discount.')
      });
    }
  }

  toggleStatus(item: DiscountItem) {
    item.isActive = !item.isActive;

    const payload = { ...item };
    delete payload.safeUrl;

    this.authService.updateDiscount(item.id!, payload).subscribe();
  }

  // THE FIX: New Delete Function
  deleteDiscount(item: DiscountItem) {
    if (confirm(`Are you sure you want to permanently delete "${item.title}"?`)) {
      this.authService.deleteDiscount(item.id!).subscribe({
        next: () => {
          this.loadDiscounts();
          alert('Discount deleted successfully.');
        },
        error: () => alert('Failed to delete discount. Please check connection.')
      });
    }
  }
}
