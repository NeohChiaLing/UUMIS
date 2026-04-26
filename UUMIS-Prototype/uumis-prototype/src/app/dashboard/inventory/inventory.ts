import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LanguageService } from '../../services/language.service';
import { AuthService } from '../../services/auth.service';

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

  assets: Asset[] = [];
  filteredAssets: Asset[] = [];
  searchTerm: string = '';

  showModal: boolean = false;
  isEditing: boolean = false;
  isGeneratingPDF: boolean = false;
  todayDate: string = new Date().toLocaleDateString();

  formData: any = this.getEmptyForm();

  constructor(
    private location: Location,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadInventory();
  }

  loadInventory() {
    this.authService.getInventory().subscribe({
      next: (data) => {
        this.assets = data.map((d:any) => ({
          ...d,
          personInCharge: d.personInCharge || d.person_in_charge || 'Unassigned',
          picInitials: d.picInitials || d.pic_initials || 'UA'
        }));
        this.filterAssets();
      },
      error: (err) => console.error('Failed to load inventory', err)
    });
  }

  goBack() { this.location.back(); }

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

    this.isGeneratingPDF = true;
    setTimeout(() => {
      const element = document.getElementById('formal-inventory-pdf');
      if (element) {
        html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`Inventory_Report_${this.selectedFilter.replace(/\s+/g, '_')}.pdf`);
          this.isGeneratingPDF = false;
        }).catch(err => {
          console.error(err);
          alert('Failed to generate PDF.');
          this.isGeneratingPDF = false;
        });
      }
    }, 200);
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

  closeModal() { this.showModal = false; }

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
          this.loadInventory();
          this.closeModal();
          alert('Asset updated successfully!');
        },
        error: () => alert('Failed to update asset.')
      });
    } else {
      const newAsset: Asset = {
        id: `AS-2025-${Math.floor(Math.random() * 10000)}`,
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
          this.loadInventory();
          this.closeModal();
          alert('New asset added successfully!');
        },
        error: () => alert('Failed to add asset.')
      });
    }
  }

  deleteAsset(id: string) {
    if(confirm('Delete this asset permanently?')) {
      this.authService.deleteInventory(id).subscribe({
        next: () => this.loadInventory(),
        error: () => alert('Failed to delete asset.')
      });
    }
  }
}
