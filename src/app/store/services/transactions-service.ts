import {Injectable, Inject} from "@angular/core";
import {AppService} from '../../app.service';

import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {of} from 'rxjs/observable/of';

import {M2Util} from '../../m2-angular/utils/m2-util';

import {Transaction} from '../states/transaction';
import {TransactionType} from '../states/transaction-type';

@Injectable()
export class TransactionsService {

    constructor(@Inject('AppService') public appService: any) {
    }

    findTransactions(search: string, page: number = 1):  Observable<Transaction[]> {
        let O: Observable<Transaction[]>;

        if (M2Util.isNullOrEmpty(search)) {
            O = this.appService.getTransactions();
        } else {
            O = this.appService.getTransactionsFrom(search);
        }
        return O.pipe(
           map(res =>  res['data'])
           // map(res =>  res['data']),
           // map(res => {
           //     switch (res['type']) {
           //          case TransactionType.TransferTokens:
           //              res['typeLabel'] = 'Transfer Tokens';
           //              break;
           //          case TransactionType.DeploySmartContract:
           //              res['typeLabel'] = 'Deploy Smart Contract';
           //              break;
           //          case TransactionType.ExecuteSmartContract:
           //              res['typeLabel'] = 'Execute Smart Contract';
           //              break;
           //      }
           //      return res;
           // })
        );
        
    }
}