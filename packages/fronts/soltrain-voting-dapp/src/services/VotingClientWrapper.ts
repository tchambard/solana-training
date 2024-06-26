import { connection } from '@/store/wallet';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

// const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

export async function getSolanaBalance(publicKey: string): Promise<number> {
	const balanceInLamports = await connection.getBalance(
		new PublicKey(publicKey),
	);
	const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;

	return balanceInSol;
}
