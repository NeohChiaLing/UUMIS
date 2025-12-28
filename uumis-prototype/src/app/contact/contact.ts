import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { RouterLink } from '@angular/router'; // REMOVE THIS
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, Navbar, Footer], // REMOVE RouterLink FROM HERE
  templateUrl: './contact.html',
  styleUrl: './contact.css'
})
export class ContactComponent {}
