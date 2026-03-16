import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LanguageService } from '../../services/language.service';
import { AuthService } from '../../services/auth.service'; // Added to fetch DB data

interface Asset {
  id: string;
  name: string;
  category: string;
  quantity: number;
  value: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  personInCharge: string;
  picInitials: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.html',
  styles: [`
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  `]
})
export class InventoryComponent implements OnInit {
  public lang: any;
  baseCategories: string[] = ['Electronics', 'Furniture', 'Stationery', 'Books', 'Sports'];
  filterOptions: string[] = ['All Categories', ...this.baseCategories, 'Others'];
  selectedFilter: string = 'All Categories';

  assets: Asset[] = []; // Emptied dummy data, it will now load from DB!
  filteredAssets: Asset[] = [];
  searchTerm: string = '';

  showModal: boolean = false;
  showExportConfirm: boolean = false;
  isEditing: boolean = false;

  formData: any = this.getEmptyForm();

  constructor(
    private location: Location,

    private authService: AuthService // Inject AuthService
  ) {}

  ngOnInit() {
    this.loadInventory();
  }

  // --- NEW: Load real data from DB ---
  loadInventory() {
    this.authService.getInventory().subscribe({
      next: (data) => {
        this.assets = data;
        this.filterAssets(); // Instantly apply any selected filters
      },
      error: (err) => console.error('Failed to load inventory', err)
    });
  }

  goBack() {
    this.location.back();
  }

  get totalAssetsCount() { return this.assets.reduce((sum, item) => sum + item.quantity, 0); }
  get lowStockCount() { return this.assets.filter(item => item.quantity < 5).length; }
  get totalValue() { return this.assets.reduce((sum, item) => sum + (item.value * item.quantity), 0); }

  filterAssets() {
    const term = this.searchTerm.toLowerCase();
    this.filteredAssets = this.assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(term) || asset.id.toLowerCase().includes(term) || asset.personInCharge.toLowerCase().includes(term);
      let matchesCategory = true;
      if (this.selectedFilter !== 'All Categories') {
        if (this.selectedFilter === 'Others') {
          matchesCategory = !this.baseCategories.includes(asset.category);
        } else {
          matchesCategory = asset.category === this.selectedFilter;
        }
      }
      return matchesSearch && matchesCategory;
    });
  }

  initiateExport() {
    if (this.filteredAssets.length === 0) {
      alert('No assets to export.');
      return;
    }
    this.showExportConfirm = true;
  }

  confirmDownload() {
    this.showExportConfirm = false;
    const doc = new jsPDF();
    doc.setFontSize(18);
    const title = this.selectedFilter === 'All Categories' ? 'Inventory Report' : `${this.selectedFilter} Inventory`;
    doc.text(title, 14, 22);

    const tableBody = this.filteredAssets.map(item => [
      item.name, item.category, item.quantity.toString(), item.status, `RM ${item.value}`, item.personInCharge
    ]);

    autoTable(doc, {
      head: [['Asset Name', 'Category', 'Qty', 'Status', 'Unit Value', 'PIC']],
      body: tableBody,
      startY: 44,
      theme: 'grid',
      headStyles: { fillColor: [48, 232, 122], textColor: [14, 27, 19] },
    });
    doc.save('Inventory_Report.pdf');
  }

  getEmptyForm() {
    return { id: '', name: '', categorySelect: 'Electronics', customCategory: '', quantity: 1, value: 0, status: 'In Stock', personInCharge: '' };
  }

  openAddModal() {
    this.isEditing = false;
    this.formData = this.getEmptyForm();
    this.showModal = true;
  }

  openEditModal(asset: Asset) {
    this.isEditing = true;
    let catSelect = asset.category;
    let customCat = '';
    if (!this.baseCategories.includes(asset.category)) {
      catSelect = 'Others';
      customCat = asset.category;
    }
    this.formData = { ...asset, categorySelect: catSelect, customCategory: customCat };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  // --- UPDATED: Submits directly to the Database ---
  submitForm() {
    if (!this.formData.name || !this.formData.personInCharge) {
      alert('Please fill in required fields.');
      return;
    }

    let finalCategory = this.formData.categorySelect;
    if (this.formData.categorySelect === 'Others') {
      if (!this.formData.customCategory) {
        alert('Please specify the category name.');
        return;
      }
      finalCategory = this.formData.customCategory;
    }

    let status: any = 'In Stock';
    if (this.formData.quantity === 0) status = 'Out of Stock';
    else if (this.formData.quantity < 5) status = 'Low Stock';

    if (this.isEditing) {
      const payload = { ...this.formData, category: finalCategory, status: status };
      this.authService.updateInventory(this.formData.id, payload).subscribe({
        next: () => {
          this.loadInventory(); // Refresh from DB
          this.closeModal();
          alert('Asset updated successfully!');
        },
        error: () => alert('Failed to update asset.')
      });
    } else {
      const newAsset: Asset = {
        id: `AS-2025-${Math.floor(Math.random() * 10000)}`, // Generates unique ID
        name: this.formData.name,
        category: finalCategory,
        quantity: this.formData.quantity,
        value: this.formData.value,
        personInCharge: this.formData.personInCharge,
        picInitials: this.formData.personInCharge.substring(0, 2).toUpperCase(),
        status: status,
        icon: 'inventory_2',
        color: 'bg-green-50 text-green-600'
      };

      this.authService.addInventory(newAsset).subscribe({
        next: () => {
          this.loadInventory(); // Refresh from DB
          this.closeModal();
          alert('New asset added successfully!');
        },
        error: () => alert('Failed to add asset.')
      });
    }
  }

  // --- UPDATED: Deletes directly from the Database ---
  deleteAsset(id: string) {
    if(confirm('Delete this asset permanently?')) {
      this.authService.deleteInventory(id).subscribe({
        next: () => this.loadInventory(), // Refresh from DB
        error: () => alert('Failed to delete asset.')
      });
    }
  }
}
