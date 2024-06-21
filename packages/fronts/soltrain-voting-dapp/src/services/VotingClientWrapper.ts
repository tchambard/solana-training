import { Program } from '@coral-xyz/anchor';

import {
	Connection,
	LAMPORTS_PER_SOL,
	PublicKey,
	Transaction,
} from '@solana/web3.js';
import { Voting, VotingClient } from '@voting';
import idl from '@voting-idl';

const connection = new Connection('http://localhost:8899/');
const skipPreflight = false;

// const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
export const program = new Program<Voting>(idl as Voting, { connection });
export const votingClient = new VotingClient(program, { skipPreflight });

export async function getSolanaBalance(publicKey: string): Promise<number> {
	const balanceInLamports = await connection.getBalance(
		new PublicKey(publicKey),
	);
	const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;

	return balanceInSol;
}
