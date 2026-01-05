import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // 确保导入 CommonModule 用于 *ngFor
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { WebsiteDataService } from '../services/website-data'; // 导入 Service

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, Footer],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {

  // 存放从 Service 获取的页面数据
  pageData: any;
  safeVideoUrl: SafeResourceUrl | null = null;

  constructor(
    private webService: WebsiteDataService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    // 1. 获取数据
    this.pageData = this.webService.getHomeData();

    // 2. 处理视频链接 (Angular 安全机制要求)
    if (this.pageData.videoSection.youtubeUrl) {
      this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pageData.videoSection.youtubeUrl);
    }
  }

  // --- 原有的图片逻辑 (完全保留) ---
  selectedImage: string | null = null;
  currentZoom: number = 1;

  isDragging: boolean = false;
  panX: number = 0;
  panY: number = 0;
  startX: number = 0;
  startY: number = 0;

  openImage(imageSrc: string): void {
    this.selectedImage = imageSrc;
    this.resetImageState();
  }

  closeImage(): void {
    this.selectedImage = null;
    this.resetImageState();
  }

  resetImageState(): void {
    this.currentZoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
  }

  zoomIn(event: Event): void {
    event.stopPropagation();
    if (this.currentZoom < 3) {
      this.currentZoom += 0.25;
    }
  }

  zoomOut(event: Event): void {
    event.stopPropagation();
    if (this.currentZoom > 0.5) {
      this.currentZoom -= 0.25;
    }
    if (this.currentZoom <= 1) {
      this.panX = 0;
      this.panY = 0;
    }
  }

  startDrag(event: MouseEvent): void {
    if (this.currentZoom <= 1) return;
    event.preventDefault();
    this.isDragging = true;
    this.startX = event.clientX - this.panX;
    this.startY = event.clientY - this.panY;
  }

  onDrag(event: MouseEvent): void {
    if (!this.isDragging) return;
    event.preventDefault();
    this.panX = event.clientX - this.startX;
    this.panY = event.clientY - this.startY;
  }

  endDrag(): void {
    this.isDragging = false;
  }
}
