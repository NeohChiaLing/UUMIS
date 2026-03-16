import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// 注意：通常 CLI 生成的文件名是 website-data.service.ts，请确认你的路径
import { WebsiteDataService } from '../../../services/website-data';

@Component({
  selector: 'app-website-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './website-management.html',
  styles: []
})
export class WebsiteManagementComponent implements OnInit {

  // 本地绑定的数据模型
  editableContent: any;

  constructor(private webService: WebsiteDataService) {}

  ngOnInit() {
    // 修正 1: 使用 getHomeData() 而不是 getData()
    // 这里的 ?. 是为了防止 service 返回空数据导致报错
    const data = this.webService.getHomeData();
    if (data) {
      this.editableContent = JSON.parse(JSON.stringify(data));
    }
  }

  saveChanges() {
    // 修正 2: 使用 updateHomeData() 而不是 updateData()
    this.webService.updateHomeData(this.editableContent);
    alert('Website Content Updated Successfully!');
  }
}
