import * as anchor from '@coral-xyz/anchor';
import { BorshCoder, EventParser, Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { assert } from 'chai';

import { Voting } from '../client/types/voting';

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
	const connection = program.provider.connection;

	const administrator = provider.wallet as anchor.Wallet;
	const batman = anchor.web3.Keypair.generate();

	const [globalPDA] = PublicKey.findProgramAddressSync(
		[Buffer.from('global')],
		program.programId,
	);

	const createVotingSession = async (
		owner: Keypair,
		name: string,
		description: string,
	) => {
		const sessionId =
			(await program.account.globalAccount.fetch(globalPDA)).sessionCount ||
			new anchor.BN(0);

		const [pda] = PublicKey.findProgramAddressSync(
			[Buffer.from('session'), sessionId.toBuffer('le', 8)],
			program.programId,
		);

		const tx = await program.methods
			.createVotingSession(name, description)
			.accounts({
				owner: owner.publicKey,
				sessionAccount: pda,
				globalAccount: globalPDA,
			})
			.signers([owner])
			.rpc({ skipPreflight, commitment: 'confirmed' });

		const session = await program.account.sessionAccount.fetch(pda);
		const events = await getTxEvents(provider, program, tx);

		return { tx, pda, events, session };
	};

	before(async () => {
		// initialize program global account
		await program.methods
			.initProgram()
			.accounts({
				owner: administrator.publicKey,
				globalAccount: globalPDA,
			})
			// .signers([sessionAccount])
			.rpc({ skipPreflight, commitment: 'confirmed' });

		// request airdrop for voting actors
		await connection.requestAirdrop(batman.publicKey, 1000000000);
	});

	describe('> createVotingSession', () => {
		it('> should succeed when called with program administrator account', async () => {
			const expectedSessionId = 0;
			const name = 'Session A';
			const description = 'A new session';

			const {
				session,
				events: { sessionCreated, workflowStatusChanged },
			} = await createVotingSession(administrator.payer, name, description);

			assert.equal(session.sessionId.toNumber(), expectedSessionId);
			assert.equal(session.name, name);
			assert.equal(session.description, description);
			assert.deepEqual(session.status, { registeringVoters: {} });

			assert.equal(workflowStatusChanged.sessionId.toString(), expectedSessionId);
			assert.deepEqual(workflowStatusChanged.previousStatus, { none: {} });
			assert.deepEqual(workflowStatusChanged.currentStatus, {
				registeringVoters: {},
			});

			assert.equal(sessionCreated.sessionId.toString(), expectedSessionId);
			assert.equal(sessionCreated.name, name);
			assert.equal(sessionCreated.description, description);
		});

		it('> should succeed when called with non administrator account', async () => {
			const expectedSessionId = 1;
			const name = 'Session A';
			const description = 'A new session';

			const {
				session,
				events: { sessionCreated, workflowStatusChanged },
			} = await createVotingSession(batman, name, description);

			assert.equal(session.sessionId.toNumber(), expectedSessionId);
			assert.equal(session.name, name);
			assert.equal(session.description, description);
			assert.deepEqual(session.status, { registeringVoters: {} });

			assert.equal(workflowStatusChanged.sessionId.toString(), expectedSessionId);
			assert.deepEqual(workflowStatusChanged.previousStatus, { none: {} });
			assert.deepEqual(workflowStatusChanged.currentStatus, {
				registeringVoters: {},
			});

			assert.equal(sessionCreated.sessionId.toString(), expectedSessionId);
			assert.equal(sessionCreated.name, name);
			assert.equal(sessionCreated.description, description);
		});
	});

	describe('> Voting actions are conditionned by voting session status', () => {
		beforeEach(async () => {
			await createVotingSession(
				administrator.payer,
				'Super Heroes',
				'A vote for every superheroes to find who will rule the world',
			);
		});

		context('## voting status is RegisteringVoters', () => {});
	});
});
