import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebsiteDataService {

  // 这里是首页的默认数据
  // Admin 修改后，这些数据会变，首页也会跟着变
  private homeContent = {
    hero: {
      tagline: 'Welcome to UUM International School',
      titlePart1: 'Shaping Future',
      titlePart2: 'Global Leaders', // 这部分是渐变色文字
      description: 'Providing a nurturing environment where students thrive academically and develop into well-rounded individuals within the serene UUM campus.'
    },
    videoSection: {
      title: 'Experience UUMIS',
      subtitle: 'Before You Arrive',
      description: 'Watch our corporate video to see our Cambridge Syllabus in action, our beautiful UUM campus location, and the diverse community that makes us unique.',
      youtubeUrl: 'https://www.youtube.com/embed/NvSeulgXBoU?si=3cQq5Uu06bPmMfPA'
    },
    announcements: [
      {
        category: 'Admissions',
        title: '2025/2026 Intakes Open',
        desc: 'Registration is now open for the August 2025 and January 2026 academic sessions.',
        image: '/assets/MAIN-BROCHURE.jpg',
        styleClass: 'text-[#30e87a] bg-[#f0fdf4]' // 保持原本的颜色样式
      },
      {
        category: 'Academic',
        title: 'Semester 1 Calendar',
        desc: 'View key dates for Semester 1 (August - December 2025).',
        image: '/assets/calender1.jpg',
        styleClass: 'text-blue-500 bg-blue-50'
      },
      {
        category: 'Academic',
        title: 'Semester 2 Calendar',
        desc: 'View key dates for Semester 2 (January - June 2026).',
        image: '/assets/calender2.jpg',
        styleClass: 'text-blue-500 bg-blue-50'
      },
      {
        category: 'Highlights',
        title: 'Shaping Global Leaders',
        desc: 'Discover our holistic approach to education and Cambridge syllabus.',
        image: '/assets/UUMIS-PROMOTIONAL-BROCHURE.jpg',
        styleClass: 'text-purple-500 bg-purple-50'
      }
    ],
    events: [
      { month: 'Aug', day: '10', title: 'First Day of School', subtitle: 'Semester 1 Begins' },
      { month: 'Aug', day: '31', title: 'National Day', subtitle: 'Public Holiday' }
    ]
  };

  constructor() { }

  // 获取数据
  getHomeData() {
    return this.homeContent;
  }

  // Admin 更新数据
  updateHomeData(newData: any) {
    this.homeContent = newData;
  }
}
