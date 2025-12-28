import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; // 引入 Sanitizer

// 数据接口
interface DiscountItem {
  id: number;
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

  // 现有状态
  showModal: boolean = false;
  isEditing: boolean = false;
  editingId: number | null = null;
  formData: DiscountItem = this.getEmptyForm();

  // --- 新增状态：预览 & 下载 ---
  showPreviewModal: boolean = false;
  previewContent: SafeResourceUrl | string | null = null; // 用于显示的内容
  previewType: 'image' | 'pdf' | null = null;
  previewTitle: string = '';

  showDownloadConfirm: boolean = false;
  itemToDownload: DiscountItem | null = null;

  // Mock Data
  discounts: DiscountItem[] = [
    {
      id: 1,
      title: 'Early Bird Enrollment',
      description: 'Get RM 500 off when you enroll before the end of the month.',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      fileName: 'early-bird-poster.jpg',
      fileUrl: 'assets/mock-discount-1.jpg',
      fileType: 'image',
      isActive: true
    },
    {
      id: 2,
      title: 'Sibling Discount Program',
      description: '10% off tuition fees for the second child onwards.',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      fileName: null,
      fileUrl: null,
      fileType: null,
      isActive: false
    }
  ];

  // 注入 Location 和 DomSanitizer
  constructor(
    private location: Location,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {}

  goBack() {
    this.location.back();
  }

  // --- 1. Preview Logic (新增) ---
  openPreview(item: DiscountItem) {
    if (!item.fileUrl) {
      alert('No file to preview.');
      return;
    }
    this.previewType = item.fileType;
    this.previewTitle = item.fileName || 'Preview';

    // 如果是 PDF，需要 Bypass Security 才能在 iframe 显示
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

  // --- 2. Download Logic (新增) ---
  askDownload(item: DiscountItem) {
    if (!item.fileUrl) {
      alert('No file available to download.');
      return;
    }
    this.itemToDownload = item;
    this.showDownloadConfirm = true;
  }

  confirmDownload() {
    if (this.itemToDownload && this.itemToDownload.fileUrl) {
      // 创建临时 A 标签触发下载
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

  // --- 现有功能 (保持不变) ---
  getEmptyForm(): DiscountItem {
    const today = new Date().toISOString().split('T')[0];
    return { id: 0, title: '', description: '', startDate: today, endDate: today, fileName: null, fileUrl: null, fileType: null, isActive: true };
  }

  openAddModal() {
    this.isEditing = false;
    this.editingId = null;
    this.formData = this.getEmptyForm();
    this.showModal = true;
  }

  openEditModal(item: DiscountItem) {
    this.isEditing = true;
    this.editingId = item.id;
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
      alert('Please fill in required fields (Title, Dates).');
      return;
    }
    if (this.isEditing && this.editingId) {
      const index = this.discounts.findIndex(d => d.id === this.editingId);
      if (index !== -1) this.discounts[index] = { ...this.formData };
    } else {
      const newItem: DiscountItem = { ...this.formData, id: Date.now() };
      this.discounts.unshift(newItem);
    }
    this.closeModal();
  }

  toggleStatus(item: DiscountItem) {
    item.isActive = !item.isActive;
  }
}
