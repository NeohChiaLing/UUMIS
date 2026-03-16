import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthService } from '../../services/auth.service';

interface NotificationHistory {
  id: number;
  subject: string;
  preview: string;
  recipient: string;
  category: string;
  date: string;
  time: string;
  status: 'Delivered' | 'Pending' | 'Failed';
  failedCount?: number;
  totalCount?: number;
  isUrgent?: boolean;
  // Separate variables for Dual Attachments
  docName?: string;
  docData?: string;
  docType?: string;
  imageName?: string;
  imageData?: string;
  imageType?: string;
}

interface QuickTemplate {
  id: number;
  title: string;
  subject: string;
  body: string;
  icon: string;
  colorClass: string;
}

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification.html',
  styles: [`
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  `]
})
export class NotificationComponent implements OnInit {

  currentView: 'compose' | 'history' = 'compose';
  showTemplateModal: boolean = false;

  formData = {
    title: '',
    recipient: '',
    category: '',
    message: '',
    isUrgent: false,
    docName: '',
    docData: null as string | null,
    docType: null as string | null,
    imageName: '',
    imageData: null as string | null,
    imageType: null as string | null
  };

  newTemplate = { title: '', subject: '', body: '' };

  historyList: NotificationHistory[] = [];
  filteredHistory: NotificationHistory[] = [];
  searchTerm: string = '';

  templates: QuickTemplate[] = [
    { id: 1, title: 'Event Reminder', subject: 'Upcoming School Event', body: 'Dear Parents, this is a reminder about the upcoming event on [Date].', icon: 'event', colorClass: 'text-blue-500 bg-blue-100' },
    { id: 2, title: 'Exam Schedule', subject: 'Final Exam Dates Released', body: 'Please note the attached schedule for the final examinations.', icon: 'warning', colorClass: 'text-pink-500 bg-pink-100' },
    { id: 3, title: 'Fee Payment', subject: 'Tuition Fee Due', body: 'This is a reminder that the tuition fees for this term are due by [Date].', icon: 'payments', colorClass: 'text-indigo-500 bg-indigo-100' }
  ];

  constructor(private location: Location, private authService: AuthService) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.authService.getNotifications().subscribe({
      next: (data) => {
        this.historyList = data;
        this.filterHistory();
      },
      error: (err) => console.error('Failed to load notifications', err)
    });
  }

  goBack() { this.location.back(); }
  switchView(view: 'compose' | 'history') { this.currentView = view; }
  triggerFileInput(inputId: string) { document.getElementById(inputId)?.click(); }
  saveDraft() { alert('Draft saved successfully! You can continue editing later.'); }
  applyTemplate(tpl: QuickTemplate) { this.formData.title = tpl.subject; this.formData.message = tpl.body; }
  retryFailed(id: number) { alert(`Retrying to send message #${id}...`); }

  // Only ONE onFileSelected method now! Handled via 'doc' or 'image'
  onFileSelected(event: any, fileType: 'doc' | 'image') {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];

        if (fileType === 'doc') {
          this.formData.docName = file.name;
          this.formData.docType = file.type;
          this.formData.docData = base64String;
        } else {
          this.formData.imageName = file.name;
          this.formData.imageType = file.type;
          this.formData.imageData = base64String;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  sendMessage() {
    if (!this.formData.title || !this.formData.recipient || !this.formData.category || !this.formData.message) {
      alert('Please fill in all required fields.');
      return;
    }

    const payload = {
      subject: this.formData.title,
      preview: this.formData.message,
      recipient: this.formData.recipient,
      category: this.formData.category,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isUrgent: this.formData.isUrgent,
      docName: this.formData.docName,
      docData: this.formData.docData,
      docType: this.formData.docType,
      imageName: this.formData.imageName,
      imageData: this.formData.imageData,
      imageType: this.formData.imageType
    };

    this.authService.sendNotification(payload).subscribe({
      next: () => {
        this.loadNotifications();
        this.formData = {
          title: '', recipient: '', category: '', message: '', isUrgent: false,
          docName: '', docData: null, docType: null, imageName: '', imageData: null, imageType: null
        };
        alert('Emails sent to the selected group successfully!');
        this.switchView('history');
      },
      error: () => alert('Failed to send emails. Ensure your SMTP settings are correct.')
    });
  }

  filterHistory() {
    const term = this.searchTerm.toLowerCase();
    // Added explicit type to prevent TS implicit any error
    this.filteredHistory = this.historyList.filter((item: NotificationHistory) =>
      item.subject.toLowerCase().includes(term) || item.preview.toLowerCase().includes(term) || item.recipient.toLowerCase().includes(term)
    );
  }

  downloadFullReport() {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text('Notification History Report', 14, 22);
    doc.setFontSize(11); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    // Explicitly typing 'i'
    const tableBody = this.filteredHistory.map((i: NotificationHistory) => [i.subject, i.recipient, i.category, `${i.date} ${i.time}`, i.status]);

    autoTable(doc, {
      head: [['Subject', 'Recipient', 'Category', 'Date Sent', 'Status']],
      body: tableBody,
      startY: 40, theme: 'grid', headStyles: { fillColor: [48, 232, 122], textColor: [14, 27, 19] }
    });
    doc.save('Notification_History.pdf');
  }

  downloadSingleItem(item: NotificationHistory) {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(14, 27, 19);
    doc.text('Message Details', 14, 25);
    doc.setLineWidth(0.5);
    doc.line(14, 30, 196, 30);
    doc.setFontSize(12);
    doc.setTextColor(50);

    let y = 45;
    const lineHeight = 10;

    doc.setFont('helvetica', 'bold'); doc.text(`Subject:`, 14, y); doc.setFont('helvetica', 'normal'); doc.text(item.subject, 50, y); y += lineHeight;
    doc.setFont('helvetica', 'bold'); doc.text(`Date Sent:`, 14, y); doc.setFont('helvetica', 'normal'); doc.text(`${item.date} at ${item.time}`, 50, y); y += lineHeight;
    doc.setFont('helvetica', 'bold'); doc.text(`Recipient:`, 14, y); doc.setFont('helvetica', 'normal'); doc.text(item.recipient, 50, y); y += lineHeight;
    doc.setFont('helvetica', 'bold'); doc.text(`Category:`, 14, y); doc.setFont('helvetica', 'normal'); doc.text(item.category, 50, y); y += lineHeight;
    doc.setFont('helvetica', 'bold'); doc.text(`Status:`, 14, y); doc.setFont('helvetica', 'normal'); doc.text(item.status, 50, y); y += 15;

    doc.setLineWidth(0.2); doc.line(14, y, 196, y); y += 10;
    doc.setFont('helvetica', 'bold'); doc.text(`Message Body:`, 14, y); y += 8;
    doc.setFont('helvetica', 'normal');

    const splitText = doc.splitTextToSize(item.preview, 180);
    doc.text(splitText, 14, y);

    y += (splitText.length * 7) + 10;

    // Output Document Name if it exists
    if (item.docName) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Attached Document:`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(item.docName, 55, y);
      y += 10;
    }

    // Output Image if it exists
    if (item.imageName && item.imageData) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Attached Image:`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(item.imageName, 50, y);
      y += 10;

      try {
        let imgFormat = (item.imageType && item.imageType.includes('png')) ? 'PNG' : 'JPEG';
        doc.addImage(item.imageData, imgFormat, 14, y, 100, 100);
      } catch (e) {
        console.error('Could not embed image into PDF', e);
      }
    }

    doc.save(`Message_${item.id}.pdf`);
  }
}
