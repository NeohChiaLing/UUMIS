import { Component } from '@angular/core';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Navbar, Footer],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  constructor() {}

  selectedImage: string | null = null;
  currentZoom: number = 1;

  // --- 新增：用于拖拽的变量 ---
  isDragging: boolean = false; // 是否正在拖拽
  panX: number = 0;            // X轴移动距离
  panY: number = 0;            // Y轴移动距离
  startX: number = 0;          // 鼠标按下时的X坐标
  startY: number = 0;          // 鼠标按下时的Y坐标

  openImage(imageSrc: string): void {
    this.selectedImage = imageSrc;
    this.resetImageState(); // 打开新图时重置状态
  }

  closeImage(): void {
    this.selectedImage = null;
    this.resetImageState();
  }

  // 重置图片状态（回到正中间，100%大小）
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
    // 如果缩小回 1 倍或更小，自动归位，避免图片跑偏
    if (this.currentZoom <= 1) {
      this.panX = 0;
      this.panY = 0;
    }
  }

  // --- 新增：鼠标拖拽逻辑 ---

  // 1. 鼠标按下：开始拖拽
  startDrag(event: MouseEvent): void {
    if (this.currentZoom <= 1) return; // 如果没有放大，不需要拖拽
    event.preventDefault(); // 防止浏览器默认的图片拖动行为
    this.isDragging = true;
    this.startX = event.clientX - this.panX;
    this.startY = event.clientY - this.panY;
  }

  // 2. 鼠标移动：计算移动距离
  onDrag(event: MouseEvent): void {
    if (!this.isDragging) return;
    event.preventDefault();
    this.panX = event.clientX - this.startX;
    this.panY = event.clientY - this.startY;
  }

  // 3. 鼠标松开/离开：停止拖拽
  endDrag(): void {
    this.isDragging = false;
  }
}
