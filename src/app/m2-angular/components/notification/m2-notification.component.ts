import {Component, ViewEncapsulation, Input, OnInit, AfterViewInit, OnChanges, DoCheck, OnDestroy } from '@angular/core';

/**
 * M2Notification
 */
@Component({
    selector: 'm2-notification',
    templateUrl: './m2-notification.component.html',
    styleUrls: ['./m2-notification.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class M2NotificationComponent implements OnInit, AfterViewInit, DoCheck, OnDestroy {

    /**
     * Class level-declarations.
     */
    @Input()
    public message: string;
    @Input()
    public notifyClassName: string;
    @Input()
    public timeout: number;
    public cssClassName: string;

    /**
     *
     */
    constructor() {
    }

    /**
     *
     */
    ngOnInit() {
        this.cssClassName = 'm2-notification-wrapper ' + this.notifyClassName;
    }

    /**
     *
     */
    ngDoCheck() {
    }

    /**
     *
     */
    ngOnDestroy() {
    }

    /**
     *
     */
    public dismiss(): void {
        this.cssClassName = 'm2-notification-wrapper ' + this.notifyClassName + ' m2-slide-out';
    }

    /**
     *
     */
    ngAfterViewInit() {
        setTimeout(() => {
            this.dismiss();
        }, this.timeout - 300);
    }
}



