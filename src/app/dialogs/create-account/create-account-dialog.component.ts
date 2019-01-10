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
import {Account} from '../../store/states/account';
import {ConfigAction} from '../../store/reducers/config.reducer';

/**
 *
 */
@Component({
    selector: 'app-create-account-dialog',
    templateUrl: './create-account-dialog.component.html',
    styleUrls: ['./create-account-dialog.component.scss']
})
export class CreateAccountDialogComponent implements OnInit, OnDestroy {

    /**
     * Class Level Declarations
     */
    public configState: Observable<Config>;
    public config: Config;
    public configSubscription: any;
    public formGroup: FormGroup;
    public spinner = false;
    public KeyHelper = KeyHelper;

    /**
     *
     * @param appService
     * @param {MatDialogRef<CreateAccountDialogComponent>} mdDialogRef
     * @param {FormBuilder} formBuilder
     * @param {Store<AppState>} store
     * @param {HttpClient} httpClient
     */
    constructor(@Inject('AppService') public appService: any, private mdDialogRef: MatDialogRef<CreateAccountDialogComponent>, private formBuilder: FormBuilder, private store: Store<AppState>) {
        this.configState = this.store.select('config');
        this.configSubscription = this.configState.subscribe((config: Config) => {
            this.config = config;
        });
        this.formGroup = formBuilder.group({
            privateKey: new FormControl(this.config.account == null ? '' : this.config.account.privateKey, Validators.compose([Validators.required, Validators.minLength(64)])),
            address: new FormControl(this.config.account == null ? '' : this.config.account.address, Validators.compose([Validators.required, Validators.minLength(40)]))
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
    public save(): void {
        const account: Account = {
            privateKey: this.formGroup.get('privateKey').value,
            address: this.formGroup.get('address').value,
            name: '',
            balance: 0
        };
        this.config.account = account;
        this.store.dispatch(new ConfigAction(ConfigAction.CONFIG_UPDATE, this.config));
        this.mdDialogRef.close({status: 'saved'});
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
