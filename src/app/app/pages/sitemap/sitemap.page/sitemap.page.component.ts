import { Component } from '@angular/core';

import { RouterModule } from '@angular/router'; // ✅ Need this!
@Component({
  selector: 'app-sitemap.page',
  imports: [RouterModule],
  templateUrl: './sitemap.page.component.html',
  styleUrl: './sitemap.page.component.scss'
})
export class SitemapPageComponent {

}
