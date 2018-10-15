import {AfterContentInit, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {Transaction} from '../../store/states/transaction';
import {AppState} from '../../app.state';
import {Store} from '@ngrx/store';
import {Config} from '../../store/states/config';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {APP_REFRESH} from '../../app.component';
import {TransactionType} from '../../store/states/transaction-type';

declare const BrowserSolc: any;

/**
 *
 */
@Component({
    selector: 'app-smart-contract-deploy',
    templateUrl: './smart-contract-deploy.component.html',
    styleUrls: ['./smart-contract-deploy.component.scss']
})
export class SmartContractDeployComponent implements OnInit, AfterContentInit, OnDestroy {

    /**
     * Class Level-declarations
     */
    public releases = [];
    public release: any = false;
    public configState: Observable<Config>;
    public config: Config;
    public configSubscription: any;
    public code = 'contract x { function g() {} }';
    public errors = [];
    public compiling = false;
    public contract: any;
    public deploying = false;
    public hash: string;
    public options: any;

    /**
     *
     * @param appService
     * @param {Store<AppState>} store
     * @param {HttpClient} httpClient
     */
    constructor(@Inject('AppService') public appService: any, private store: Store<AppState>, private httpClient: HttpClient) {
        this.configState = this.store.select('config');
        this.configSubscription = this.configState.subscribe((config: Config) => {
            this.config = config;
        });
    }

    /**
     *
     */
    ngOnInit() {
    }

    /**
     *
     */
    ngAfterContentInit() {
        this.getReleases();
    }

    private getReleases() {
        try {
            BrowserSolc.getVersions((_, soljsonReleases) => {
                for (let key in soljsonReleases) {
                    if (key.split('.')[1] === '4') {
                        this.releases.push({release: key, source: soljsonReleases[key]});
                    }
                }
                this.release = this.releases[0];
            });
        } catch (e) {
            setTimeout(() => {
                this.getReleases();
            }, 10);
        }
    }

    /**
     *
     */
    ngOnDestroy() {
        this.configSubscription.unsubscribe();
    }

    /**
     *
     * @param code
     */
    public onChange(code) {
        this.code = code;
    }

    /**
     *
     */
    public compile(): void {
        this.errors = [];
        this.contract = null;
        this.compiling = true;
        BrowserSolc.loadVersion(this.release.source, (compiler) => {
            const optimize = 1;
            const result = compiler.compile(this.code, optimize);
            this.compiling = false;
            this.errors = result.errors;
            this.contract = result.contracts[Object.keys(result.contracts)[0]];
        });
    }

    /**
     *
     */
    public deploy(): void {
        const mdDialogRef = this.appService.openAccount();
        const mdDialogRefSubscription = mdDialogRef.afterClosed().subscribe(result => {
            mdDialogRefSubscription.unsubscribe();
            if (!result) {
                return;
            }

            const transaction: Transaction = {
                type: TransactionType.DeploySmartContract,
                from: this.config.account.address,
                to: '',
                value: 0,
                code: this.contract.bytecode,
                abi: this.contract.interface
            } as any;

            this.appService.hashAndSign(this.config.account.privateKey, transaction);
            this.deploying = true;
            const url = 'http://' + this.config.selectedDelegate.httpEndpoint.host + ':' + this.config.selectedDelegate.httpEndpoint.port + '/v1/transactions';
            this.httpClient.post(url, JSON.stringify(transaction), {headers: {'Content-Type': 'application/json'}}).subscribe((response: any) => {
                this.hash = transaction.hash;
                this.getStatus();
            });
        });
    }

    /**
     *
     */
    private getStatus(): void {
        setTimeout(() => {
            const url = 'http://' + this.config.selectedDelegate.httpEndpoint.host + ':' + this.config.selectedDelegate.httpEndpoint.port + '/v1/transactions/' + this.hash;
            return this.httpClient.get(url, {headers: {'Content-Type': 'application/json'}}).subscribe((response: any) => {
                if (response.status !== 'Ok') {
                    this.appService.error(response.status);
                    return;
                }
                if (response.data.receipt.status != 'Ok') {
                    this.getStatus();
                    return;
                }
                this.deploying = false;
                this.appService.success('Smart contract deployed.');
                this.appService.appEvents.emit({type: APP_REFRESH});
            });
        }, 500);
    }
}
