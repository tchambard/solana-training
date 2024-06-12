import * as anchor from '@coral-xyz/anchor';
import { AnchorError, BN, Program } from '@coral-xyz/anchor';
import { assert } from 'chai';

import { Voting } from '../client/types/voting';
import { VotingClient } from '../client';

const skipPreflight = false;

interface IExpectedError {
	code: string;
	number: number;
	errorMessage: string;
	programId: string;
}

async function assertError(fn: () => Promise<any>, expected: IExpectedError): Promise<void> {
	try {
		await fn();
		assert.ok(false);
	} catch (_err) {
		assert.isTrue(_err instanceof AnchorError);
		const err: AnchorError = _err;
		assert.strictEqual(err.error.errorMessage, expected.errorMessage);
		assert.strictEqual(err.error.errorCode.code, expected.code);
		assert.strictEqual(err.error.errorCode.number, expected.number);
		assert.strictEqual(err.program.toString(), expected.programId);
	}
}

describe('voting', () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.Voting as Program<Voting>;
	const connection = program.provider.connection;

	const administrator = provider.wallet as anchor.Wallet;
	const batman = anchor.web3.Keypair.generate();
	const superman = anchor.web3.Keypair.generate();

	const client = new VotingClient(program, { skipPreflight });

	before(async () => {
		// initialize program global account
		await client.initGlobal(administrator.payer);

		// request airdrop for voting actors
		await connection.requestAirdrop(batman.publicKey, 1000000000);
		await connection.requestAirdrop(superman.publicKey, 1000000000);
	});

	describe('> createVotingSession', () => {
		it('> should succeed when called with program administrator account', async () => {
			const expectedSessionId = 0;
			const name = 'Session A';
			const description = 'New session A';

			const {
				tx,
				accounts: { sessionAccountPubkey },
			} = await client.createVotingSession(administrator.payer, name, description);

			const sessionAccount = await program.account.sessionAccount.fetch(sessionAccountPubkey);
			assert.equal(sessionAccount.sessionId.toNumber(), expectedSessionId);
			assert.equal(sessionAccount.admin.toString(), administrator.payer.publicKey.toString());
			assert.equal(sessionAccount.name, name);
			assert.equal(sessionAccount.description, description);
			assert.deepEqual(sessionAccount.status, { registeringVoters: {} });

			const { sessionCreated, sessionWorkflowStatusChanged } = await client.getTxEvents(tx);
			assert.equal(sessionWorkflowStatusChanged.sessionId.toString(), expectedSessionId);
			assert.deepEqual(sessionWorkflowStatusChanged.previousStatus, { none: {} });
			assert.deepEqual(sessionWorkflowStatusChanged.currentStatus, { registeringVoters: {} });

			assert.equal(sessionCreated.sessionId.toNumber(), expectedSessionId);
			assert.equal(sessionCreated.name, name);
			assert.equal(sessionCreated.description, description);
		});

		it('> should succeed when called with non administrator account', async () => {
			const expectedSessionId = 1;
			const name = 'Session B';
			const description = 'New session B';

			const {
				tx,
				accounts: { sessionAccountPubkey },
			} = await client.createVotingSession(batman, name, description);

			const sessionAccount = await program.account.sessionAccount.fetch(sessionAccountPubkey);
			assert.equal(sessionAccount.sessionId.toNumber(), expectedSessionId);
			assert.equal(sessionAccount.admin.toString(), batman.publicKey.toString());
			assert.equal(sessionAccount.name, name);
			assert.equal(sessionAccount.description, description);
			assert.deepEqual(sessionAccount.status, { registeringVoters: {} });

			const { sessionCreated, sessionWorkflowStatusChanged } = await client.getTxEvents(tx);
			assert.equal(sessionWorkflowStatusChanged.sessionId.toString(), expectedSessionId);
			assert.deepEqual(sessionWorkflowStatusChanged.previousStatus, { none: {} });
			assert.deepEqual(sessionWorkflowStatusChanged.currentStatus, {
				registeringVoters: {},
			});

			assert.equal(sessionCreated.sessionId.toNumber(), expectedSessionId);
			assert.equal(sessionCreated.name, name);
			assert.equal(sessionCreated.description, description);
		});
	});

	describe('> Voting actions are conditionned by voting session status', () => {
		let sessionId: BN;

		beforeEach(async () => {
			const {
				accounts: { sessionAccountPubkey },
			} = await client.createVotingSession(administrator.payer, 'Super Heroes', 'A vote for every superheroes to find who will rule the world');
			const session = await program.account.sessionAccount.fetch(sessionAccountPubkey);
			sessionId = session.sessionId;

			// register batman as voter
			await client.registerVoter(administrator.payer, sessionId, batman.publicKey);
		});

		context('## voting status is RegisteringVoters', () => {
			describe('> createVotingSession', () => {
				it('> should succeed when called with non administrator account', async () => {
					const expectedSessionId = await client.getNextSessionId();
					const name = 'New Session';
					const description = 'New session Z';

					const { tx } = await client.createVotingSession(batman, name, description);
					const { sessionCreated } = await client.getTxEvents(tx);

					assert.equal(sessionCreated.sessionId.toNumber(), expectedSessionId.toNumber());
					assert.equal(sessionCreated.name, name);
					assert.equal(sessionCreated.description, description);
				});
			});

			describe('> registerVoter', () => {
				it('> should succeed when called with voting session administrator', async () => {
					const {
						tx,
						accounts: { voterAccountPubkey },
					} = await client.registerVoter(administrator.payer, sessionId, superman.publicKey);

					const voterAccount = await program.account.voterAccount.fetch(voterAccountPubkey);
					assert.isFalse(voterAccount.hasVoted);
					assert.equal(voterAccount.nbProposals, 0);
					assert.equal(voterAccount.votedProposalId, 0);
					assert.equal(voterAccount.voter.toString(), superman.publicKey.toString());

					const { voterRegistered } = await client.getTxEvents(tx);
					assert.equal(voterRegistered.sessionId.toNumber(), sessionId.toNumber());
					assert.equal(voterRegistered.voter.toString(), superman.publicKey.toString());
				});

				it('> should fail when payer is not session administrator', async () => {
					await assertError(() => client.registerVoter(batman, sessionId, batman.publicKey), {
						number: 6002,
						code: 'ForbiddenAsNonAdmin',
						errorMessage: 'Forbidden as non administrator',
						programId: program.programId.toString(),
					});
				});

				it('> should fail when voter address is already registered', async () => {
					await assertError(() => client.registerVoter(administrator.payer, sessionId, batman.publicKey), {
						number: 6003,
						code: 'VoterAlreadyRegistered',
						errorMessage: 'Voter already registered',
						programId: program.programId.toString(),
					});
				});

				it('> should fail when voter address is owner contract address', async () => {
					await assertError(() => client.registerVoter(administrator.payer, sessionId, administrator.publicKey), {
						number: 6001,
						code: 'AdminForbiddenAsVoter',
						errorMessage: 'Voting session administrator can not be registered as voter',
						programId: program.programId.toString(),
					});
				});
			});

			describe('> startProposalsRegistration', () => {
				it('> should succeed when called with non administrator account', async () => {
					const { tx } = await client.startProposalsRegistration(administrator.payer, sessionId);
					const { sessionWorkflowStatusChanged } = await client.getTxEvents(tx);
					assert.equal(sessionWorkflowStatusChanged.sessionId.toString(), sessionId.toString());
					assert.deepEqual(sessionWorkflowStatusChanged.previousStatus, { registeringVoters: {} });
					assert.deepEqual(sessionWorkflowStatusChanged.currentStatus, { proposalsRegistrationStarted: {} });
				});
			});
		});
	});
});
