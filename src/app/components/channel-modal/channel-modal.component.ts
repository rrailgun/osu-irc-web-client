import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  selector: 'app-channel-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, NzModalModule, NzInputModule],
  templateUrl: './channel-modal.component.html',
})
export class ChannelModalComponent {
  isVisible = false;
  channelName = '';

  @Output() submitted = new EventEmitter<string>();

  show(): void {
    this.isVisible = true;
  }

  handleOk(): void {
    const trimmed = this.channelName.trim();
    if (trimmed) {
      this.submitted.emit(trimmed);
    }
    this.channelName = '';
    this.isVisible = false;
  }

  handleCancel(): void {
    this.isVisible = false;
  }
}
