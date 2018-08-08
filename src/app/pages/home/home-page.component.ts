import {Component, OnInit, AfterViewInit, OnDestroy, Inject, ViewChild, ElementRef} from '@angular/core';
import {AppService} from '../../app.service';
import {Router} from '@angular/router';
import {Config} from '../../store/states/config';
import {AppState} from '../../app.state';
import {Store} from '@ngrx/store';
import {APP_REFRESH} from '../../app.component';
import {Node} from '../../store/states/node';
import {Transaction} from '../../store/states/transaction';
import {DataSource} from '@angular/cdk/collections';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {M2Util} from '../../m2-angular/utils/m2-util';
import {KeyHelper} from '../../m2-angular/helpers/key-helper';
import {ConfigAction} from '../../store/reducers/config.reducer';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {TransactionType} from '../../store/states/transaction-type';

/**
 *
 */
class TransactionDatabase {

    /**
     * Class level-declarations.
     */
    public transactionBehaviorSubject: BehaviorSubject<Transaction[]> = new BehaviorSubject<Transaction[]>([]);

    /**
     *
     * @returns {Transaction[]}
     */
    get data(): Transaction[] {
        return this.transactionBehaviorSubject.value;
    }

    /**
     *
     * @param {Transaction[]} transactions
     */
    constructor(transactions: Transaction[]) {
        this.transactionBehaviorSubject.next(transactions);
    }
}

/**
 *
 */
class TransactionDataSource extends DataSource<any> {

    /**
     *
     * @param {TransactionDatabase} transactionDatabase
     */
    constructor(private transactionDatabase: TransactionDatabase) {
        super();
    }

    /**
     *
     * @returns {Observable<Transaction[]>}
     */
    connect(): Observable<Transaction[]> {
        return this.transactionDatabase.transactionBehaviorSubject;
    }

    /**
     *
     */
    disconnect() {
    }
}

/**
 * HomePageComponent
 */
@Component({
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit, AfterViewInit, OnDestroy {

    /**
     * Class Level Declarations
     */
    @ViewChild('getStartedDiv')
    public getStartedDiv: any;
    public loading = true;
    public refreshOverlay = false;
    public configState: Observable<Config>;
    public config: Config;
    public configSubscription: any;
    private appEventSubscription: any;
    public transactions: Transaction [];
    public dataSource: TransactionDataSource | null;
    public displayedColumns = ['to', 'value', 'time', 'type'];
    public search: string;
    public KeyHelper = KeyHelper;

    /**
     *
     * @param appService
     * @param {Router} router
     * @param {HttpClient} http
     * @param {Store<AppState>} store
     */
    constructor(@Inject('AppService') public appService: any, private router: Router, private http: HttpClient, private store: Store<AppState>) {
        this.configState = this.store.select('config');
        this.configSubscription = this.configState.subscribe((config: Config) => {
            this.config = config;
        });
        this.appEventSubscription = this.appService.appEvents.subscribe((event: any) => {
            switch (event.type) {
                case APP_REFRESH:
                    this.getTransactions();
                    return;
            }
        });
    }

    /**
     *
     */
    ngOnInit() {
        this.refresh();
    }

    /**
     *
     */
    ngAfterViewInit() {
    }

    /**
     *
     */
    ngOnDestroy() {
        this.configSubscription.unsubscribe();
        this.appEventSubscription.unsubscribe();
    }

    /**
     *
     */
    public refresh(): void {
        this.loading = true;
        setTimeout(() => {
            this.loading = false;
        }, 500);
        this.appService.getDelegates().subscribe((response: any) => {
            this.loading = false;
            if (response.status !== 'Ok') {
                this.loading = false;
                this.appService.error(response.status);
                return;
            }
            this.config.delegates = response.data;
            if (!this.config.selectedDelegate) {
                this.config.selectedDelegate = this.config.delegates[0];
            }
            this.getTransactions();

            for (let i = 0; i < this.config.delegates.length; i++) {
                this.config.delegates[i].address = 'Delegate ' + i;
            }
            this.store.dispatch(new ConfigAction(ConfigAction.CONFIG_UPDATE, this.config));
        });
    }

    /**
     *
     * @param {Node} delegate
     */
    public select(delegate: Node): void {
        this.config.selectedDelegate = delegate;
        this.store.dispatch(new ConfigAction(ConfigAction.CONFIG_UPDATE, this.config));
        this.getTransactions();
    }

    /**
     *
     */
    public getTransactions(): void {
        if (!this.config.selectedDelegate) {
            return;
        }
        this.refreshOverlay = true;
        setTimeout(() => {
            this.refreshOverlay = false;
            if (this.transactions && this.transactions.length > 0) {
                this.dataSource = new TransactionDataSource(new TransactionDatabase(this.transactions));

            }
        }, 500);
        if (M2Util.isNullOrEmpty(this.search)) {
            this.appService.getTransactions().subscribe(response => {
                this.transactions = response.data;
                for (const transaction of this.transactions) {
                    switch (transaction.type) {
                        case TransactionType.TransferTokens:
                            transaction.typeLabel = 'Transfer Tokens';
                            break;
                        case TransactionType.DeploySmartContract:
                            transaction.typeLabel = 'Deploy Smart Contract';
                            break;
                        case TransactionType.ExecuteSmartContract:
                            transaction.typeLabel = 'Execute Smart Contract';
                            break;
                    }
                }
            });
        } else {
            this.appService.getTransactionsFrom(this.search).subscribe(response => {
                this.transactions = response.data;
                for (const transaction of this.transactions) {
                    switch (transaction.type) {
                        case TransactionType.TransferTokens:
                            transaction.typeLabel = 'Transfer Tokens';
                            break;
                        case TransactionType.DeploySmartContract:
                            transaction.typeLabel = 'Deploy Smart Contract';
                            break;
                        case TransactionType.ExecuteSmartContract:
                            transaction.typeLabel = 'Execute Smart Contract';
                            break;
                    }
                }
            });
        }
    }
}
