import { atom } from 'recoil';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { VotingClient } from 'soltrain-voting-program';

type WalletState = {
	network: WalletAdapterNetwork;
	endpoint: string;
	connection: Connection;
};

type TxState = {
	pending: boolean;
	error?: string;
};

export const network = WalletAdapterNetwork.Devnet;
// export const endpoint = clusterApiUrl(network);
export const endpoint = 'http://localhost:8899/';
export const connection = new Connection(endpoint, 'confirmed');

export const walletState = atom<WalletState>({
	key: 'walletState',
	default: {
		network,
		endpoint,
		connection,
	},
});

export const txState = atom<TxState>({
	key: 'txState',
	default: {
		pending: false,
	},
});

export const votingClientState = atom<VotingClient | undefined>({
	key: 'votingClientState',
	default: undefined,
});
