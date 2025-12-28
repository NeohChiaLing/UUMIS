import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  // ================= ENGLISH =================
  private en = {
    sidebar: {
      dashboard: 'Dashboard',
      management: 'Management',
      students: 'Students',
      teachers: 'Teachers',
      foodOrdering: 'Food Ordering',
      academic: 'Academic',
      subjects: 'Subjects / Courses',
      schedule: 'Student Schedule',
      lessonPlan: 'Lesson Plan',
      assignments: 'Assignments',
      grading: 'Grading',
      attendance: 'Attendance',
      administration: 'Administration',
      inventory: 'Inventory',
      notifications: 'Notifications',
      financial: 'Financial',
      payment: 'Payment',
      refund: 'Refund',
      discount: 'Discount',
      wallet: 'Wallet',
      reports: 'Reports',
      settings: 'Settings',
      logout: 'Logout'
    },
    settings: {
      title: 'Language Preference',
      subtitle: 'Select your preferred language for the dashboard interface.',
      interfaceLang: 'Interface Language',
      english: 'English',
      englishSub: 'English (US)',
      malay: 'Malay',
      malaySub: 'Bahasa Melayu',
      noteTitle: 'Note about localization',
      noteBody: 'Updating your language preference will refresh the application interface.',
      cancel: 'Cancel',
      save: 'Save Changes'
    },
    // NEW: Inventory Page
    inventory: {
      title: 'Inventory Management',
      subtitle: 'Track school assets, manage stock levels, and assign equipment.',
      addNew: 'Add New Item',
      export: 'Export PDF',
      totalItems: 'Total Items',
      lowStock: 'Low Stock',
      totalValue: 'Total Value',
      estimated: 'Estimated',
      actionNeeded: 'Action Needed',
      searchPlaceholder: 'Search by name, ID or person...',
      headers: {
        name: 'Asset Name',
        category: 'Category',
        qty: 'Quantity',
        status: 'Status',
        pic: 'Person In Charge',
        actions: 'Actions'
      },
      modal: {
        addTitle: 'Add New Asset',
        editTitle: 'Edit Asset',
        save: 'Save Changes',
        add: 'Add Asset',
        cancel: 'Cancel'
      },
      empty: 'No such assets found'
    },
    // NEW: Notification Page
    notification: {
      title: 'Notification Center',
      subtitle: 'Manage announcements & track history.',
      compose: 'Compose',
      history: 'History',
      form: {
        title: 'Message Title',
        recipient: 'Recipient Group',
        category: 'Category',
        content: 'Message Content',
        urgent: 'Mark as High Priority',
        saveDraft: 'Save Draft',
        send: 'Send Message'
      },
      stats: {
        title: 'Quick Stats (Month)',
        sent: 'Sent',
        openRate: 'Open Rate'
      },
      templates: {
        title: 'Quick Templates',
        addNew: 'Add New'
      },
      table: {
        details: 'Message Details',
        recipient: 'Recipient',
        category: 'Category',
        date: 'Date Sent',
        status: 'Status',
        actions: 'Actions'
      }
    }
  };

  // ================= MALAY =================
  private ms = {
    sidebar: {
      dashboard: 'Papan Pemuka',
      management: 'Pengurusan',
      students: 'Pelajar',
      teachers: 'Guru',
      foodOrdering: 'Pesanan Makanan',
      academic: 'Akademik',
      subjects: 'Subjek / Kursus',
      schedule: 'Jadual Pelajar',
      lessonPlan: 'Rancangan Pengajaran',
      assignments: 'Tugasan',
      grading: 'Gred',
      attendance: 'Kehadiran',
      administration: 'Pentadbiran',
      inventory: 'Inventori',
      notifications: 'Notifikasi',
      financial: 'Kewangan',
      payment: 'Bayaran',
      refund: 'Bayaran Balik',
      discount: 'Diskaun',
      wallet: 'Dompet',
      reports: 'Laporan',
      settings: 'Tetapan',
      logout: 'Log Keluar'
    },
    settings: {
      title: 'Pilihan Bahasa',
      subtitle: 'Pilih bahasa pilihan anda untuk antara muka papan pemuka.',
      interfaceLang: 'Bahasa Antara Muka',
      english: 'Inggeris',
      englishSub: 'Bahasa Inggeris (AS)',
      malay: 'Melayu',
      malaySub: 'Bahasa Melayu',
      noteTitle: 'Nota mengenai penyetempatan',
      noteBody: 'Mengemas kini pilihan bahasa anda akan memuat semula antara muka aplikasi.',
      cancel: 'Batal',
      save: 'Simpan Perubahan'
    },
    // NEW: Inventory Page (Malay)
    inventory: {
      title: 'Pengurusan Inventori',
      subtitle: 'Jejak aset sekolah, urus tahap stok, dan peruntukkan peralatan.',
      addNew: 'Tambah Item Baru',
      export: 'Eksport PDF',
      totalItems: 'Jumlah Item',
      lowStock: 'Stok Rendah',
      totalValue: 'Nilai Keseluruhan',
      estimated: 'Anggaran',
      actionNeeded: 'Tindakan Diperlukan',
      searchPlaceholder: 'Cari mengikut nama, ID atau orang...',
      headers: {
        name: 'Nama Aset',
        category: 'Kategori',
        qty: 'Kuantiti',
        status: 'Status',
        pic: 'Penanggungjawab',
        actions: 'Tindakan'
      },
      modal: {
        addTitle: 'Tambah Aset Baru',
        editTitle: 'Sunting Aset',
        save: 'Simpan Perubahan',
        add: 'Tambah Aset',
        cancel: 'Batal'
      },
      empty: 'Tiada aset dijumpai'
    },
    // NEW: Notification Page (Malay)
    notification: {
      title: 'Pusat Notifikasi',
      subtitle: 'Urus pengumuman & jejak sejarah.',
      compose: 'Tulis',
      history: 'Sejarah',
      form: {
        title: 'Tajuk Mesej',
        recipient: 'Kumpulan Penerima',
        category: 'Kategori',
        content: 'Kandungan Mesej',
        urgent: 'Tanda sebagai Keutamaan Tinggi',
        saveDraft: 'Simpan Draf',
        send: 'Hantar Mesej'
      },
      stats: {
        title: 'Statistik Pantas (Bulan)',
        sent: 'Dihantar',
        openRate: 'Kadar Buka'
      },
      templates: {
        title: 'Templat Pantas',
        addNew: 'Tambah Baru'
      },
      table: {
        details: 'Butiran Mesej',
        recipient: 'Penerima',
        category: 'Kategori',
        date: 'Tarikh Dihantar',
        status: 'Status',
        actions: 'Tindakan'
      }
    }
  };

  public text: any = this.en;
  public currentLang: string = 'en';

  constructor() {
    const saved = localStorage.getItem('appLanguage');
    if (saved) {
      this.setLanguage(saved);
    }
  }

  setLanguage(lang: string) {
    this.currentLang = lang;
    this.text = (lang === 'ms') ? this.ms : this.en;
    localStorage.setItem('appLanguage', lang);
  }
}
