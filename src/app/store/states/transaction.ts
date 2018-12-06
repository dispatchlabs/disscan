/**
 * Transaction
 */
export interface Transaction {

    /**
     * Interface level-declarations.
     */
    hash: string;
    type: number;
    typeLabel: string;
    from: string;
    to: string;
    value: string;
    code: string;
    abi: string;
    method: string;
    params: any;
    time: number;
    signature: string;
    hertz: string;
    receipt: any;
    // Transients.
    fromName: string;
    toName: string;
}

