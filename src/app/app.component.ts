import {AfterViewInit, Component, DoCheck, Inject, OnDestroy, OnInit} from '@angular/core';
import {AppState} from './app.state';
import {Store} from '@ngrx/store';
import {MatDialog} from '@angular/material';
import {AppService} from './app.service';
import {Router} from '@angular/router';
import {Config} from './store/states/config';
//import {Observable} from 'rxjs/Observable';

export const APP_REFRESH = 'APP_REFRESH';

/**
 * AppComponent
 */
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    host: {'(window:scroll)': '($event)'}
})
export class AppComponent implements OnInit, AfterViewInit, DoCheck, OnDestroy {

    /**
     * Class level-declarations.
     */
    public headerClass = 'header';
    // public configState: Observable<Config>;
    // public config: Config;
    // public configSubscription: any

    /**
     *
     * @param appService
     * @param {<AppState>} store
     * @param {} mdDialog
     * @param {} router
     */
    constructor(@Inject('AppService') public appService: any, private store: Store<AppState>, private mdDialog: MatDialog, private router: Router) {
        // this.configState = this.store.select('config');
        // this.configSubscription = this.configState.subscribe((config: Config) => {
        //     this.config = config;
        // });
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('scandis');
        }
    }

    /**
     *
     */
    ngOnInit() {
    }

    /**
     *
     */
    ngAfterViewInit() {
    }

    /**
     *
     */
    ngDoCheck() {
        if (typeof window !== 'undefined') {
            window.pageYOffset > 25 ? this.headerClass = 'header scrolled' : this.headerClass = 'header';
        }
    }

    /**
     *
     */
    ngOnDestroy() {
       // this.configSubscription.unsubscribe();
    }
}
