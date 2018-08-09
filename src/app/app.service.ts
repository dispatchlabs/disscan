import {ApplicationRef, ComponentFactoryResolver, Inject, Injectable, Injector, OnDestroy, PLATFORM_ID} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {DomSanitizer, Meta, Title} from '@angular/platform-browser';
import {MatDialog, MatSnackBar} from '@angular/material';
import {Store} from '@ngrx/store';
import {AppState} from './app.state';
import {APP_SERVER_DOWN_FOR_MAINTENANCE, APP_SIGN_OUT, M2Service} from './m2-angular/services/m2.service';
import {SendTokensDialogComponent} from './dialogs/send-tokens/send-tokens-dialog.component';
import {TransactionDialogComponent} from './dialogs/transaction/transaction-dialog.component';
import {Transaction} from './store/states/transaction';
import {Observable} from 'rxjs';
import {Config} from './store/states/config';
import * as keccak from 'keccak';
import * as secp256k1 from 'secp256k1';
import {ConfigAction} from './store/reducers/config.reducer';
import {Account} from './store/states/account';
import {HttpClient} from '@angular/common/http';
import {TransactionType} from './store/states/transaction-type';
import {environment} from '../environments/environment';
import {AccountDialogComponent} from './dialogs/account/account-dialog.component';


declare const Buffer;

/**
 *
 */
@Injectable()
export class AppService extends M2Service implements OnDestroy {

    /**
     * Class level-declarations.
     */
    private mdDialogRef: any;
    private appEventSubscription: any;
    public configState: Observable<Config>;
    public config: Config;
    public configSubscription: any;

    /**
     *
     * @param appConfig
     * @param {Title} title
     * @param {Meta} meta
     * @param {Router} router
     * @param {HttpClient} httpClient
     * @param {DomSanitizer} domSanitizer
     * @param {MatDialog} mdDialog
     * @param {MatSnackBar} mdSnackBar
     * @param {Store<AppState>} store
     * @param {ComponentFactoryResolver} componentFactoryResolver
     * @param {ApplicationRef} applicationRef
     * @param {Injector} injector
     * @param platformId
     * @param {ActivatedRoute} activatedRoute
     */
    constructor(@Inject('AppConfig') protected appConfig: any, protected title: Title, protected meta: Meta, protected router: Router, protected httpClient: HttpClient, protected domSanitizer: DomSanitizer, protected mdDialog: MatDialog, protected mdSnackBar: MatSnackBar, protected store: Store<AppState>, protected componentFactoryResolver: ComponentFactoryResolver, protected applicationRef: ApplicationRef, protected injector: Injector, @Inject(PLATFORM_ID) protected platformId: any, protected activatedRoute: ActivatedRoute) {
        super(appConfig, title, meta, router, httpClient, domSanitizer, mdDialog, mdSnackBar, store, componentFactoryResolver, applicationRef, injector, platformId, activatedRoute);
        this.appEventSubscription = this.appEvents.subscribe((data: any) => {
            if (!data || !data.type) {
                return;
            }
        });
        this.configState = this.store.select('config');
        this.configSubscription = this.configState.subscribe((config: Config) => {
            this.config = config;
        });
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
    public navigateToHome() {
        if (typeof window !== 'undefined') {
            window.scrollTo(0, 0);
        }
        this.router.navigate(['/']);
    }

    /**
     *
     */
    public navigateToSmartContract() {
        if (typeof window !== 'undefined') {
            window.scrollTo(0, 0);
        }
        this.router.navigate(['/smart-contract']);
    }

    /**
     *
     */
    public navigateToMeta() {
        if (typeof window !== 'undefined') {
            window.scrollTo(0, 0);
        }
        this.router.navigate(['/meta']);
    }

    /**
     *
     */
    public navigatetoBlog() {
        if (typeof window !== 'undefined') {
            window.scrollTo(0, 0);
        }
        this.router.navigate(['/blog']);
    }

    /**
     *
     */
    public closeCurrentDialog(): void {
        if (this.mdDialogRef) {
            this.mdDialogRef.close();
        }
    }

    /**
     *
     * @returns {MatDialogRef<SendTokensDialogComponent>}
     */
    public openSendTokens(): any {
        return this.mdDialogRef = this.mdDialog.open(SendTokensDialogComponent, {
            width: '600px',
            height: '',
            position: {
                top: '16px',
                bottom: '',
                left: '',
                right: ''
            },
        });
    }

    /**
     *
     * @returns {any}
     */
    public openAccount(): any {
        return this.mdDialogRef = this.mdDialog.open(AccountDialogComponent, {
            width: '600px',
            height: '',
            position: {
                top: '16px',
                bottom: '',
                left: '',
                right: ''
            },
            data: {
            }
        });
    }


    /**
     *
     * @param {Transaction} transaction
     * @returns {any}
     */
    public openTransaction(transaction: Transaction): any {
        return this.mdDialogRef = this.mdDialog.open(TransactionDialogComponent, {
            width: '600px',
            height: '',
            position: {
                top: '16px',
                bottom: '',
                left: '',
                right: ''
            },
            data: {
                transaction: transaction
            }
        });
    }

    /**
     *
     * @returns {Account}
     */
    public generateNewAccount(): void {
        const privateKey = new Buffer(32);
        do {
            crypto.getRandomValues(privateKey);
        } while (!secp256k1.privateKeyVerify(privateKey));
        const publicKey = secp256k1.publicKeyCreate(privateKey, false);

        const account: Account = {
            address: Buffer.from(this.toAddress(publicKey)).toString('hex'),
            privateKey: Buffer.from(privateKey).toString('hex'),
            balance: 0,
            name: 'New Wallet'
        };
        this.config.account = account;
        this.store.dispatch(new ConfigAction(ConfigAction.CONFIG_UPDATE, this.config));
    }

    /**
     *
     * @param {string} privateKey
     * @returns {string} address
     */
    public getAddressFromPrivateKey(privateKey: string): string {
        return this.toAddress(secp256k1.publicKeyCreate(Buffer.from(privateKey, 'hex'), false)).toString('hex');
    }

    /**
     *
     * @param publicKey
     * @returns {any}
     */
    public toAddress(publicKey: any): any {

        // Hash publicKey.
        const hashablePublicKey = new Buffer(publicKey.length - 1);
        for (let i = 0; i < hashablePublicKey.length; i++) {
            hashablePublicKey[i] = publicKey[i + 1];
        }
        const hash = keccak('keccak256').update(hashablePublicKey).digest();

        // Create address.
        const address = new Buffer(20);
        for (let i = 0; i < address.length; i++) {
            address[i] = hash[i + 12];
        }
        return address;
    }

    /**
     *
     * @param {string} privateKey
     * @param {Transaction} transaction
     */
    public hashAndSign(privateKey: string, transaction: Transaction): void {

        // Set time.
        transaction.time = new Date().getTime();

        // Create hash.
        let hash: any;
        const from = Buffer.from(transaction.from, 'hex');
        const to = Buffer.from(transaction.to, 'hex');
        const value = this.numberToBuffer(transaction.value);
        const time = this.numberToBuffer(transaction.time);
        const abi = this.stringToBuffer(transaction.abi || '');
        
        // Type?
        switch (transaction.type) {
            case TransactionType.TransferTokens:
                hash = keccak('keccak256').update(Buffer.concat([Buffer.from('00', 'hex'), from, to, value, time])).digest();
                break;
            case TransactionType.DeploySmartContract:
                const code = Buffer.from(transaction.code, 'hex');
                hash = keccak('keccak256').update(Buffer.concat([Buffer.from('01', 'hex'), from, to, value, code, abi, time])).digest();
                break;
            case TransactionType.ExecuteSmartContract:
                const method = this.stringToBuffer(transaction.method);
                hash = keccak('keccak256').update(Buffer.concat([Buffer.from('02', 'hex'), from, to, value, abi, method, time])).digest();
                break;
        }
        transaction.hash = hash.toString('hex');

        // Create signature.
        const signature = secp256k1.sign(hash, Buffer.from(privateKey, 'hex'));
        const signatureBytes = new Uint8Array(65);
        for (let i = 0; i < 64; i++) {
            signatureBytes[i] = signature.signature[i];
        }
        signatureBytes[64] = signature.recovery;
        transaction.signature = new Buffer(signatureBytes).toString('hex');
    }

    /**
     *
     * @param {string} value
     * @returns {any}
     */
    private stringToBuffer(value: string): any {
        const bytes = [];
        for (let i = 0; i < value.length; i++) {
            bytes.push(value.charCodeAt(i));
        }
        return new Buffer(bytes);
    }

    /**
     *
     * @param {number} value
     * @returns {any}
     */
    private numberToBuffer(value: number): any {
        const bytes = [0, 0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < bytes.length; i++) {
            const byte = value & 0xff;
            bytes [i] = byte;
            value = (value - byte) / 256;
        }
        return new Buffer(bytes);
    }

    /**
     *
     * @returns {any}
     */
    public getTransactions(): any {
        const url = 'http://' + this.config.selectedDelegate.httpEndpoint.host + ':' + this.config.selectedDelegate.httpEndpoint.port + '/v1/transactions';
        return this.httpClient.get(url, {headers: {'Content-Type': 'application/json'}});
    }

    /**
     *
     * @returns {any}
     */
    public getTransactionReceipt(hash: string): any {
        const url = 'http://' + this.config.selectedDelegate.httpEndpoint.host + ':' + this.config.selectedDelegate.httpEndpoint.port + '/v1/receipts/' + hash;
        return this.httpClient.get(url, {headers: {'Content-Type': 'application/json'}});
    }

    /**
     *
     * @returns {any}
     */
    public getTransactionsFrom(address: string): any {
        const url = 'http://' + this.config.selectedDelegate.httpEndpoint.host + ':' + this.config.selectedDelegate.httpEndpoint.port + '/v1/transactions/from/' + address;
        return this.httpClient.get(url, {headers: {'Content-Type': 'application/json'}});
    }

    /**
     *
     * @returns {any}
     */
    public getDelegates(): any {
        const url = 'http://' + environment.seedNodeHost + '/v1/delegates';
        return this.httpClient.get(url, {headers: {'Content-Type': 'application/json'}});
    }
}

