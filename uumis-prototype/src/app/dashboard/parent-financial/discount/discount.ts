import { Component } from '@angular/core';
import { Location, CommonModule } from '@angular/common';

@Component({
  selector: 'app-discount',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './discount.html',
  styleUrls: ['./discount.css']
})
export class DiscountComponent {

  showPreviewModal: boolean = false;
  previewType: 'image' | 'pdf' | null = null;
  previewContent: string = '';

  activeDiscounts = [
    {
      title: 'Early Bird Enrollment',
      description: 'Get RM 500 off when you enroll before the end of the month. Terms and conditions apply.',
      fileType: 'image',
      fileUrl: 'assets/flyer1.jpg',
      startDate: '2025-01-01', // Added
      endDate: '2025-01-31',
      status: 'Active'         // Added
    },
    {
      title: 'Sibling Discount Program',
      description: '10% off tuition fees for the second child onwards. Valid for the entire academic year.',
      fileType: 'pdf',
      fileUrl: 'assets/flyer2.pdf',
      startDate: '2025-01-01', // Added
      endDate: '2025-12-31',
      status: 'Active'         // Added
    }
  ];

  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }

  openPreview(discount: any): void {
    this.showPreviewModal = true;
    this.previewContent = discount.fileUrl;
    this.previewType = discount.fileType;
  }

  closePreview(): void {
    this.showPreviewModal = false;
    this.previewContent = '';
  }

  downloadFlyer(discount: any): void {
    console.log('Downloading', discount.title);
    // You can implement actual download logic here later
  }
}
