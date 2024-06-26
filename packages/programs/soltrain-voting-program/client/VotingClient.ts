import { sha256 } from 'js-sha256';
import { AccountClient, BN, Program } from '@coral-xyz/anchor';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { Wallet } from '@coral-xyz/anchor/dist/cjs/provider';
import { PublicKey, SendOptions } from '@solana/web3.js';

import { Voting } from './types/voting';
import { AbstractSolanaClient, ITransactionResult } from './AbstractSolanaClient';

type InternalVotingSessionStatus = ({ none?: never; registeringVoters?: never; proposalsRegistrationStarted?: never; proposalsRegistrationEnded?: never; votingSessionStarted?: never; votingSessionEnded?: never; } & { votesTallied: Record<string, never>; })
    | ({ votesTallied?: never; registeringVoters?: never; proposalsRegistrationStarted?: never; proposalsRegistrationEnded?: never; votingSessionStarted?: never; votingSessionEnded?: never; } & { none: Record<string, never>; })
    | ({ votesTallied?: never; none?: never; proposalsRegistrationStarted?: never; proposalsRegistrationEnded?: never; votingSessionStarted?: never; votingSessionEnded?: never; } & { registeringVoters: Record<string, never>; })
    | ({ votesTallied?: never; none?: never; registeringVoters?: never; proposalsRegistrationEnded?: never; votingSessionStarted?: never; votingSessionEnded?: never; } & { proposalsRegistrationStarted: Record<string, never>; })
    | ({ votesTallied?: never; none?: never; registeringVoters?: never; proposalsRegistrationStarted?: never; votingSessionStarted?: never; votingSessionEnded?: never; } & { proposalsRegistrationEnded: Record<string, never>; })
    | ({ votesTallied?: never; none?: never; registeringVoters?: never; proposalsRegistrationStarted?: never; proposalsRegistrationEnded?: never; votingSessionEnded?: never; } & { votingSessionStarted: Record<string, never>; })
    | ({ votesTallied?: never; none?: never; registeringVoters?: never; proposalsRegistrationStarted?: never; proposalsRegistrationEnded?: never; votingSessionStarted?: never; } & { votingSessionEnded: Record<string, never>; });


type InternalVotingSession = {
    sessionId: BN;
    name: string;
    description: string;
    status: InternalVotingSessionStatus;
    admin: PublicKey;
    votersCount: number;
    proposalsCount: number;
    winningProposalId: Buffer;
};

export enum VotingSessionStatus {
    None,
    RegisteringVoters,
    ProposalsRegistrationStarted,
    ProposalsRegistrationEnded,
    VotingSessionStarted,
    VotingSessionEnded,
    VotesTallied,
}

export type Global = {
    sessionCount: BN;
};

export type VotingSession = {
    sessionId: BN;
    name: string;
    description: string;
    status: VotingSessionStatus;
    admin: PublicKey;
    votersCount: number;
    proposalsCount: number;
    winningProposalId: Buffer;
};

export type Voter = {
    sessionId: BN;
    voter: PublicKey;
    voterId: number;
    hasVoted: boolean;
    votedProposalId: number;
    nbProposals: number;
};

export type Proposal = {
    sessionId: BN;
    proposalId: number;
    description: string;
    proposer: PublicKey;
    voteCount: number;
};

export class VotingClient extends AbstractSolanaClient<Voting> {

    public readonly globalAccountPubkey: PublicKey;
    private readonly wrapFn: <T>(fn: () => T) => T;

    constructor(program: Program<Voting>, options?: SendOptions, wrapFn?: (fn: () => PromiseLike<any>) => PromiseLike<any>) {
        super(program, options);
        this.globalAccountPubkey = PublicKey.findProgramAddressSync([Buffer.from('global')], program.programId)[0];
        this.wrapFn = wrapFn || this._wrapFn.bind(this);
    }

    public async initGlobal(payer: Wallet) {
        return this.wrapFn(async () => {
            const tx = await this.program.methods
                .initGlobal()
                .accountsPartial({
                    owner: payer.publicKey,
                    globalAccount: this.globalAccountPubkey,
                })
                .transaction();

            return this.signAndSendTransaction(payer, tx);
        });
    }

    public async createVotingSession(payer: Wallet, name: string, description: string): Promise<ITransactionResult> {
        return this.wrapFn(async () => {
            const sessionId = (await this.getNextSessionId()) || new BN(0);
            const sessionAccountPubkey = this.findSessionAccountAddress(sessionId);

            const tx = await this.program.methods
                .createVotingSession(name, description)
                .accountsPartial({
                    owner: payer.publicKey,
                    sessionAccount: sessionAccountPubkey,
                    globalAccount: this.globalAccountPubkey,
                })
                .transaction();

            return this.signAndSendTransaction(payer, tx, {
                sessionAccountPubkey,
            });
        });
    }

    public async registerVoter(payer: Wallet, sessionId: BN, voter: PublicKey): Promise<ITransactionResult> {
        return this.wrapFn(async () => {
            const sessionAccountPubkey = this.findSessionAccountAddress(sessionId);
            const voterAccountPubkey = this.findVoterAccountAddress(sessionId, voter);

            const tx = await this.program.methods
                .registerVoter(voter)
                .accountsPartial({
                    admin: payer.publicKey,
                    sessionAccount: sessionAccountPubkey,
                    voterAccount: voterAccountPubkey,
                })
                .transaction();

            return this.signAndSendTransaction(payer, tx, {
                sessionAccountPubkey,
                voterAccountPubkey,
            });
        });
    }

    public async startProposalsRegistration(payer: Wallet, sessionId: BN): Promise<ITransactionResult> {
        return this.wrapFn(async () => {
            const sessionAccountPubkey = this.findSessionAccountAddress(sessionId);
            const blankProposalAccountPubkey = this.findProposalAccountAddress(sessionId, 1);

            const tx = await this.program.methods
                .startProposalsRegistration()
                .accountsPartial({
                    admin: payer.publicKey,
                    sessionAccount: sessionAccountPubkey,
                    blankProposalAccount: blankProposalAccountPubkey,
                })
                .transaction();

            return this.signAndSendTransaction(payer, tx, {
                sessionAccountPubkey,
                blankProposalAccountPubkey,
            });
        });
    }

    public async stopProposalsRegistration(payer: Wallet, sessionId: BN): Promise<ITransactionResult> {
        return this.wrapFn(async () => {
            const sessionAccountPubkey = this.findSessionAccountAddress(sessionId);

            const tx = await this.program.methods
                .stopProposalsRegistration()
                .accountsPartial({
                    admin: payer.publicKey,
                    sessionAccount: sessionAccountPubkey,
                })
                .transaction();

            return this.signAndSendTransaction(payer, tx, {
                sessionAccountPubkey,
            });
        });
    }

    public async startVotingSession(payer: Wallet, sessionId: BN): Promise<ITransactionResult> {
        return this.wrapFn(async () => {
            const sessionAccountPubkey = this.findSessionAccountAddress(sessionId);

            const tx = await this.program.methods
                .startVotingSession()
                .accountsPartial({
                    admin: payer.publicKey,
                    sessionAccount: sessionAccountPubkey,
                })
                .transaction();

            return this.signAndSendTransaction(payer, tx, {
                sessionAccountPubkey,
            });
        });
    }

    public async stopVotingSession(payer: Wallet, sessionId: BN): Promise<ITransactionResult> {
        return this.wrapFn(async () => {
            const sessionAccountPubkey = this.findSessionAccountAddress(sessionId);

            const tx = await this.program.methods
                .stopVotingSession()
                .accountsPartial({
                    admin: payer.publicKey,
                    sessionAccount: sessionAccountPubkey,
                })
                .transaction();

            return this.signAndSendTransaction(payer, tx, {
                sessionAccountPubkey,
            });
        });
    }

    public async registerProposal(payer: Wallet, sessionId: BN, description: string): Promise<ITransactionResult> {
        return this.wrapFn(async () => {
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
                .transaction();

            return this.signAndSendTransaction(payer, tx, {
                sessionAccountPubkey,
                proposalAccountPubkey,
                voterAccountPubkey,
            });
        });
    }

    public async vote(payer: Wallet, sessionId: BN, proposalId: number): Promise<ITransactionResult> {
        return this.wrapFn(async () => {
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
                .transaction();

            return this.signAndSendTransaction(payer, tx, {
                sessionAccountPubkey,
                proposalAccountPubkey,
                voterAccountPubkey,
            });
        });
    }

    public async tallyVotes(payer: Wallet, sessionId: BN): Promise<ITransactionResult> {
        return this.wrapFn(async () => {
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
                .transaction();

            return this.signAndSendTransaction(payer, tx, {
                sessionAccountPubkey,
            });
        });
    }

    public async listVoters(sessionId: BN, paginationOptions?: { page: number; perPage: number }): Promise<Voter[]> {
        return this.wrapFn(async () => {
            const voterAccountDiscriminator = Buffer.from(sha256.digest('account:VoterAccount')).subarray(0, 8);
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

            return this.getPage(this.program.account.voterAccount, addresses, paginationOptions?.page, paginationOptions?.perPage);
        });
    }

    public async listSessions(paginationOptions?: { page: number; perPage: number }): Promise<VotingSession[]> {
        return this.wrapFn(async () => {
            const sessionAccountDiscriminator = Buffer.from(sha256.digest('account:SessionAccount')).subarray(0, 8);
            const accounts = await this.connection.getProgramAccounts(this.program.programId, {
                dataSlice: { offset: 8, length: 8 }, // Fetch the session_id only.
                filters: [
                    { memcmp: { offset: 0, bytes: bs58.encode(sessionAccountDiscriminator) } }, // Ensure it's a SessionAccount account.
                ],
            });
            const addresses = accounts
                .map(({ pubkey, account }) => ({ pubkey, sessionId: new BN(account.data, 'le').toNumber() }))
                .sort((a, b) => a.sessionId - b.sessionId)
                .map((account) => account.pubkey);

            return (await this.getPage<InternalVotingSession>(this.program.account.sessionAccount, addresses, paginationOptions?.page, paginationOptions?.perPage))
                .map(this.mapSession);
        });
    }

    public async listProposals(sessionId: BN, paginationOptions?: { page: number; perPage: number }): Promise<Proposal[]> {
        return this.wrapFn(async () => {
            const proposalAccountDiscriminator = Buffer.from(sha256.digest('account:ProposalAccount')).subarray(0, 8);
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

            return this.getPage(this.program.account.proposalAccount, addresses, paginationOptions?.page, paginationOptions?.perPage);
        });
    }

    public async getNextSessionId(): Promise<BN> {
        return this.wrapFn(async () => {
            return (await this.program.account.globalAccount.fetch(this.globalAccountPubkey)).sessionCount;
        });
    }

    public async getSession(sessionAccountPubkey: PublicKey): Promise<VotingSession> {
        return this.wrapFn(async () => {
            return this.mapSession(await this.program.account.sessionAccount.fetch(sessionAccountPubkey));
        });
    }

    public async getVoter(voterAccountPubkey: PublicKey): Promise<Voter> {
        return this.wrapFn(async () => {
            return this.program.account.voterAccount.fetch(voterAccountPubkey);
        });
    }

    public async getProposal(proposalAccountPubkey: PublicKey): Promise<Proposal> {
        return this.wrapFn(async () => {
            return this.program.account.proposalAccount.fetch(proposalAccountPubkey);
        });
    }

    public findSessionAccountAddress(sessionId: BN): PublicKey {
        const [sessionAccountPubkey] = PublicKey.findProgramAddressSync([Buffer.from('session'), sessionId.toBuffer('le', 8)], this.program.programId);
        return sessionAccountPubkey;
    }

    public findVoterAccountAddress(sessionId: BN, voter: PublicKey): PublicKey {
        const [voterAccountPubkey] = PublicKey.findProgramAddressSync([Buffer.from('voter'), sessionId.toBuffer('le', 8), voter.toBuffer()], this.program.programId);
        return voterAccountPubkey;
    }

    public findProposalAccountAddress(sessionId: BN, proposalId: number): PublicKey {
        const [sessionAccountPubkey] = PublicKey.findProgramAddressSync([Buffer.from('proposal'), sessionId.toBuffer('le', 8), Buffer.from([proposalId])], this.program.programId);
        return sessionAccountPubkey;
    }

    private mapSession = (internalSession: InternalVotingSession): VotingSession => {
        return {
            ...internalSession,
            status: this.mapSessionStatus(internalSession.status),
        }
    };

    private mapSessionStatus(internalStatus: InternalVotingSessionStatus): VotingSessionStatus {
        if (internalStatus.none) return VotingSessionStatus.None;
        if (internalStatus.registeringVoters) return VotingSessionStatus.RegisteringVoters;
        if (internalStatus.proposalsRegistrationStarted) return VotingSessionStatus.ProposalsRegistrationStarted;
        if (internalStatus.proposalsRegistrationEnded) return VotingSessionStatus.ProposalsRegistrationEnded;
        if (internalStatus.votingSessionStarted) return VotingSessionStatus.VotingSessionStarted;
        if (internalStatus.votingSessionEnded) return VotingSessionStatus.VotingSessionEnded;
        if (internalStatus.votesTallied) return VotingSessionStatus.VotesTallied;
        throw new Error('Bad session status');
    }

    private async _wrapFn(fn: () => any) {
        try {
            return await fn();
        } catch (e) {
            throw e;
        }
    }
}
