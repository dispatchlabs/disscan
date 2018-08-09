import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {AppService} from '../../app.service';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Observable} from 'rxjs/Observable';
import {Config} from '../../store/states/config';
import {AppState} from '../../app.state';
import {Store} from '@ngrx/store';
import {Transaction} from '../../store/states/transaction';
import {KeyHelper} from '../../m2-angular/helpers/key-helper';
import {HttpClient} from '@angular/common/http';
import {APP_REFRESH} from '../../app.component';
import {TransactionType} from '../../store/states/transaction-type';

/**
 *
 */
@Component({
    selector: 'app-send-tokens-dialog',
    templateUrl: './send-tokens-dialog.component.html',
    styleUrls: ['./send-tokens-dialog.component.scss']
})
export class SendTokensDialogComponent implements OnInit, OnDestroy {

    /**
     * Class Level Declarations
     */
    public formGroup: FormGroup;
    public spinner = false;
    public configState: Observable<Config>;
    public config: Config;
    public configSubscription: any;
    private hash: string;
    public KeyHelper = KeyHelper;

    /**
     *
     * @param appService
     * @param {MatDialogRef<AccountDialogComponent>} mdDialogRef
     * @param {FormBuilder} formBuilder
     * @param {Store<AppState>} store
     * @param {HttpClient} httpClient
     */
    constructor(@Inject('AppService') public appService: any, private mdDialogRef: MatDialogRef<SendTokensDialogComponent>, private formBuilder: FormBuilder, private store: Store<AppState>, private httpClient: HttpClient) {
        this.configState = this.store.select('config');
        this.configSubscription = this.configState.subscribe((config: Config) => {
            this.config = config;
        });
        this.formGroup = formBuilder.group({
            privateKey: new FormControl(this.config.account == null ? '' : this.config.account.privateKey, Validators.compose([Validators.required, Validators.minLength(64)])),
            to: new FormControl('', Validators.compose([Validators.required, Validators.minLength(40)])),
            tokens: new FormControl(45, Validators.compose([Validators.required, Validators.min(1)])),
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
    ngOnDestroy() {
        this.configSubscription.unsubscribe();
    }

    /**
     *
     */
    public close(): void {
        this.mdDialogRef.close();
    }

    /**
     *
     */
    public send(): void {
        this.appService.confirm('<p>Are you sure you want to send <b>' + this.formGroup.get('tokens').value + '</b> tokens to:</p> ' + this.formGroup.get('to').value + '?', () => {
            const transaction: Transaction = {
                type: TransactionType.TransferTokens,
                from: this.appService.getAddressFromPrivateKey(this.formGroup.get('privateKey').value),
                to: this.formGroup.get('to').value,
                value: parseInt(this.formGroup.get('tokens').value, 10)
            } as any;

            this.appService.hashAndSign(this.formGroup.get('privateKey').value, transaction);
            this.spinner = true;
            const url = 'http://' + this.config.selectedDelegate.httpEndpoint.host + ':' + this.config.selectedDelegate.httpEndpoint.port + '/v1/transactions';
            this.httpClient.post(url, JSON.stringify(transaction), {headers: {'Content-Type': 'application/json'}}).subscribe ((response: any) => {
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
            const url = 'http://' + this.config.selectedDelegate.httpEndpoint.host + ':' + this.config.selectedDelegate.httpEndpoint.port + '/v1/receipts/' + this.hash;
            return this.httpClient.get(url, {headers: {'Content-Type': 'application/json'}}).subscribe( (response: any) => {
                if (response.status === 'Pending') {
                    this.getStatus();
                    return;
                }

                if (response.status === 'Ok') {
                    this.close();
                    this.appService.success('Tokens sent.');
                    this.appService.appEvents.emit({type: APP_REFRESH});
                } else {
                    this.close();
                    this.appService.error(response.status);
                }
            });
        }, 500);
    }

    /**
     *
     */
    public generatePrivateKeyAndAddress(): void {
        this.appService.generateNewAccount();
        this.formGroup.get('privateKey').setValue(this.config.account.privateKey);
        this.formGroup.get('address').setValue(this.config.account.address);
    }
}
