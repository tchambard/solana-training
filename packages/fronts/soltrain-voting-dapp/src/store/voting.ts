import { atom } from 'recoil';
import { Proposal, Voter, VotingSession } from 'soltrain-voting-program';

type VotingSessionListState = { items: VotingSession[] };

export const votingSessionListState = atom<VotingSessionListState>({
	key: 'votingSessionListState',
	default: { items: [] },
});

type VotingSessionCurrentState =
	| {
			session: VotingSession;
			voters: Voter[];
			proposals: Proposal[];
			isAdmin: boolean;
	  }
	| undefined;

export const votingSessionCurrentState = atom<VotingSessionCurrentState>({
	key: 'votingSessionCurrentState',
	default: undefined,
});
