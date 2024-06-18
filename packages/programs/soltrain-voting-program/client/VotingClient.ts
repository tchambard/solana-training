import { AccountClient, Address, BN, BorshCoder, EventParser, Program } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Voting } from './types/voting';
import * as _ from 'lodash';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { sha256 } from 'js-sha256';

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
			.accountsPartial({
				owner: payer.publicKey,
				globalAccount: this.globalAccountPubkey,
			})
			.rpc({ skipPreflight: this.options.skipPreflight, commitment: 'confirmed' });
	}

	public async createVotingSession(payer: Keypair, name: string, description: string): Promise<ITransactionResult> {
		const sessionId = (await this.getNextSessionId()) || new anchor.BN(0);

		const sessionAccountPubkey = this.findSessionAccountAddress(sessionId);

		const tx = await this.program.methods
			.createVotingSession(name, description)
			.accountsPartial({
				owner: payer.publicKey,
				sessionAccount: sessionAccountPubkey,
				globalAccount: this.globalAccountPubkey,
			})
			.signers([payer])
			.rpc({ skipPreflight: this.options.skipPreflight, commitment: 'confirmed' });

		return {
			tx,
			accounts: {
				sessionAccountPubkey,
			},
		};
	}

	public async registerVoter(payer: Keypair, sessionId: BN, voter: PublicKey): Promise<ITransactionResult> {
		const sessionAccountPubkey = this.findSessionAccountAddress(sessionId);
		const voterAccountPubkey = this.findVoterAccountAddress(sessionId, voter);

		const tx = await this.program.methods
			.registerVoter(voter)
			.accountsPartial({
				admin: payer.publicKey,
				sessionAccount: sessionAccountPubkey,
				voterAccount: voterAccountPubkey,
			})
			.signers([payer])
			.rpc({ skipPreflight: this.options.skipPreflight, commitment: 'confirmed' });

		return {
			tx,
			accounts: {
				sessionAccountPubkey,
				voterAccountPubkey,
			},
		};
	}

	public async startProposalsRegistration(payer: Keypair, sessionId: BN): Promise<ITransactionResult> {
		const sessionAccountPubkey = this.findSessionAccountAddress(sessionId);
		const blankProposalAccountPubkey = this.findProposalAccountAddress(sessionId, 1);

		const tx = await this.program.methods
			.startProposalsRegistration()
			.accountsPartial({
				admin: payer.publicKey,
				sessionAccount: sessionAccountPubkey,
				blankProposalAccount: blankProposalAccountPubkey,
			})
			.signers([payer])
			.rpc({ skipPreflight: this.options.skipPreflight, commitment: 'confirmed' });

		return {
			tx,
			accounts: {
				sessionAccountPubkey,
				blankProposalAccountPubkey,
			},
		};
	}

	public async stopProposalsRegistration(payer: Keypair, sessionId: BN): Promise<ITransactionResult> {
		const sessionAccountPubkey = this.findSessionAccountAddress(sessionId);

		const tx = await this.program.methods
			.stopProposalsRegistration()
			.accountsPartial({
				admin: payer.publicKey,
				sessionAccount: sessionAccountPubkey,
			})
			.signers([payer])
			.rpc({ skipPreflight: this.options.skipPreflight, commitment: 'confirmed' });

		return {
			tx,
			accounts: {
				sessionAccountPubkey,
			},
		};
	}

	public async startVotingSession(payer: Keypair, sessionId: BN): Promise<ITransactionResult> {
		const sessionAccountPubkey = this.findSessionAccountAddress(sessionId);

		const tx = await this.program.methods
			.startVotingSession()
			.accountsPartial({
				admin: payer.publicKey,
				sessionAccount: sessionAccountPubkey,
			})
			.signers([payer])
			.rpc({ skipPreflight: this.options.skipPreflight, commitment: 'confirmed' });

		return {
			tx,
			accounts: {
				sessionAccountPubkey,
			},
		};
	}

	public async stopVotingSession(payer: Keypair, sessionId: BN): Promise<ITransactionResult> {
		const sessionAccountPubkey = this.findSessionAccountAddress(sessionId);

		const tx = await this.program.methods
			.stopVotingSession()
			.accountsPartial({
				admin: payer.publicKey,
				sessionAccount: sessionAccountPubkey,
			})
			.signers([payer])
			.rpc({ skipPreflight: this.options.skipPreflight, commitment: 'confirmed' });

		return {
			tx,
			accounts: {
				sessionAccountPubkey,
			},
		};
	}

	public async registerProposal(payer: Keypair, sessionId: BN, description: string): Promise<ITransactionResult> {
		const sessionAccountPubkey = this.findSessionAccountAddress(sessionId);
		const voterAccountPubkey = this.findVoterAccountAddress(sessionId, payer.publicKey);

		const nextProposalId = (await this.getSession(sessionAccountPubkey)).proposalsCount;
		const proposalAccountPubkey = this.findProposalAccountAddress(sessionId, nextProposalId);

		const tx = await this.program.methods
			.registerProposal(description)
			.accountsPartial({
				proposer: payer.publicKey,
				sessionAccount: sessionAccountPubkey,
				voterAccount: voterAccountPubkey,
				proposalAccount: proposalAccountPubkey,
			})
			.signers([payer])
			.rpc({ skipPreflight: this.options.skipPreflight, commitment: 'confirmed' });

		return {
			tx,
			accounts: {
				sessionAccountPubkey,
				proposalAccountPubkey,
				voterAccountPubkey,
			},
		};
	}

	public async vote(payer: Keypair, sessionId: BN, proposalId: number): Promise<ITransactionResult> {
		const sessionAccountPubkey = this.findSessionAccountAddress(sessionId);
		const voterAccountPubkey = this.findVoterAccountAddress(sessionId, payer.publicKey);
		const proposalAccountPubkey = this.findProposalAccountAddress(sessionId, proposalId);

		const tx = await this.program.methods
			.vote()
			.accountsPartial({
				voter: payer.publicKey,
				sessionAccount: sessionAccountPubkey,
				voterAccount: voterAccountPubkey,
				proposalAccount: proposalAccountPubkey,
			})
			.signers([payer])
			.rpc({ skipPreflight: this.options.skipPreflight, commitment: 'confirmed' });

		return {
			tx,
			accounts: {
				sessionAccountPubkey,
				proposalAccountPubkey,
				voterAccountPubkey,
			},
		};
	}

	public async tallyVotes(payer: Keypair, sessionId: BN): Promise<ITransactionResult> {
		const sessionAccountPubkey = this.findSessionAccountAddress(sessionId);

		const session = await this.getSession(sessionAccountPubkey);

		let proposalsAccounts: PublicKey[] = [];
		for (let i = 1; i < session.proposalsCount; i++) {
			const proposalAccount = this.findProposalAccountAddress(sessionId, i);
			proposalsAccounts.push(proposalAccount);
		}

		const tx = await this.program.methods
			.tallyVotes()
			.accountsPartial({
				sessionAccount: sessionAccountPubkey,
			})
			.remainingAccounts([...proposalsAccounts.map((pubkey) => ({ pubkey, isWritable: false, isSigner: false }))])
			.signers([payer])
			.rpc({ skipPreflight: this.options.skipPreflight, commitment: 'confirmed' });

		return {
			tx,
			accounts: {
				sessionAccountPubkey,
			},
		};
	}

	public async listVoters(sessionId: BN, paginationOptions?: { page: number; perPage: number }) {
		const voterAccountDiscriminator = Buffer.from(sha256.digest('account:VoterAccount')).slice(0, 8);
		const accounts = await this.connection.getProgramAccounts(this.program.programId, {
			dataSlice: { offset: 8 + 8 + 32, length: 4 }, // Fetch the voter_id only.
			filters: [
				{ memcmp: { offset: 0, bytes: bs58.encode(voterAccountDiscriminator) } }, // Ensure it's a VoterAccount account.
				{ memcmp: { offset: 8, bytes: bs58.encode(sessionId.toBuffer('le', 8)) } },
			],
		});
		const addresses = accounts
			.map(({ pubkey, account }) => ({ pubkey, voterId: new BN(account.data, 'le').toNumber() }))
			.sort((a, b) => a.voterId - b.voterId)
			.map((account) => account.pubkey);

		return this.getPage(this.program.account.voterAccount, addresses, paginationOptions.page, paginationOptions.perPage);
	}

	public async listProposals(sessionId: BN, paginationOptions?: { page: number; perPage: number }) {
		const proposalAccountDiscriminator = Buffer.from(sha256.digest('account:ProposalAccount')).slice(0, 8);
		const accounts = await this.connection.getProgramAccounts(this.program.programId, {
			dataSlice: { offset: 8 + 8, length: 1 }, // Fetch the proposal_id only.
			filters: [
				{ memcmp: { offset: 0, bytes: bs58.encode(proposalAccountDiscriminator) } }, // Ensure it's a ProposalAccount account.
				{ memcmp: { offset: 8, bytes: bs58.encode(sessionId.toBuffer('le', 8)) } },
			],
		});
		const addresses = accounts
			.map(({ pubkey, account }) => ({ pubkey, proposalId: new BN(account.data, 'le').toNumber() }))
			.sort((a, b) => a.proposalId - b.proposalId)
			.map((account) => account.pubkey);

		return this.getPage(this.program.account.proposalAccount, addresses, paginationOptions.page, paginationOptions.perPage);
	}

	public async getNextSessionId(): Promise<BN> {
		return (await this.program.account.globalAccount.fetch(this.globalAccountPubkey)).sessionCount;
	}

	public async getSession(sessionAccountPubkey: PublicKey) {
		return this.program.account.sessionAccount.fetch(sessionAccountPubkey);
	}

	public async getVoter(voterAccountPubkey: PublicKey) {
		return this.program.account.voterAccount.fetch(voterAccountPubkey);
	}

	public async getProposal(proposalAccountPubkey: PublicKey) {
		return this.program.account.proposalAccount.fetch(proposalAccountPubkey);
	}

	public async getTxEvents(tx: string): Promise<NodeJS.Dict<any>> {
		const txDetails = await this.connection.getTransaction(tx, {
			maxSupportedTransactionVersion: 0,
			commitment: 'confirmed',
		});

		const eventParser = new EventParser(this.program.programId, new BorshCoder(this.program.idl));
		const events = eventParser.parseLogs(txDetails.meta.logMessages);
		// console.log('events :>> ', txDetails.meta);
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

	private findProposalAccountAddress(sessionId: BN, proposalId: number): PublicKey {
		const [sessionAccountPubkey] = PublicKey.findProgramAddressSync([Buffer.from('proposal'), sessionId.toBuffer('le', 8), Buffer.from([proposalId])], this.program.programId);
		return sessionAccountPubkey;
	}

	private async getPage(account: any, addresses: Address[], page: number, perPage: number) {
		const paginatedPublicKeys = addresses.slice((page - 1) * perPage, page * perPage);
		if (paginatedPublicKeys.length === 0) {
			return [];
		}
		return account.fetchMultiple(paginatedPublicKeys);
	}
}
