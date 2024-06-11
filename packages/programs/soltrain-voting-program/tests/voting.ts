import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { assert } from 'chai';

import { Voting } from '../client/types/voting';
import { VotingClient } from '../client';

const skipPreflight = false;

describe('voting', () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.Voting as Program<Voting>;
	const connection = program.provider.connection;

	const administrator = provider.wallet as anchor.Wallet;
	const batman = anchor.web3.Keypair.generate();

	const client = new VotingClient(program, { skipPreflight });

	before(async () => {
		// initialize program global account
		await client.initGlobal(administrator.payer);

		// request airdrop for voting actors
		await connection.requestAirdrop(batman.publicKey, 1000000000);
	});

	describe('> createVotingSession', () => {
		it('> should succeed when called with program administrator account', async () => {
			const expectedSessionId = await client.getNextSessionId();
			const name = 'Session A';
			const description = 'A new session';

			const {
				sessionAccount: session,
				createdSessionEvents: { sessionCreated, sessionWorkflowStatusChanged },
			} = await client.createVotingSession(administrator.payer, name, description);

			assert.equal(session.sessionId.toNumber(), expectedSessionId.toNumber());
			assert.equal(session.name, name);
			assert.equal(session.description, description);
			assert.deepEqual(session.status, { registeringVoters: {} });

			assert.equal(
				sessionWorkflowStatusChanged.sessionId.toString(),
				expectedSessionId,
			);
			assert.deepEqual(sessionWorkflowStatusChanged.previousStatus, { none: {} });
			assert.deepEqual(sessionWorkflowStatusChanged.currentStatus, {
				registeringVoters: {},
			});

			assert.equal(sessionCreated.sessionId.toNumber(), expectedSessionId);
			assert.equal(sessionCreated.name, name);
			assert.equal(sessionCreated.description, description);
		});

		it('> should succeed when called with non administrator account', async () => {
			const expectedSessionId = await client.getNextSessionId();
			const name = 'Session A';
			const description = 'A new session';

			const {
				sessionAccount: session,
				createdSessionEvents: { sessionCreated, sessionWorkflowStatusChanged },
			} = await client.createVotingSession(batman, name, description);

			assert.equal(session.sessionId.toNumber(), expectedSessionId.toNumber());
			assert.equal(session.name, name);
			assert.equal(session.description, description);
			assert.deepEqual(session.status, { registeringVoters: {} });

			assert.equal(
				sessionWorkflowStatusChanged.sessionId.toString(),
				expectedSessionId,
			);
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
		beforeEach(async () => {
			await client.createVotingSession(
				administrator.payer,
				'Super Heroes',
				'A vote for every superheroes to find who will rule the world',
			);
		});

		context('## voting status is RegisteringVoters', () => {
			describe('> createVotingSession', () => {
				it('> should succeed when called with non administrator account', async () => {
					const expectedSessionId = await client.getNextSessionId();
					const name = 'New Session';
					const description = 'A new session';

					const {
						createdSessionEvents: { sessionCreated },
					} = await client.createVotingSession(batman, name, description);

					assert.equal(
						sessionCreated.sessionId.toNumber(),
						expectedSessionId.toNumber(),
					);
					assert.equal(sessionCreated.name, name);
					assert.equal(sessionCreated.description, description);
				});
			});
		});
	});
});
