import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  showTemplateModal: boolean = false; // Controls the "Add Template" popup

  // Compose Form Data
  formData = {
    title: '',
    recipient: '',
    specificClass: '', // Stores class name if "Specific Class" is chosen
    category: '',
    message: '',
    isUrgent: false,
    attachmentName: '' // To show selected file name
  };

  // Template Form Data
  newTemplate = { title: '', subject: '', body: '' };

  // Data for Dropdowns
  recipientOptions = [
    'School-wide (Everyone)',
    'Parents Only',
    'Teachers Only',
    'Administrative Staff',
    'Specific Class'
  ];

  classOptions = ['Pre-Kindergarten', 'Kindergarten', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 10', 'Year 11'];

  categoryOptions = [
    'General Announcement',
    'School Event',
    'Exam Schedule',
    'Fee Payment',
    'Emergency Alert',
    'Academic Update',
    'Holiday Notice',
    'Transport Update'
  ];

  // Mock History
  historyList: NotificationHistory[] = [
    { id: 1, subject: 'Urgent: School Closure Update', preview: 'Due to severe weather conditions forecasted for tomorrow...', recipient: 'All Parents', category: 'Emergency Alert', date: 'Oct 25, 2023', time: '08:15 AM', status: 'Delivered' },
    { id: 2, subject: 'Mid-Term Exam Schedule', preview: 'Please find attached the schedule for the upcoming...', recipient: 'Grade 10-12', category: 'Exam Schedule', date: 'Oct 24, 2023', time: '02:30 PM', status: 'Delivered' },
    { id: 3, subject: 'Annual Sports Day Announcement', preview: 'We are excited to announce that the Annual Sports Day...', recipient: 'Everyone', category: 'School Event', date: 'Oct 22, 2023', time: '10:00 AM', status: 'Pending' },
    { id: 4, subject: 'Q3 Tuition Payment Reminder', preview: 'This is a gentle reminder that the tuition fees...', recipient: 'Selected Parents', category: 'Fee Payment', date: 'Oct 20, 2023', time: '09:00 AM', status: 'Failed', failedCount: 25, totalCount: 300 },
    { id: 5, subject: 'Faculty Meeting - October', preview: 'Agenda items for the monthly faculty meeting...', recipient: 'All Staff', category: 'General Announcement', date: 'Oct 15, 2023', time: '04:45 PM', status: 'Delivered' },
  ];

  // Quick Templates
  templates: QuickTemplate[] = [
    { id: 1, title: 'Event Reminder', subject: 'Upcoming School Event', body: 'Dear Parents, this is a reminder about the upcoming event on [Date].', icon: 'event', colorClass: 'text-blue-500 bg-blue-100' },
    { id: 2, title: 'Exam Schedule', subject: 'Final Exam Dates Released', body: 'Please note the attached schedule for the final examinations.', icon: 'warning', colorClass: 'text-pink-500 bg-pink-100' },
    { id: 3, title: 'Fee Payment', subject: 'Tuition Fee Due', body: 'This is a reminder that the tuition fees for this term are due by [Date].', icon: 'payments', colorClass: 'text-indigo-500 bg-indigo-100' }
  ];

  filteredHistory: NotificationHistory[] = [];
  searchTerm: string = '';

  constructor(private location: Location) {}

  ngOnInit() {
    this.filteredHistory = this.historyList;
  }

  goBack() {
    this.location.back();
  }

  switchView(view: 'compose' | 'history') {
    this.currentView = view;
  }

  // --- File Upload Logic ---
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.formData.attachmentName = file.name;
      alert(`File attached: ${file.name}`);
    }
  }

  triggerFileInput(inputId: string) {
    document.getElementById(inputId)?.click();
  }

  // --- Draft Logic ---
  saveDraft() {
    if (!this.formData.title) {
      alert('Please enter a title to save a draft.');
      return;
    }
    alert('Draft saved successfully! You can continue editing later.');
  }

  // --- Template Logic ---
  openTemplateModal() {
    this.newTemplate = { title: '', subject: '', body: '' };
    this.showTemplateModal = true;
  }

  saveTemplate() {
    if (!this.newTemplate.title || !this.newTemplate.subject) {
      alert('Please fill in Template Title and Subject.');
      return;
    }
    this.templates.push({
      id: Date.now(),
      title: this.newTemplate.title,
      subject: this.newTemplate.subject,
      body: this.newTemplate.body,
      icon: 'description',
      colorClass: 'text-emerald-600 bg-emerald-100'
    });
    this.showTemplateModal = false;
    alert('New template added!');
  }

  applyTemplate(tpl: QuickTemplate) {
    this.formData.title = tpl.subject;
    this.formData.message = tpl.body;
    // Optional: Switch back to compose view if needed, but we are usually already there
  }

  // --- Send Logic ---
  sendMessage() {
    if (!this.formData.title || !this.formData.recipient || !this.formData.category || !this.formData.message) {
      alert('Please fill in all required fields.');
      return;
    }

    // Handle "Specific Class" logic
    let finalRecipient = this.formData.recipient;
    if (this.formData.recipient === 'Specific Class') {
      if (!this.formData.specificClass) {
        alert('Please select a specific class.');
        return;
      }
      finalRecipient = `Class: ${this.formData.specificClass}`;
    }

    const newMsg: NotificationHistory = {
      id: Date.now(),
      subject: this.formData.title,
      preview: this.formData.message,
      recipient: finalRecipient,
      category: this.formData.category,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'Pending'
    };

    this.historyList.unshift(newMsg);
    this.filterHistory();

    // Reset
    this.formData = { title: '', recipient: '', specificClass: '', category: '', message: '', isUrgent: false, attachmentName: '' };
    alert('Message sent successfully!');
    this.switchView('history');
  }

  // --- History & Search ---
  filterHistory() {
    const term = this.searchTerm.toLowerCase();
    this.filteredHistory = this.historyList.filter(item =>
      item.subject.toLowerCase().includes(term) ||
      item.preview.toLowerCase().includes(term) ||
      item.recipient.toLowerCase().includes(term)
    );
  }

  retryFailed(id: number) {
    alert(`Retrying to send message #${id}...`);
  }

  // --- Download Logic (PDF) ---

  // 1. Download ALL History
  downloadFullReport() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Notification History Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    const tableBody = this.filteredHistory.map(item => [
      item.subject,
      item.recipient,
      item.category,
      `${item.date} ${item.time}`,
      item.status
    ]);

    autoTable(doc, {
      head: [['Subject', 'Recipient', 'Category', 'Date Sent', 'Status']],
      body: tableBody,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [48, 232, 122], textColor: [14, 27, 19] }
    });

    doc.save('Notification_History.pdf');
  }

  // 2. Download SINGLE Item
  downloadSingleItem(item: NotificationHistory) {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(14, 27, 19); // Dark Greenish
    doc.text('Message Details', 14, 25);

    doc.setLineWidth(0.5);
    doc.line(14, 30, 196, 30);

    doc.setFontSize(12);
    doc.setTextColor(50);

    let y = 45;
    const lineHeight = 10;

    doc.setFont('helvetica', 'bold');
    doc.text(`Subject:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(item.subject, 50, y);

    y += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text(`Date Sent:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${item.date} at ${item.time}`, 50, y);

    y += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text(`Recipient:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(item.recipient, 50, y);

    y += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text(`Category:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(item.category, 50, y);

    y += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text(`Status:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(item.status, 50, y);

    y += 15;
    doc.setLineWidth(0.2);
    doc.line(14, y, 196, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.text(`Message Body:`, 14, y);
    y += 8;
    doc.setFont('helvetica', 'normal');

    // Wrap text for message body
    const splitText = doc.splitTextToSize(item.preview, 180);
    doc.text(splitText, 14, y);

    doc.save(`Message_${item.id}.pdf`);
  }
}
