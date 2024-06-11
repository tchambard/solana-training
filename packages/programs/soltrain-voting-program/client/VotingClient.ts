import {
	AnchorError,
	BN,
	BorshCoder,
	EventParser,
	Program,
} from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Voting } from './types/voting';

export interface IVotingClientOptions {
	skipPreflight?: boolean;
}

export class VotingClient {
	public readonly program: Program<Voting>;
	public readonly connection: Connection;
	public readonly globalAccount: PublicKey;

	private readonly options: IVotingClientOptions;

	constructor(program: Program<Voting>, options?: IVotingClientOptions) {
		this.program = program;
		this.connection = program.provider.connection;
		this.globalAccount = PublicKey.findProgramAddressSync(
			[Buffer.from('global')],
			program.programId,
		)[0];

		this.options = {
			skipPreflight: options?.skipPreflight ?? false,
		};
	}

	public async initGlobal(payer: Keypair) {
		await this.program.methods
			.initGlobal()
			.accounts({
				owner: payer.publicKey,
				globalAccount: this.globalAccount,
			})
			.rpc({ skipPreflight: this.options.skipPreflight, commitment: 'confirmed' });
	}

	public async createVotingSession(
		payer: Keypair,
		name: string,
		description: string,
	) {
		const sessionId = (await this.getNextSessionId()) || new anchor.BN(0);

		const [sessionPubKey] = PublicKey.findProgramAddressSync(
			[Buffer.from('session'), sessionId.toBuffer('le', 8)],
			this.program.programId,
		);

		const createSessionTx = await this.program.methods
			.createVotingSession(name, description)
			.accounts({
				owner: payer.publicKey,
				sessionAccount: sessionPubKey,
				globalAccount: this.globalAccount,
			})
			.signers([payer])
			.rpc({ skipPreflight: this.options.skipPreflight, commitment: 'confirmed' });

		const sessionAccount =
			await this.program.account.sessionAccount.fetch(sessionPubKey);
		const createdSessionEvents = await this.getTxEvents(createSessionTx);

		return {
			createSessionTx,
			sessionPubKey,
			createdSessionEvents,
			sessionAccount,
		};
	}

	public async getNextSessionId(): Promise<BN> {
		return (await this.program.account.globalAccount.fetch(this.globalAccount))
			.sessionCount;
	}

	private async getTxEvents(tx: string): Promise<NodeJS.Dict<any>> {
		const txDetails = await this.connection.getTransaction(tx, {
			maxSupportedTransactionVersion: 0,
			commitment: 'confirmed',
		});

		const eventParser = new EventParser(
			this.program.programId,
			new BorshCoder(this.program.idl),
		);
		const events = eventParser.parseLogs(txDetails.meta.logMessages);

		const result: NodeJS.Dict<object> = {};
		for (let event of events) {
			result[event.name] = event.data;
		}
		return result;
	}
}
