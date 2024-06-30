import * as _ from 'lodash';
import { Suspense, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Grid, Container, Paper } from '@mui/material';

import PageTitleWrapper from 'src/components/PageTitleWrapper';

import VotingSessionHeader from './VotingSessionHeader';
import { useParams } from 'react-router';

import VotingSessionVotersList from './VotingSessionVotersList';
import VotingSessionProposalsList from './VotingSessionProposalsList';
import VotingSessionResult from './VotingSessionResult';
import styled from '@mui/styles/styled';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
	VotingSessionCurrentState,
	votingSessionCurrentState,
} from '@/store/voting';
import BN from 'bn.js';
import AppLoading from '@/components/loading/AppLoading';
import { votingClientState } from '@/store/wallet';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { Wallet } from '@coral-xyz/anchor';
import { Voter } from '@voting';

const Item = styled(Paper)(({ theme }) => ({
	// color: theme.palette.text.secondary,
}));

export default () => {
	const { sessionId } = useParams();
	const [sessionCurrent, setSessionCurrent] = useRecoilState(
		votingSessionCurrentState,
	);
	const votingClient = useRecoilValue(votingClientState);
	const anchorWallet = useAnchorWallet() as Wallet;

	useEffect(() => {
		if (votingClient == null || sessionId == null) return;

		const listeners: number[] = [];

		if (
			!sessionCurrent ||
			sessionCurrent.session.sessionId.toString() !== sessionId
		) {
			const sid = new BN(sessionId);
			const sessionAccountAddress = votingClient.findSessionAccountAddress(sid);
			Promise.all([
				votingClient.getSession(sessionAccountAddress),
				// TODO: manage pagination for voters and proposals
				votingClient.listVoters(sid),
				votingClient.listProposals(sid),
			]).then(([session, voters, proposals]) => {
				const newSessionState: VotingSessionCurrentState = {
					session,
					voters: voters.reduce(
						(acc, voter) => {
							acc[voter.voter.toString()] = voter;
							return acc;
						},
						{} as { [pubkey: string]: Voter },
					),
					proposals,
					isAdmin: anchorWallet?.publicKey.toString() === session.admin.toString(),
				};
				setSessionCurrent(newSessionState);
			});
		} else {
			const sessionWorkflowStatusChangesListener = votingClient.addEventListener(
				'sessionWorkflowStatusChanged',
				(event) => {
					setSessionCurrent({
						...sessionCurrent,
						session: {
							...sessionCurrent.session,
							status: votingClient.mapSessionStatus(event.currentStatus),
						},
					});
				},
			);
			sessionWorkflowStatusChangesListener &&
				listeners.push(sessionWorkflowStatusChangesListener);

			const voterRegistrationListener = votingClient.addEventListener(
				'voterRegistered',
				(event) => {
					votingClient
						.listVoters(sessionCurrent.session.sessionId)
						.then((voters) => {
							setSessionCurrent({
								...sessionCurrent,
								voters: voters.reduce(
									(acc, voter) => {
										acc[voter.voter.toString()] = voter;
										return acc;
									},
									{} as { [pubkey: string]: Voter },
								),
								session: {
									...sessionCurrent.session,
									votersCount: sessionCurrent.session.votersCount + 1,
								},
							});
						});
				},
			);
			voterRegistrationListener && listeners.push(voterRegistrationListener);

			const proposalRegistrationListener = votingClient.addEventListener(
				'proposalRegistered',
				(event) => {
					votingClient
						.listProposals(sessionCurrent.session.sessionId)
						.then((proposals) => {
							setSessionCurrent({
								...sessionCurrent,
								proposals,
								session: {
									...sessionCurrent.session,
									proposalsCount: sessionCurrent.session.proposalsCount + 1,
								},
							});
						});
				},
			);
			proposalRegistrationListener && listeners.push(proposalRegistrationListener);

			const voteListener = votingClient.addEventListener('voted', (event) => {
				const voterPubkey = event.voter.toString();
				setSessionCurrent({
					...sessionCurrent,
					voters: {
						...sessionCurrent.voters,
						[voterPubkey]: {
							...sessionCurrent.voters[voterPubkey],
							hasVoted: true,
							votedProposalId: event.proposalId,
						},
					},
				});
			});
			voteListener && listeners.push(voteListener);

			const voteTallyListener = votingClient.addEventListener(
				'votesTallied',
				(event) => {
					setSessionCurrent({
						...sessionCurrent,
						session: {
							...sessionCurrent.session,
							result: {
								...event,
								winningProposals: [...event.winningProposals],
							},
						},
					});
				},
			);
			voteTallyListener && listeners.push(voteTallyListener);
		}

		return () => {
			listeners.forEach((listener) => {
				votingClient.program.removeEventListener(listener);
			});
		};
	}, [sessionCurrent?.session?.sessionId, sessionCurrent?.session?.status]);

	if (!sessionCurrent?.session) {
		return <Suspense fallback={<AppLoading />} />;
	}

	return (
		<>
			<Helmet>
				<title>
					{sessionCurrent.session.name} - {sessionCurrent.session.description}
				</title>
			</Helmet>
			<PageTitleWrapper>
				<VotingSessionHeader />
			</PageTitleWrapper>
			<Container maxWidth={'xl'}>
				<Grid
					container
					direction={'row'}
					justifyContent={'center'}
					alignItems={'stretch'}
					spacing={3}
				>
					<Grid item xs={12}>
						<Item>
							<VotingSessionResult />
						</Item>
					</Grid>
					<Grid item xs={12} md={6}>
						<Item>
							<VotingSessionVotersList />
						</Item>
					</Grid>
					<Grid item xs={12} md={6}>
						<Item>
							<VotingSessionProposalsList />
						</Item>
					</Grid>
				</Grid>
			</Container>
		</>
	);
};
