import { atom } from 'recoil';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
	Connection,
	LAMPORTS_PER_SOL,
	PublicKey,
	clusterApiUrl,
} from '@solana/web3.js';

type WalletState = {
	network: WalletAdapterNetwork;
	endpoint: string;
	connection: Connection;
};

export const network = WalletAdapterNetwork.Devnet;
export const endpoint = clusterApiUrl(network);
export const connection = new Connection(endpoint, 'confirmed');

export const walletState = atom<WalletState>({
	key: 'walletState',
	default: {
		network,
		endpoint,
		connection,
	},
});

export async function getSolanaBalance(publicKey: string): Promise<number> {
	const connection = new Connection(process.env.REACT_APP_RPC_URL!);
	const balanceInLamports = await connection.getBalance(
		new PublicKey(publicKey),
	);
	const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;

	return balanceInSol;
}
