import * as _ from 'lodash';
import { Suspense, useEffect, useState } from 'react';
import {
	Alert,
	AlertColor,
	Box,
	Button,
	Grid,
	Step,
	StepLabel,
	Stepper,
	Typography,
} from '@mui/material';

import VotingSessionDeleteDialog from '../list/VotingSessionDeleteDialog';

import { useRecoilValue } from 'recoil';
import { votingSessionCurrentState } from '@/store/voting';
import { Voter } from 'soltrain-voting-program';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import AppLoading from '@/components/loading/AppLoading';
import { votingClientState } from '@/store/wallet';

enum VotingSessionStatus {
	None,
	RegisteringVoters,
	ProposalsRegistrationStarted,
	ProposalsRegistrationEnded,
	VotingSessionStarted,
	VotingSessionEnded,
	VotesTallied,
}

const steps: string[] = [
	'Created',
	'Registering voters',
	'Proposals registration started',
	'Proposals registration ended',
	'Voting session started',
	'Voting session ended',
	'Votes tallied',
];

export default () => {
	const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
	const [nbVotesRemaining, setNbVotesRemaining] = useState<number>();
	const sessionCurrent = useRecoilValue(votingSessionCurrentState);
	const anchorWallet = useAnchorWallet();
	const votingClient = useRecoilValue(votingClientState);

	// const { contract, sessionCurrent, voters } = useSelector(
	//     (state: RootState) => state.voting,
	// );
	// const { account } = useSelector((state: RootState) => state.ethNetwork);

	useEffect(() => {
		const _nbVotes = _.reduce(
			sessionCurrent?.voters,
			(acc, v) => {
				if (!v.hasVoted) {
					return acc + 1;
				}
				return acc;
			},
			0,
		);
		setNbVotesRemaining(_nbVotes);
	}, [sessionCurrent?.voters]);

	if (!votingClient) {
		return <></>;
	}

	const renderVotingSessionAlert = () => {
		const renderAlert = (message: string, color: AlertColor) => {
			return (
				<Alert
					variant={'outlined'}
					severity={color}
					action={
						sessionCurrent?.isAdmin &&
						anchorWallet && (
							<Button
								color={color}
								onClick={async () => {
									switch (sessionCurrent.session.status) {
										case VotingSessionStatus.RegisteringVoters:
											console.log(
												'anchorWallet, sessionCurrent.session.sessionId :>> ',
												anchorWallet,
												sessionCurrent.session.sessionId,
											);
											votingClient.startProposalsRegistration(
												anchorWallet,
												sessionCurrent.session.sessionId,
											);
											break;
										case VotingSessionStatus.ProposalsRegistrationStarted:
											votingClient.stopProposalsRegistration(
												anchorWallet,
												sessionCurrent.session.sessionId,
											);
											break;
										case VotingSessionStatus.ProposalsRegistrationEnded:
											votingClient.startVotingSession(
												anchorWallet,
												sessionCurrent.session.sessionId,
											);
											break;
										case VotingSessionStatus.VotingSessionStarted:
											votingClient.stopVotingSession(
												anchorWallet,
												sessionCurrent.session.sessionId,
											);
											break;
										case VotingSessionStatus.VotingSessionEnded:
											votingClient.tallyVotes(
												anchorWallet,
												sessionCurrent.session.sessionId,
											);
											break;
										default:
											throw new Error('Invalid current voting session status');
									}
								}}
							>
								{sessionCurrent.session.status === steps.length - 1 ? 'Finish' : 'Next'}
							</Button>
						)
					}
				>
					{message}
				</Alert>
			);
		};
		if (sessionCurrent?.isAdmin) {
			if (
				sessionCurrent?.session.status === VotingSessionStatus.RegisteringVoters
			) {
				return renderAlert('You can register new voters !', 'info');
			}

			if (
				sessionCurrent?.session.status ===
				VotingSessionStatus.ProposalsRegistrationStarted
			) {
				return renderAlert(
					'Proposals are being registered... Do you want to close registration ?',
					'info',
				);
			}

			if (
				sessionCurrent?.session.status ===
				VotingSessionStatus.ProposalsRegistrationEnded
			) {
				return renderAlert(
					'You will start the voting session. Do you want to continue ?',
					'warning',
				);
			}

			if (
				sessionCurrent?.session.status === VotingSessionStatus.VotingSessionStarted
			) {
				return renderAlert(
					`There are still ${nbVotesRemaining} voters to vote`,
					'info',
				);
			}

			if (
				sessionCurrent?.session.status === VotingSessionStatus.VotingSessionEnded
			) {
				return renderAlert('Please continue to tally votes !', 'warning');
			}
		} else {
			if (
				sessionCurrent?.session.status === VotingSessionStatus.RegisteringVoters
			) {
				return renderAlert('Please wait during voters registration !', 'info');
			}

			const currentAccountAsVoter = _.find(
				sessionCurrent?.voters,
				(v: Voter) => v.voterId.toString() === anchorWallet?.publicKey.toString(),
			);
			if (!currentAccountAsVoter) {
				return renderAlert(
					'You are not registered to participate to this voting session',
					'error',
				);
			}

			if (
				sessionCurrent?.session.status ===
				VotingSessionStatus.ProposalsRegistrationStarted
			) {
				const nbAlreadyProposed = currentAccountAsVoter.nbProposals;
				const maxProposals = 3;

				return nbAlreadyProposed < maxProposals
					? renderAlert(
							`Feel free to add new proposals... (remains ${maxProposals - nbAlreadyProposed})`,
							'warning',
						)
					: renderAlert(
							'You already proposed 3 proposals which is the maximum',
							'success',
						);
			}

			if (
				sessionCurrent?.session.status ===
				VotingSessionStatus.ProposalsRegistrationEnded
			) {
				return renderAlert('Voting session is not started yet.', 'warning');
			}

			if (
				sessionCurrent?.session.status === VotingSessionStatus.VotingSessionStarted
			) {
				const alreadyVoted = currentAccountAsVoter.hasVoted;
				return alreadyVoted
					? renderAlert('You have already voted', 'success')
					: renderAlert('You can vote', 'info');
			}

			if (
				sessionCurrent?.session.status === VotingSessionStatus.VotingSessionEnded
			) {
				return renderAlert('Please wait until votes tallied !', 'info');
			}
		}
	};

	if (!sessionCurrent?.session) {
		return <Suspense fallback={<AppLoading />} />;
	}

	return (
		<>
			<Grid container justifyContent={'space-between'} alignItems={'center'}>
				<Grid item>
					<Typography variant={'h3'} component={'h3'} gutterBottom>
						{/* {sessionCurrent?.session.name} - {sessionCurrent?.session.description} */}
					</Typography>
				</Grid>
				<Grid item>
					{/* {sessionCurrent?.session.$capabilities.$canDelete && (
                        <Tooltip placement={'bottom'} title={'Delete new session'}>
                            <IconButton
                                color={'primary'}
                                onClick={() => setDeleteDialogVisible(!deleteDialogVisible)}
                            >
                                <AddCircleIcon />
                            </IconButton>
                        </Tooltip>
                    )} */}
					<Grid item>
						<Box sx={{ width: '100%' }}>
							<Stepper activeStep={sessionCurrent?.session.status}>
								{steps.map((label, index) => {
									const stepProps: { completed?: boolean } = {};
									const labelProps: {} = {};
									return (
										<Step key={label} {...stepProps}>
											<StepLabel {...labelProps}>{label}</StepLabel>
										</Step>
									);
								})}
							</Stepper>
							{renderVotingSessionAlert()}
						</Box>
					</Grid>
				</Grid>
			</Grid>
			{deleteDialogVisible && (
				<VotingSessionDeleteDialog
					sessionId={sessionCurrent?.session.sessionId}
					dialogVisible={deleteDialogVisible}
					setDialogVisible={setDeleteDialogVisible}
				/>
			)}
		</>
	);
};
