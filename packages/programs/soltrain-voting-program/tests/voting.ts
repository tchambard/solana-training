import * as anchor from '@coral-xyz/anchor';
import { BorshCoder, EventParser, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { assert } from 'chai';

import { Voting } from '../types/voting';

const skipPreflight = false;

async function getTxEvents(
	provider: anchor.AnchorProvider,
	program: anchor.Program<any>,
	tx: string,
): Promise<NodeJS.Dict<any>> {
	const txDetails = await provider.connection.getTransaction(tx, {
		maxSupportedTransactionVersion: 0,
		commitment: 'confirmed',
	});

	const eventParser = new EventParser(
		program.programId,
		new BorshCoder(program.idl),
	);
	const events = eventParser.parseLogs(txDetails.meta.logMessages);

	const result: NodeJS.Dict<object> = {};
	for (let event of events) {
		result[event.name] = event.data;
	}
	return result;
}

interface IGlobalAccount {
	sessionCount: anchor.BN;
}

describe('voting', () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.Voting as Program<Voting>;

	// const sessionAccount = anchor.web3.Keypair.generate();
	const owner = provider.wallet as anchor.Wallet;

	const [globalPDA] = PublicKey.findProgramAddressSync(
		[Buffer.from('global')],
		program.programId,
	);
	let globalAccount: IGlobalAccount;

	before(async () => {
		await program.methods
			.initProgram()
			.accounts({
				owner: owner.publicKey,
				globalAccount: globalPDA,
			})
			// .signers([sessionAccount])
			.rpc({ skipPreflight, commitment: 'confirmed' });

		globalAccount = await program.account.globalAccount.fetch(globalPDA);
	});

	describe('> Voting actions are conditionned by voting session status', () => {
		let sessionId = '0';
		let createVotingSessionTx: string;

		beforeEach(async () => {
			const [sessionPDA] = PublicKey.findProgramAddressSync(
				[Buffer.from('session'), globalAccount.sessionCount.toBuffer('le', 8)],
				program.programId,
			);

			createVotingSessionTx = await program.methods
				.createVotingSession(
					'Super Heroes',
					'A vote for every superheroes to find who will rule the world',
				)
				.accounts({
					owner: owner.publicKey,
					sessionAccount: sessionPDA,
					globalAccount: globalPDA,
				})
				// .signers([sessionAccount])
				.rpc({ skipPreflight, commitment: 'confirmed' });

			globalAccount = await program.account.globalAccount.fetch(globalPDA);
		});

		context('## voting status is RegisteringVoters', () => {
			describe('> createVotingSession', () => {
				it('> should succeed when called with program administrator address', async () => {
					const [sessionPDA] = PublicKey.findProgramAddressSync(
						[Buffer.from('session'), globalAccount.sessionCount.toBuffer('le', 8)],
						program.programId,
					);

					const expectedSessionId = '1';
					const name = 'Session A';
					const description = 'A new session';

					createVotingSessionTx = await program.methods
						.createVotingSession(name, description)
						.accounts({
							owner: owner.publicKey,
							sessionAccount: sessionPDA,
							globalAccount: globalPDA,
						})
						// .signers([sessionAccount])
						.rpc({ skipPreflight, commitment: 'confirmed' });

					const votingSession =
						await program.account.sessionAccount.fetch(sessionPDA);

					assert.equal(votingSession.sessionId.toString(), expectedSessionId);
					assert.equal(votingSession.name, name);
					assert.equal(votingSession.description, description);
					assert.deepEqual(votingSession.status, { registeringVoters: {} });

					const { workflowStatusChanged, sessionCreated } = await getTxEvents(
						provider,
						program,
						createVotingSessionTx,
					);

					assert.equal(
						workflowStatusChanged.sessionId.toString(),
						expectedSessionId,
					);
					assert.deepEqual(workflowStatusChanged.previousStatus, { none: {} });
					assert.deepEqual(workflowStatusChanged.currentStatus, {
						registeringVoters: {},
					});

					assert.equal(sessionCreated.sessionId.toString(), expectedSessionId);
					assert.equal(sessionCreated.name, name);
					assert.equal(sessionCreated.description, description);
				});
			});
		});
	});
});
