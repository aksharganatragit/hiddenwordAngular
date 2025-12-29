import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // ✅ Need this!

@Component({
  selector: 'app-footer',
  standalone: true,                 // ✅ REQUIRED
  imports: [RouterModule], // ✅ Need this!
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'], // ✅ FIXED
})
export class FooterComponent {}
