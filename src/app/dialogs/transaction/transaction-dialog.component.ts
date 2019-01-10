import {Component, Inject, Input, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {AppService} from '../../app.service';
import {Transaction} from '../../store/states/transaction';
import {TransactionType} from '../../store/states/transaction-type';

/**
 *
 */
@Component({
    selector: 'app-transaction-dialog',
    templateUrl: './transaction-dialog.component.html',
    styleUrls: ['./transaction-dialog.component.scss']
})
export class TransactionDialogComponent implements OnInit, OnDestroy {

    /**
     * Class Level Declarations
     */
    @Input()
    public transaction: Transaction;
    public address: string;

    // so it can be referenced in the html
    transactionType = TransactionType;

    /*receipt?.contractResult
     *
     * @param appService
     * @param {MatDialogRef<TransactionDialogComponent>} mdDialogRef
     */
    constructor(@Inject('AppService') public appService: any, private mdDialogRef: MatDialogRef<TransactionDialogComponent>, @Inject(MAT_DIALOG_DATA) private data) {
        this.transaction = this.data.transaction;

        if (this.transaction.type == TransactionType.DeploySmartContract) {
            this.appService.getTransactionReceipt(this.transaction.hash).subscribe((response: any) => {
                this.address = response.data.receipt.contractAddress;
            });
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
    ngOnDestroy() {
    }

    /**
     *
     */
    public close(): void {
        this.mdDialogRef.close();
    }
}
