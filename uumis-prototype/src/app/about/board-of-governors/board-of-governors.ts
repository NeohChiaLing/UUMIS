import { Component } from '@angular/core';
import { Navbar } from '../../navbar/navbar';
import { Footer } from '../../footer/footer';

@Component({
  selector: 'app-board-of-governors',
  standalone: true,
  imports: [Navbar, Footer],
  templateUrl: './board-of-governors.html',
  styleUrl: './board-of-governors.css'
})
export class BoardOfGovernorsComponent {
}
