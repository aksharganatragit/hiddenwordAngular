import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-help-modal',
  standalone: true,
  templateUrl: './help-modal.component.html',
  styleUrls: ['./help-modal.component.scss'],
})
export class HelpModalComponent {
  @Output() close = new EventEmitter<void>();
  onClose() {
    this.close.emit();
  }
}
