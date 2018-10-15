import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {AppService} from '../../app.service';
import {FormBuilder, FormControl, FormGroup, FormArray, Validators} from '@angular/forms';
import {Observable} from 'rxjs/Observable';
import {Config} from '../../store/states/config';
import {AppState} from '../../app.state';
import {Store} from '@ngrx/store';
import {Transaction} from '../../store/states/transaction';
import {HttpClient} from '@angular/common/http';
import {APP_REFRESH} from '../../app.component';
import {TransactionType} from '../../store/states/transaction-type';

/**
 *
 */
@Component({
    selector: 'app-execute-dialog',
    templateUrl: './execute-dialog.component.html',
    styleUrls: ['./execute-dialog.component.scss']
})
export class ExecuteDialogComponent implements OnInit, OnDestroy {

    /**
     * Class Level Declarations
     */
    public transaction: Transaction;
    public abi: any[];

    public formGroup: FormGroup;
    public spinner = false;
    public configState: Observable<Config>;
    public config: Config;
    public configSubscription: any;
    public hash: string;
    public methods: any;
    public paramsList: any[];

    /**
     *
     * @param appService
     * @param {MatDialogRef<AccountDialogComponent>} mdDialogRef
     * @param {FormBuilder} formBuilder
     * @param {Store<AppState>} store
     * @param {HttpClient} httpClient
     */
    constructor(@Inject('AppService') public appService: any, private mdDialogRef: MatDialogRef<ExecuteDialogComponent>, private formBuilder: FormBuilder, private store: Store<AppState>, private httpClient: HttpClient, @Inject(MAT_DIALOG_DATA) private data) {
        this.transaction = this.data.transaction;
        this.configState = this.store.select('config');
        this.configSubscription = this.configState.subscribe((config: Config) => {
            this.config = config;
        });
        this.methods = [];
        this.abi = JSON.parse(this.transaction.abi);
        this.abi.forEach((m) => {
            this.methods.push(m);
        });

        this.formGroup = formBuilder.group({
            privateKey: new FormControl(this.config.account == null ? null : this.config.account.privateKey, Validators.compose([Validators.required, Validators.minLength(64)])),
            method: new FormControl(null, [Validators.required]),
            params: formBuilder.array([]),
        });
    }

    /**
     *
     */
    ngOnInit() {
        this.formGroup.get('method').valueChanges.subscribe(val => {
            this.paramsList = this.abi[val].inputs;
            this.formGroup.controls['params'] = this.formBuilder.array([]);
            this.paramsList.forEach(item => {
                let defaultValue: any = '';
                switch(item.type) {
                case 'uint':
                case 'uint8':
                case 'uint16':
                case 'uint32':
                case 'uint64':
                case 'uint256':
                case 'int':
                case 'int8':
                case 'int16':
                case 'int32':
                case 'int64':
                case 'int256':
                    item.formType = 'number';
                    defaultValue = 0;
                    break;
                case 'bool':
                    item.formType = 'checkbox';
                    defaultValue = false;
                    break;
                default:
                    item.formType = 'text';
                }
                this.params.push(this.formBuilder.control(defaultValue, Validators.compose([Validators.required])));
            });
        });
    }

    /**
     *
     */
    ngOnDestroy() {
        this.configSubscription.unsubscribe();
    }

    get params() {
        return this.formGroup.controls['params'] as FormArray;
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
        this.appService.confirm('<p>Are you sure you want to execute this transaction?', () => {
            let params = [];
            this.formGroup.get('params').value.forEach((p, i) => {
                switch(this.paramsList[i].formType) {
                case 'number':
                    p = parseInt(p, 10);
                    break;
                }
                params.push(p);
            });
            const transaction: Transaction = {
                type: TransactionType.ExecuteSmartContract,
                from: this.appService.getAddressFromPrivateKey(this.formGroup.get('privateKey').value),
                to: this.transaction.receipt.contractAddress,
                method: this.methods[this.formGroup.get('method').value].name,
                params: params
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
            const url = 'http://' + this.config.selectedDelegate.httpEndpoint.host + ':' + this.config.selectedDelegate.httpEndpoint.port + '/v1/transactions/' + this.hash;
            return this.httpClient.get(url, {headers: {'Content-Type': 'application/json'}}).subscribe( (response: any) => {
                if (response.status !== 'Ok') {
                    this.appService.error(response.status);
                    return;
                }
                if (response.data.receipt.status != 'Ok') {
                    this.getStatus();
                    return;
                }
                this.deploying = false;
                this.appService.success('Smart contract executed.');
                this.appService.appEvents.emit({type: APP_REFRESH});
            });
        }, 500);
    }
}
