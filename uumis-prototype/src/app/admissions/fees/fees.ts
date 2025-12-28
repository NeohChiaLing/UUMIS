import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// CORRECT IMPORTS AS REQUESTED
import { Navbar } from '../../navbar/navbar';
import { Footer } from '../../footer/footer';

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [Navbar, Footer, CommonModule],
  // FIX: Point to 'fees.html' (not .component.html)
  templateUrl: './fees.html',
  styleUrl: './fees.css'
})
export class FeesComponent { }
