import * as _ from 'lodash';
import { useState } from 'react';
import { useRecoilValue } from 'recoil';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Divider from '@mui/material/Divider';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import PageTitleWrapper from 'src/components/PageTitleWrapper';
import VotingSessionAddProposalDialog from './VotingSessionAddProposalDialog';
import VotingSessionConfirmVoteDialog from './VotingSessionConfirmVoteDialog';
import { Proposal, Voter, VotingSessionStatus } from '@voting';
import { votingSessionCurrentState } from '@/store/voting';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import AvatarGroup from '@mui/material/AvatarGroup';
import AddressAvatar from '@/components/AddressAvatar';

export default () => {
	const theme = useTheme();

	const [addProposalDialogVisible, setAddProposalDialogVisible] =
		useState(false);
	const [confirmVoteDialogVisible, setConfirmVoteDialogVisible] =
		useState(false);

	const sessionCurrent = useRecoilValue(votingSessionCurrentState);

	const [selectedProposal, setSelectedProposal] = useState<Proposal>();

	return (
		<>
			<PageTitleWrapper>
				<Grid container justifyContent={'space-between'} alignItems={'center'}>
					<Grid item>
						<Typography variant={'h3'} component={'h3'} gutterBottom>
							List of proposals
						</Typography>
					</Grid>
					<Grid item>
						{sessionCurrent?.session.status ===
							VotingSessionStatus.ProposalsRegistrationStarted && (
							<Tooltip placement={'bottom'} title={'Register new proposal'}>
								<IconButton
									color={'primary'}
									onClick={() => setAddProposalDialogVisible(!addProposalDialogVisible)}
								>
									<AddCircleIcon />
								</IconButton>
							</Tooltip>
						)}
					</Grid>
				</Grid>
			</PageTitleWrapper>

			<Divider variant={'middle'} />

			<List
				sx={{
					width: '100%',
					// hover states
					'& .MuiListItem-root:hover':
						sessionCurrent?.session.status ===
						VotingSessionStatus.VotingSessionStarted
							? {
									bgcolor: theme.palette.action.hover,
									cursor: 'pointer',
								}
							: undefined,
				}}
			>
				{sessionCurrent?.proposals
					.filter((p) => p.proposalId !== 0)
					.map((proposal) => {
						const proposalVoterAddresses = _.reduce(
							sessionCurrent?.voters,
							(acc, v: Voter, address: string) => {
								if (v.votedProposalId === proposal.proposalId) {
									acc.push(address);
								}
								return acc;
							},
							[] as string[],
						);

						return (
							<ListItem
								key={`proposal_${proposal.proposalId}`}
								onClick={() => {
									if (
										sessionCurrent?.session.status ===
										VotingSessionStatus.VotingSessionStarted
									) {
										setSelectedProposal(proposal);
										setConfirmVoteDialogVisible(true);
									}
								}}
							>
								<ListItemText primary={proposal.description} />
								<AvatarGroup max={3}>
									{proposalVoterAddresses.map((address) => {
										return (
											<AddressAvatar
												key={`proposal_voter_avatar-${address}`}
												address={address}
												size={24}
											/>
										);
									})}
								</AvatarGroup>
							</ListItem>
						);
					})}
			</List>

			{addProposalDialogVisible && (
				<VotingSessionAddProposalDialog
					dialogVisible={addProposalDialogVisible}
					setDialogVisible={setAddProposalDialogVisible}
				/>
			)}
			{confirmVoteDialogVisible && (
				<VotingSessionConfirmVoteDialog
					proposal={selectedProposal}
					dialogVisible={confirmVoteDialogVisible}
					setDialogVisible={setConfirmVoteDialogVisible}
				/>
			)}
		</>
	);
};
