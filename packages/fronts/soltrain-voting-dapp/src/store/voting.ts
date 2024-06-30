import { atom } from 'recoil';
import { Proposal, Voter, VotingSession } from '@voting';

type VotingSessionListState = { items: VotingSession[]; loaded: boolean };

export const votingSessionListState = atom<VotingSessionListState>({
	key: 'votingSessionListState',
	default: { items: [], loaded: false },
});

export type VotingSessionCurrentState = {
	session: VotingSession;
	voters: { [publicKey: string]: Voter };
	proposals: Proposal[];
	isAdmin: boolean;
};

export const votingSessionCurrentState = atom<
	VotingSessionCurrentState | undefined
>({
	key: 'votingSessionCurrentState',
	default: undefined,
});
