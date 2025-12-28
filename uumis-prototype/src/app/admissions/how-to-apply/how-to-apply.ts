import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// CORRECT IMPORTS AS REQUESTED
import { Navbar } from '../../navbar/navbar';
import { Footer } from '../../footer/footer';

@Component({
  selector: 'app-how-to-apply',
  standalone: true,
  imports: [Navbar, Footer, CommonModule],
  // FIX: Point to 'how-to-apply.html' (not .component.html)
  templateUrl: './how-to-apply.html',
  styleUrl: './how-to-apply.css'
})
export class HowToApplyComponent { }
