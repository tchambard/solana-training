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
import { votingSessionCurrentState } from '@/store/voting';
import BN from 'bn.js';
import SuspenseLoader from '@/components/SuspenseLoader';
import AppLoading from '@/components/loading/AppLoading';
import { VotingSessionStatus } from 'soltrain-voting-program';
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { votingClientState } from '@/store/wallet';

const Item = styled(Paper)(({ theme }) => ({
	// color: theme.palette.text.secondary,
}));

export default () => {
	const { sessionId } = useParams();
	const [sessionCurrent, setSessionCurrent] = useRecoilState(
		votingSessionCurrentState,
	);
	const votingClient = useRecoilValue(votingClientState);
	const anchorWallet = useAnchorWallet();

	useEffect(() => {
		console.log('sessionId :>> ', sessionId);
		console.log('sessionCurrent :>> ', sessionCurrent);
		if (
			votingClient != null &&
			sessionId != null &&
			(sessionCurrent?.session == null ||
				sessionCurrent.session.sessionId.toString() !== sessionId)
		) {
			const sid = new BN(sessionId);
			const sessionAccountAddress = votingClient.findSessionAccountAddress(sid);
			Promise.all([
				votingClient.getSession(sessionAccountAddress),
				votingClient.listVoters(sid),
				votingClient.listProposals(sid),
			]).then(([session, voters, proposals]) => {
				setSessionCurrent({
					session,
					voters,
					proposals,
					isAdmin: anchorWallet?.publicKey.toString() === session.admin.toString(),
				});
			});
		}
		// else {
		//     if (sessionCurrent.item != null) {
		//         // dispatch(LISTEN_VOTING_SESSION_STATUS_CHANGED.request(sessionId));

		//         if (
		//             sessionCurrent.item.status >=
		//             VotingSessionStatus.RegisteringVoters
		//         ) {
		//             votingClient.listVoters(sessionCurrent.item.sessionId).then((voters) => {

		//             });
		//             // dispatch(LIST_VOTERS.request(sessionCurrent.item.id));
		//             if (
		//                 sessionCurrent.item.status ===
		//                 VotingSessionStatus.RegisteringVoters
		//             ) {
		//                 dispatch(LISTEN_VOTER_REGISTERED.request(sessionCurrent.item.id));
		//             }
		//         }

		//         if (
		//             sessionCurrent.item.status >=
		//             VotingSessionStatus.ProposalsRegistrationStarted
		//         ) {
		//             dispatch(LIST_PROPOSALS.request(sessionCurrent.item.id));
		//             if (
		//                 sessionCurrent.item.status ===
		//                 VotingSessionStatus.ProposalsRegistrationStarted
		//             ) {
		//                 dispatch(LISTEN_PROPOSAL_REGISTERED.request(sessionCurrent.item.id));
		//             }
		//         }

		//         if (
		//             sessionCurrent.item.status ===
		//             VotingSessionStatus.VotingSessionEnded
		//         ) {
		//             dispatch(LISTEN_VOTES_TALLIED.request(sessionCurrent.item.id));
		//         }

		//         if (
		//             sessionCurrent.item.status === VotingSessionStatus.VotesTallied
		//         ) {
		//             dispatch(GET_VOTES_RESULT.request(sessionCurrent.item.id));
		//         }

		//         if (
		//             sessionCurrent.item.status >=
		//             VotingSessionStatus.VotingSessionStarted
		//         ) {
		//             // if (_.keys(voters.items).length && !voters.loading && !proposals.loading) {
		//             dispatch(LIST_VOTES.request(sessionCurrent.item.id));
		//             // }
		//             if (
		//                 sessionCurrent.item.status ===
		//                 VotingSessionStatus.VotingSessionStarted
		//             ) {
		//                 dispatch(LISTEN_VOTED.request(sessionCurrent.item.id));
		//             }
		//         }
		// }
		// }
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
