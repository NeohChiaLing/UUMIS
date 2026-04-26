import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas'; // Added html2canvas!
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
  docName?: string;
  docData?: string;
  docType?: string;
  imageName?: string;
  imageData?: string;
  imageType?: string;
  selected?: boolean;
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
  selectAll: boolean = false;

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

  // Used for rendering the formal PDF
  selectedItemForPdf: NotificationHistory | null = null;
  isGeneratingPDF: boolean = false;

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

  onFileSelected(event: any, fileType: 'doc' | 'image') {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const fullDataURI = reader.result as string;

        if (fileType === 'doc') {
          this.formData.docName = file.name;
          this.formData.docType = file.type;
          this.formData.docData = fullDataURI;
        } else {
          this.formData.imageName = file.name;
          this.formData.imageType = file.type;
          this.formData.imageData = fullDataURI;
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
    this.filteredHistory = this.historyList.filter((item: NotificationHistory) =>
      item.subject.toLowerCase().includes(term) || item.preview.toLowerCase().includes(term) || item.recipient.toLowerCase().includes(term)
    );
    this.checkSelection();
  }

  get hasSelectedItems(): boolean { return this.filteredHistory.some(i => i.selected); }
  toggleSelectAll() { this.filteredHistory.forEach(item => item.selected = this.selectAll); }
  checkSelection() { this.selectAll = this.filteredHistory.length > 0 && this.filteredHistory.every(item => item.selected); }

  deleteSelected() {
    const selectedIds = this.filteredHistory.filter(i => i.selected).map(i => i.id);
    if (selectedIds.length === 0) return;

    if (confirm(`Are you sure you want to permanently delete ${selectedIds.length} notifications?`)) {
      this.historyList = this.historyList.filter(item => !selectedIds.includes(item.id));
      this.filterHistory();
      this.selectAll = false;
      selectedIds.forEach(id => {
        try { fetch(`/api/notifications/${id}`, { method: 'DELETE' }); } catch(e) {}
      });
    }
  }

  deleteSingleItem(item: NotificationHistory) {
    if (confirm(`Are you sure you want to delete the message: "${item.subject}"?`)) {
      this.historyList = this.historyList.filter(i => i.id !== item.id);
      this.filterHistory();
      try { fetch(`/api/notifications/${item.id}`, { method: 'DELETE' }); } catch(e) {}
    }
  }

  // --- NEW: Download Attachment directly to computer ---
  downloadAttachment(dataUri: string, fileName: string) {
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  downloadFullReport() {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text('Notification History Report', 14, 22);
    doc.setFontSize(11); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    const tableBody = this.filteredHistory.map((i: NotificationHistory) => [i.subject, i.recipient, i.category, `${i.date} ${i.time}`, i.status]);

    autoTable(doc, {
      head: [['Subject', 'Recipient', 'Category', 'Date Sent', 'Status']],
      body: tableBody,
      startY: 40, theme: 'grid', headStyles: { fillColor: [48, 232, 122], textColor: [14, 27, 19] }
    });
    doc.save('Notification_History.pdf');
  }

  // --- REWRITTEN: Beautiful Formal PDF Generator ---
  downloadSingleItem(item: NotificationHistory) {
    this.selectedItemForPdf = item;
    this.isGeneratingPDF = true;

    // Give Angular a tiny moment to render the hidden HTML template
    setTimeout(() => {
      const element = document.getElementById('formal-notification-pdf');
      if (element) {
        html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();

          let imgWidth = pdfWidth;
          let imgHeight = (canvas.height * pdfWidth) / canvas.width;

          if (imgHeight > pdfHeight) {
            const scaleRatio = pdfHeight / imgHeight;
            imgWidth = imgWidth * scaleRatio;
            imgHeight = imgHeight * scaleRatio;
          }

          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          pdf.save(`Notice_${item.id}_${item.subject.replace(/\s+/g, '_')}.pdf`);

          this.isGeneratingPDF = false;
          this.selectedItemForPdf = null;
        }).catch(err => {
          console.error('PDF Generation Error:', err);
          alert('Failed to generate PDF.');
          this.isGeneratingPDF = false;
          this.selectedItemForPdf = null;
        });
      }
    }, 200);
  }
}
