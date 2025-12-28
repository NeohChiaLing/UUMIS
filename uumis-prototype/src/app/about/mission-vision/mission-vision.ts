import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// FIX: Ensure this path points to your 'navbar.ts' file.
// Based on your file tree, it is two levels up inside the 'app' folder.
import { Navbar } from '../../navbar/navbar';

// Footer import
import { Footer } from '../../footer/footer';

@Component({
  selector: 'app-mission-vision',
  standalone: true,
  imports: [CommonModule, Navbar, Footer],
  templateUrl: './mission-vision.html',
  styleUrl: './mission-vision.css'
})
export class MissionVisionComponent {
}
