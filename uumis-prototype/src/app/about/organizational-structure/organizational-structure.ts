import { Component } from '@angular/core';
import { Navbar } from '../../navbar/navbar';
import { Footer } from '../../footer/footer';

@Component({
  selector: 'app-organizational-structure',
  standalone: true,
  imports: [Navbar, Footer],
  templateUrl: './organizational-structure.html',
  styleUrl: './organizational-structure.css'
})
export class OrganizationalStructureComponent {
}
