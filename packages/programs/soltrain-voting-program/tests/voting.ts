import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';

import { Voting } from '../types/voting';

const skipPreflight = false;

export const generateSeededKeypair = (str: string) => {
	return Keypair.fromSeed(
		anchor.utils.bytes.utf8.encode(anchor.utils.sha256.hash(str)).slice(0, 32),
	);
};

describe('voting', () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.Voting as Program<Voting>;

	// const sessionAccount = anchor.web3.Keypair.generate();
	const owner = provider.wallet as anchor.Wallet;

	describe('> Voting actions are conditionned by voting session status', () => {
		const [globalPDA] = PublicKey.findProgramAddressSync(
			[Buffer.from('global')],
			program.programId,
		);

		beforeEach(async () => {
			await program.methods
				.initProgram()
				.accounts({
					owner: owner.publicKey,
					globalAccount: globalPDA,
				})
				// .signers([sessionAccount])
				.rpc({ skipPreflight });

			const globalAccount = await program.account.globalAccount.fetch(globalPDA);

			console.log(`sessionCount: ${JSON.stringify(globalAccount.sessionCount)}`);

			const [sessionPDA] = PublicKey.findProgramAddressSync(
				[Buffer.from('session'), globalAccount.sessionCount.toBuffer('le', 8)],
				program.programId,
			);

			// Invoke the initialize instruction
			await program.methods
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
				.rpc({ skipPreflight });

			const votingSession = await program.account.sessionAccount.fetch(sessionPDA);

			console.log(`Status: ${JSON.stringify(votingSession.status)}`);
		});

		it('test', () => {
			console.log('ok');
		});
	});
});
