import { Address, BN, BorshCoder, EventParser, Program } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SendOptions, Signer, Transaction } from '@solana/web3.js';
import { Voting } from './types/voting';
import * as _ from 'lodash';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { sha256 } from 'js-sha256';
import { Wallet } from '@coral-xyz/anchor/dist/cjs/provider';

export interface ITransactionResult {
	tx: string;
	accounts?: NodeJS.Dict<PublicKey>;
	events;
}

export class AbstractSolanaClient {
	public readonly program: Program<Voting>;
	public readonly connection: Connection;
	protected readonly options?: SendOptions;

	constructor(program: Program<Voting>, options?: SendOptions) {
		this.program = program;
		this.connection = program.provider.connection;
		this.options = options;
	}

	public async signAndSendTransaction(payer: Wallet, tx: Transaction, accounts?: NodeJS.Dict<PublicKey>): Promise<ITransactionResult> {
		const recentBlockhash = await this.getRecentBlockhash();
		tx.feePayer = payer.publicKey;
		tx.recentBlockhash = recentBlockhash;
		const signedTransaction = await payer.signTransaction(tx);
		const serializedTx = signedTransaction.serialize();
		const sentTx = await this.connection.sendRawTransaction(serializedTx, this.options);
		return {
			tx: sentTx,
			events: await this.getTxEvents(sentTx),
			accounts,
		};
	}

	public async getRecentBlockhash(): Promise<string> {
		return (await this.connection.getLatestBlockhash()).blockhash;
	}

	protected async getPage(account: any, addresses: Address[], page: number = 1, perPage: number = 20) {
		const paginatedPublicKeys = addresses.slice((page - 1) * perPage, page * perPage);
		if (paginatedPublicKeys.length === 0) {
			return [];
		}
		return account.fetchMultiple(paginatedPublicKeys);
	}

	private async getTxEvents(tx: string): Promise<NodeJS.Dict<any> | undefined> {
		return this.callWithRetry(async () => {
			const txDetails = await this.connection.getTransaction(tx, {
				maxSupportedTransactionVersion: 0,
				commitment: 'confirmed',
			});
			if (!txDetails) return;

			const eventParser = new EventParser(this.program.programId, new BorshCoder(this.program.idl));
			const events = eventParser.parseLogs(txDetails?.meta?.logMessages || []);
			// console.log('events :>> ', txDetails?.meta);
			const result: NodeJS.Dict<object> = {};
			for (let event of events) {
				result[event.name] = event.data;
			}
			return result;
		}, 200);
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private async callWithRetry(fn: () => Promise<any>, timeMs: number, retry: number = 10): Promise<any> {
		const call = async (attempt: number): Promise<any> => {
			try {
				const result = await fn();
				if (result !== undefined) {
					return result;
				} else {
					throw new Error('No result');
				}
			} catch (e) {
				if (attempt < retry) {
					await this.delay(timeMs);
					return call(attempt + 1);
				} else {
					throw new Error(`Maximum retries reached without success`);
				}
			}
		};

		return call(1);
	}
}
