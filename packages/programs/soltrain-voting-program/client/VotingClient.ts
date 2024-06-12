import { BN, BorshCoder, EventParser, Program } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Voting } from './types/voting';

export interface IVotingClientOptions {
	skipPreflight?: boolean;
}

export interface ITransactionResult {
	tx: string;
	accounts: NodeJS.Dict<PublicKey>;
}

export class VotingClient {
	public readonly program: Program<Voting>;
	public readonly connection: Connection;
	public readonly globalAccountPubkey: PublicKey;

	private readonly options: IVotingClientOptions;

	constructor(program: Program<Voting>, options?: IVotingClientOptions) {
		this.program = program;
		this.connection = program.provider.connection;
		this.globalAccountPubkey = PublicKey.findProgramAddressSync([Buffer.from('global')], program.programId)[0];

		this.options = {
			skipPreflight: options?.skipPreflight ?? false,
		};
	}

	public async initGlobal(payer: Keypair) {
		await this.program.methods
			.initGlobal()
			.accounts({
				owner: payer.publicKey,
				globalAccount: this.globalAccountPubkey,
			})
			.rpc({ skipPreflight: this.options.skipPreflight, commitment: 'confirmed' });
	}

	public async createVotingSession(payer: Keypair, name: string, description: string): Promise<ITransactionResult> {
		const sessionId = (await this.getNextSessionId()) || new anchor.BN(0);

		const sessionAccountPubkey = this.findSessionAccountAddress(sessionId);

		const createSessionTx = await this.program.methods
			.createVotingSession(name, description)
			.accounts({
				owner: payer.publicKey,
				sessionAccount: sessionAccountPubkey,
				globalAccount: this.globalAccountPubkey,
			})
			.signers([payer])
			.rpc({ skipPreflight: this.options.skipPreflight, commitment: 'confirmed' });

		return {
			tx: createSessionTx,
			accounts: {
				sessionAccountPubkey,
			},
		};
	}

	public async registerVoter(payer: Keypair, sessionId: BN, voter: PublicKey): Promise<ITransactionResult> {
		const sessionAccountPubkey = this.findSessionAccountAddress(sessionId);
		const voterAccountPubkey = this.findVoterAccountAddress(sessionId, voter);

		const registerVoterTx = await this.program.methods
			.registerVoter(voter)
			.accounts({
				admin: payer.publicKey,
				sessionAccount: sessionAccountPubkey,
			})
			.signers([payer])
			.rpc({ skipPreflight: this.options.skipPreflight, commitment: 'confirmed' });

		return {
			tx: registerVoterTx,
			accounts: {
				sessionAccountPubkey,
				voterAccountPubkey,
			},
		};
	}

	public async startProposalsRegistration(payer: Keypair, sessionId: BN): Promise<ITransactionResult> {
		const sessionAccountPubkey = this.findSessionAccountAddress(sessionId);

		const startProposalsRegistrationTx = await this.program.methods
			.startProposalsRegistration()
			.accounts({
				admin: payer.publicKey,
				sessionAccount: sessionAccountPubkey,
			})
			.signers([payer])
			.rpc({ skipPreflight: this.options.skipPreflight, commitment: 'confirmed' });

		return {
			tx: startProposalsRegistrationTx,
			accounts: {
				sessionAccountPubkey,
			},
		};
	}

	public async getNextSessionId(): Promise<BN> {
		return (await this.program.account.globalAccount.fetch(this.globalAccountPubkey)).sessionCount;
	}

	public async getTxEvents(tx: string): Promise<NodeJS.Dict<any>> {
		const txDetails = await this.connection.getTransaction(tx, {
			maxSupportedTransactionVersion: 0,
			commitment: 'confirmed',
		});

		const eventParser = new EventParser(this.program.programId, new BorshCoder(this.program.idl));
		const events = eventParser.parseLogs(txDetails.meta.logMessages);

		const result: NodeJS.Dict<object> = {};
		for (let event of events) {
			result[event.name] = event.data;
		}
		return result;
	}

	private findSessionAccountAddress(sessionId: BN): PublicKey {
		const [sessionAccountPubkey] = PublicKey.findProgramAddressSync([Buffer.from('session'), sessionId.toBuffer('le', 8)], this.program.programId);
		return sessionAccountPubkey;
	}

	private findVoterAccountAddress(sessionId: BN, voter: PublicKey): PublicKey {
		const [voterAccountPubkey] = PublicKey.findProgramAddressSync([Buffer.from('voter'), sessionId.toBuffer('le', 8), voter.toBuffer()], this.program.programId);
		return voterAccountPubkey;
	}
}
