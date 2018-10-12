import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';

import { throttle as _throttle } from "lodash-es";

enum ScrollDirection {
  UP = 'up',
  DOWN = 'down'
}

@Component({
  selector: 'app-scroll-container',
  templateUrl: './scroll-container.component.html',
  styleUrls: ['./scroll-container.component.css']
})
export class ScrollContainerComponent {

  public scrollTop = 0;
  @Input() more = true;
  @Input() scrollDelay = 300;
  @Input() scrollOffset = 300;
  @Output() scrolled: EventEmitter<boolean> = new EventEmitter<boolean>();
  @HostListener('scroll', ['$event']) onScroll = _throttle(this.handleScroll, this.scrollDelay);

  constructor() {}

  roundTo = (from: number, to: number = this.scrollOffset) => Math.floor(from / to) * to;
  getScrollDirection = (st: number) => this.scrollTop <= st ? ScrollDirection.DOWN : ScrollDirection.UP;

  canScroll(e): boolean {
    const scrolled = this.more
      && this.getScrollDirection(e.srcElement.scrollTop) === ScrollDirection.DOWN
      && this.roundTo(e.srcElement.clientHeight) === this.roundTo(e.srcElement.scrollHeight - e.srcElement.scrollTop);
    this.scrollTop = e.srcElement.scrollTop;
    return scrolled;
  }

  handleScroll(event) {
    this.scrolled.emit( this.canScroll(event) );
  }
}
