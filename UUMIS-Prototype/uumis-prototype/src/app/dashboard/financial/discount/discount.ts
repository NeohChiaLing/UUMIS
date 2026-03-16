import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../../services/auth.service';

interface DiscountItem {
  id?: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  fileName: string | null;
  fileUrl: string | null;
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
  previewContent: SafeResourceUrl | string | null = null;
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
      next: (data) => this.discounts = data,
      error: () => console.log('Failed to fetch discounts')
    });
  }

  goBack() { this.location.back(); }

  openPreview(item: DiscountItem) {
    if (!item.fileUrl) { alert('No file to preview.'); return; }
    this.previewType = item.fileType;
    this.previewTitle = item.fileName || 'Preview';
    if (item.fileType === 'pdf') {
      this.previewContent = this.sanitizer.bypassSecurityTrustResourceUrl(item.fileUrl);
    } else {
      this.previewContent = item.fileUrl;
    }
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
    return { title: '', description: '', startDate: today, endDate: today, fileName: null, fileUrl: null, fileType: null, isActive: true };
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
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (!this.formData.title || !this.formData.startDate || !this.formData.endDate) {
      alert('Please fill in required fields (Title, Dates).'); return;
    }

    if (this.isEditing && this.editingId) {
      this.authService.updateDiscount(this.editingId, this.formData).subscribe({
        next: () => { this.loadDiscounts(); this.closeModal(); }
      });
    } else {
      this.authService.createDiscount(this.formData).subscribe({
        next: () => { this.loadDiscounts(); this.closeModal(); }
      });
    }
  }

  toggleStatus(item: DiscountItem) {
    item.isActive = !item.isActive;
    this.authService.updateDiscount(item.id!, item).subscribe();
  }
}
