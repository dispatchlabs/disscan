import {Injectable, ComponentFactoryResolver, ApplicationRef, Injector, EventEmitter, OnDestroy, Inject, PLATFORM_ID} from '@angular/core';
import {M2} from '../store/states/m2';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {DomSanitizer, Meta, Title} from '@angular/platform-browser';
import {MatDialog, MatSnackBar} from '@angular/material';
import {Store} from '@ngrx/store';
import {OAuthVendor} from '../store/states/oauth';
import {M2NotificationComponent} from '../components/notification/m2-notification.component';
import {M2ConfirmComponent} from '../dialogs/m2-confirm.component';
import {Media} from '../store/states/media';
import {AccountType} from '../store/states/account';
import {M2Action} from '../store/reducers/m2.reducer';
import {AppState} from '../app.state';
import {M2InfoComponent} from '../dialogs/m2-info.component';
import {BehaviorSubject} from 'rxjs';
import {Observable} from 'rxjs/Rx';
import {isPlatformBrowser, isPlatformServer} from '@angular/common';
import {M2Util} from '../utils/m2-util';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';

/**
 * Events
 */
export const APP_CLEAR_ALL_STATES = 'APP_CLEAR_ALL_STATES';
export const APP_SERVER_DOWN_FOR_MAINTENANCE = 'APP_SERVER_DOWN_FOR_MAINTENANCE';
export const APP_SIGN_OUT = 'APP_SIGN_OUT';
export const APP_SIGN_IN = 'APP_SIGN_IN';
export const APP_SESSION_EXPIRED = 'APP_SESSION_EXPIRED';

/**
 *
 */
@Injectable()
export class M2Service implements OnDestroy {

    /**
     * Class level-declarations.
     */
    private static NOTIFY_TIMEOUT = 4500;
    private notifyHandle: any;
    private notifyStart = 0;
    protected m2State: Observable<M2>;
    private routerSubscription: any;
    public m2: M2;
    public appEvents = new EventEmitter<any>();
    public isBrowser = false;

    /**
     *
     * @param appConfig
     * @param {Title} title
     * @param {Meta} meta
     * @param {Router} router
     * @param {HttpClient} httpClient
     * @param {DomSanitizer} domSanitizer
     * @param {MatDialog} matDialog
     * @param {MatSnackBar} matSnackBar
     * @param {Store<AppState>} store
     * @param {ComponentFactoryResolver} componentFactoryResolver
     * @param {ApplicationRef} applicationRef
     * @param {Injector} injector
     * @param platformId
     * @param {ActivatedRoute} activatedRoute
     */
    constructor(@Inject('AppConfig') protected appConfig: any, protected title: Title, protected meta: Meta, protected router: Router, protected httpClient: HttpClient, protected domSanitizer: DomSanitizer, protected matDialog: MatDialog, protected matSnackBar: MatSnackBar, protected store: Store<AppState>, protected componentFactoryResolver: ComponentFactoryResolver, protected applicationRef: ApplicationRef, protected injector: Injector, @Inject(PLATFORM_ID) protected platformId: any, protected activatedRoute: ActivatedRoute) {
        if (isPlatformBrowser(this.platformId)) {
            this.isBrowser = true;
        }
        if (isPlatformServer(this.platformId)) {
            this.isBrowser = false;
        }
        this.m2State = this.store.select('m2');
        this.m2State.subscribe((m2: M2) => {
            this.m2 = m2;
        });
        // this.routerSubscription = this.router.events.subscribe((event) => {
        //     if (event instanceof NavigationEnd && this.isBrowser) {
        //         this.createOrUpdateMeta(event.url);
        //     }
        // });
        // this.activatedRoute.queryParams.subscribe(params => {
        //     if (params['sessionId'] && this.isBrowser) {
        //         this.m2.sessionId = params['sessionId'];
        //         this.store.dispatch(new M2Action(M2Action.M2_UPDATE, this.m2));
        //         this.refresh().subscribe(response => {
        //             if (response.status === 'OK') {
        //                 this.appEvents.emit({type: APP_SIGN_IN, account: response.account});
        //             }
        //         });
        //     }
        // });
    }

    /**
     *
     */
    ngOnDestroy() {
        this.routerSubscription.unsubscribe();
    }

    /**
     *
     */
    public scrollToTop(): void {
        if (typeof window !== 'undefined') {
            window.scrollTo(0, 0);
        }
    }

    /**
     *
     * @param {string} url
     */
    public createOrUpdateMeta(url: string): void {
        // this.post('m2.action.meta.FindByUrlAction', {url: url}).subscribe(response => {
        //     if (response.status === 'OK') {
        //         for (const _meta of response.metas) {
        //             if (_meta.name === 'title') {
        //                 this.title.setTitle(_meta.content);
        //             }

        //             const tag = {name: _meta.name, content: _meta.content ? _meta.content : ''};
        //             if (!this.meta.getTag('name="' + _meta.name + '"')) {
        //                 this.meta.addTag(tag);
        //             } else {
        //                 this.meta.updateTag(tag);
        //             }
        //         }
        //     }
        // });
    }

    /**
     *
     * @param routes
     */
    public createMetas(routes: any): void {
        this.post('m2.action.meta.CreateAction', {routes: routes}).subscribe(response => {
        });
    }

    /**
     *
     */
    public refresh(): any {
        return this.post('m2.action.account.RefreshAction', {});
    }

    /**
     *
     * @param type
     * @param context
     * @returns {any}
     * https://github.com/aaronfrost/AFSpawnService
     */
    public createComponent(type: any, context?: any): any {

        // Create component and add it to the DOM.
        const factory = this.componentFactoryResolver.resolveComponentFactory(type);
        const componentRef = factory.create(this.injector);
        this.applicationRef.attachView(componentRef.hostView);

        const element = typeof window !== 'undefined' ? document.getElementById('m2PopUpComponent') : null;
        if (element) {
            element.appendChild((componentRef.hostView as any).rootNodes[0]);
        } else {
            if (typeof window !== 'undefined') {
                document.body.appendChild((componentRef.hostView as any).rootNodes[0]);
            }
        }

        // Set inputs.
        const contextBehaviorSubject = new BehaviorSubject(context);
        factory.inputs.forEach(i => {
            if (context[i.propName] !== undefined) {
                componentRef.instance[i.propName] = context[i.propName];
            }
        });

        const next = (data) => {
            contextBehaviorSubject.next(data);
        };
        const destroy = () => {
            componentRef.destroy();
        };

        return {
            destroy,
            next,
        };
    }

    /**
     *
     * @param {string} message
     * @param {string} notifyClassName
     */
    private notify(message: string, notifyClassName: string): void {
        if (this.notifyHandle) {
            this.notifyHandle.destroy();
        }
        this.notifyHandle = this.createComponent(M2NotificationComponent, {message: message, notifyClassName: notifyClassName, timeout: M2Service.NOTIFY_TIMEOUT});
        this.notifyStart = Date.now() + M2Service.NOTIFY_TIMEOUT;
        setTimeout(() => {
            if (this.notifyStart < Date.now()) {
                this.notifyHandle.destroy();
            }
        }, M2Service.NOTIFY_TIMEOUT + 100);
    }

    /**
     *
     * @param message
     */
    public error(message: string): void {
        this.notify(message, 'm2-alert');
    }

    /**
     *
     * @param message
     */
    public success(message: string) {
        this.notify(message, 'm2-success');
    }

    /**
     *
     * @param message
     */
    public info(message: string) {
        this.notify(message, 'm2-info');
    }

    /**
     *
     * @param message
     * @param ok
     */
    public confirm(message: string, ok: any): void {
        this.matDialog.open(M2ConfirmComponent, {
            disableClose: false,
            width: '600px',
            height: '',
            position: {
                top: '100px',
                bottom: '',
                left: '',
                right: ''
            },
            data: {
                message: message,
                ok: ok
            }
        });
    }

    /**
     *
     * @param {string} message
     * @param ok
     */
    public openInfo(message: string, ok: any): void {
        this.matDialog.open(M2InfoComponent, {
            width: '600px',
            data: {
                message: message,
                ok: ok
            }
        });
    }

    /*
    public getLatitudeAndLongitude(address: string, geometry?: (latitude: number, longitude: number) => void): void {
        this.httpClient.get('https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURI(address)).subscribe((data) => {
            geometry(data.results[0].geometry.location.lat, data.results[0].geometry.location.lng);
        });
    }
    */

    /**
     *
     * @param {string} className
     * @param json
     * @returns {Observable<any | any>}
     */
    public post(className: string, json: any): any {
        let url = this.getUrl(this.appConfig.m2Url) + '/Action?className=' + className + '&appId=' + this.appConfig.m2AppId + '&version=' + this.appConfig.m2AppVersion;
        if (this.m2.sessionId) {
            url += '&sessionId=' + this.m2.sessionId;
        }

        return this.httpClient.post(url, JSON.stringify(json), {headers: {'Content-Type': 'application/json'}}).do(response => {
            this.handleResponse(response);
        }).catch((e: any) => {
            if (e.status === 0) {
                this.store.dispatch(new M2Action(M2Action.M2_INITIAL_STATE));
                this.appEvents.emit({type: APP_SERVER_DOWN_FOR_MAINTENANCE});
                return Observable.throwError({status: APP_SERVER_DOWN_FOR_MAINTENANCE});
            } else {
                this.handleResponse(e.error);
                return new Observable<any>(observer => {
                    observer.next(e.error);
                    observer.complete();
                });
            }
        });
    }

    /**
     *
     * @param response
     */
    private handleResponse(response: any): void {
        if (response.status === 'INVALID_SESSION_ID') {
            this.store.dispatch(new M2Action(M2Action.M2_INITIAL_STATE));
            this.appEvents.emit({type: APP_SESSION_EXPIRED});
        } else {
            if (response.sessionId) {
                this.m2.sessionId = response.sessionId;
            }
            if (response.account) {
                this.m2.account = response.account;
            }
            if (response.alerts) {
                this.m2.alerts = response.alerts;
            }
            this.store.dispatch(new M2Action(M2Action.M2_UPDATE, this.m2));
        }
    }

    /**
     *
     */
    public signOut(): void {
        this.store.dispatch(new M2Action(M2Action.M2_INITIAL_STATE));
        this.appEvents.emit({type: APP_SIGN_OUT});
    }

    /**
     *
     */
    public isSignedIn(): boolean {
        return (this.m2 && this.m2.account) ? true : false;
    }

    /**
     *
     */
    public isAdmin(): boolean {
        return (this.m2 && this.m2.account && this.m2.account.type === AccountType.Admin) ? true : false;
    }

    /**
     *
     */
    public isAppAdmin(): boolean {
        return (this.m2 && this.m2.account && this.m2.account.type === AccountType.AppAdmin) ? true : false;
    }

    /**
     *
     * @param {string} cardNumber
     * @param cvc
     * @param {string} expMonth
     * @param {string} expYear
     * @returns {any}
     */
    public createStripeCardToken(cardNumber: string, cvc: any, expMonth: string, expYear: string): any {
        return null;
        // const url = 'https://api.stripe.com/v1/tokens';
        // return this.httpClient.post(url, 'card[number]=' + cardNumber + '&card[exp_month]=' + expMonth + '&card[exp_year]=' + expYear + '&card[cvc]=' + cvc + '&card[currency]=usd', {headers: {'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Bearer ' + this.appConfig.stripePublishableKey}}).map(response => response.id);
    }

    /**
     *
     * @param {string} country
     * @param {string} routingNumber
     * @param {string} accountNumber
     * @param {string} type
     * @returns {any}
     */
    public createStripeBankToken(country: string, routingNumber: string, accountNumber: string, type: string): any {

        return null;
        //const url = 'https://api.stripe.com/v1/tokens';
        // return this.httpClient.post(url, 'bank_account[country]=' + country + '&bank_account[routing_number]=' + routingNumber + '&bank_account[account_number]=' + accountNumber + '&bank_account[account_holder_type]=' + type, {headers: {'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Bearer ' + this.appConfig.stripePublishableKey}}).map(response => response.id);
    }

    /**
     *
     * @returns {boolean}
     */
    public anyAlerts(): boolean {
        return (this.m2 && this.m2.alerts && this.m2.alerts.length > 0) ? true : false;
    }

    /**
     *
     * @param alertId
     */
    public markAlertAsRead(alertId: string): void {
        this.post('m2.action.alert.MarkAsReadAction', {'alertId': alertId}).subscribe(response => {
            /*
            if (response.status === 'OK') {
                if (this.m2.alerts) {
                    let index = 0;
                    for (const alert of this.m2.alerts) {
                        if (alert.alertId === alertId) {
                            this.m2.alerts.splice(index, 1);
                            return;
                        }
                        index++;
                    }
                }
            }
            */
        });
    }

    /**
     *
     * @param media
     * @returns {SafeUrl}
     */
    public toSafeMediaUrl(media: Media): any {
        return this.domSanitizer.bypassSecurityTrustUrl(media.url);
    }

    /**
     *
     * @param url
     * @returns {SafeUrl}
     */
    public toSafeUrl(url: string): any {
        return this.domSanitizer.bypassSecurityTrustUrl(url);
    }

    /**
     *
     * @param html
     * @returns {SafeHtml}
     */
    public toSafeHtml(html: string): any {
        return this.domSanitizer.bypassSecurityTrustHtml(html);
    }

    /**
     *
     * @param item
     * @returns {SafeStyle}
     */
    public toSafeStyle(url: any): any {
        return this.domSanitizer.bypassSecurityTrustStyle('url(' + url + ')');
    }

    /**
     *
     * @param string
     * @returns {string}
     */
    public capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    /**
     *
     * @param value
     * @returns {boolean}
     */
    public isEmptyOrNull(value: string) {
        if (value && value.trim() !== '') {
            return false;
        }
        return true;
    }

    /**
     *
     * @param value
     * @returns {number}
     */
    public toNumber(value: string): number {
        return Math.round(+(Number(value.replace(/[^0-9\.-]+/g, '')) * 100));
    }

    /**
     *
     * @param value
     * @returns {string}
     */
    public formatCurrency(value: string): string {

        const parts = value.replace(/\,/g, '').replace(/\$/ig, '').toString().split('.');

        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        return '$' + parts.join('.');
    }

    /**
     *
     * @param date
     * @returns {string}
     */
    public toIsoString(date: Date): string {
        return moment(date).format('YYYY-MM-DDTHH:mm:ssZZ');
    }

    /**
     *
     * @returns {Date}
     */
    public toStartOfDay(date: Date): Date {
        return new Date(new Date(date.getTime()).setHours(0, 0, 0, 0));
    }

    /**
     *
     * @returns {Date}
     */
    public toEndOfDay(date: Date): Date {
        return new Date(new Date(date.getTime()).setHours(23, 59, 59, 999));
    }

    /**
     *
     * @param dateFrom
     * @param dateTo
     * @returns {number}
     */
    public daysBetween(dateFrom: Date, dateTo: Date) {
        return Math.abs(Math.floor(dateTo.getTime() / (3600 * 24 * 1000)) - Math.floor(dateFrom.getTime() / (3600 * 24 * 1000)));
    }

    /**
     *
     * @param url
     * @returns {string}
     */
    public getUrl(url: string): string {
        return url.endsWith('/') ? url = url.substring(0, url.length - 1) : url;
    }

    /**
     *
     * @param value
     * @returns {string}
     */
    public toCurrency(value: number): string {
        return '$' + (value / 100).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
    }

    /**
     *
     * @param vendor
     */
    public getOAuthVendor(vendor: number): string {

        // Vendor?
        switch (vendor) {
            case OAuthVendor.Twitter:
                return 'Twitter';
            case OAuthVendor.Facebook:
                return 'Facebook';
            case OAuthVendor.Pinterest:
                return 'Pinterest';
            case OAuthVendor.Lightspeed:
                return 'Lightspeed';
            case OAuthVendor.Square:
                return 'Square';
            case OAuthVendor.Wordpress:
                return 'Wordpress';
            case OAuthVendor.Medium:
                return 'Medium';
            case OAuthVendor.LinkedIn:
                return 'LinkedIn';
            case OAuthVendor.Google:
                return 'Google';
        }
    }
}
