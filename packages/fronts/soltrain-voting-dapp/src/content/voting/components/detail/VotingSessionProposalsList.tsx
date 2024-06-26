import * as _ from 'lodash';
import { useEffect, useState } from 'react';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Divider from '@mui/material/Divider';
import { AvatarGroup } from '@mui/material';

import SuspenseLoader from 'src/components/SuspenseLoader';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import VotingSessionAddProposalDialog from './VotingSessionAddProposalDialog';
import VotingSessionConfirmVoteDialog from './VotingSessionConfirmVoteDialog';

export default () => {
	const theme = useTheme();

	const [addProposalDialogVisible, setAddProposalDialogVisible] =
		useState(false);
	const [confirmVoteDialogVisible, setConfirmVoteDialogVisible] =
		useState(false);
	// const [selectedProposal, setSelectedProposal] = useState<IProposal>();
	const [selectedProposal, setSelectedProposal] = useState<any>();

	// const { proposals, voters, currentSession } = useSelector(
	// 	(state: RootState) => state.voting,
	// );

	// if (proposals.loading) {
	//     return <SuspenseLoader />;
	// }

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
						{/* {currentSession.item.$capabilities.$canRegisterProposal && (
                            <Tooltip placement={'bottom'} title={'Register new proposal'}>
                                <IconButton
                                    color={'primary'}
                                    onClick={() => setAddProposalDialogVisible(!addProposalDialogVisible)}
                                >
                                    <AddCircleIcon />
                                </IconButton>
                            </Tooltip>
                        )} */}
					</Grid>
				</Grid>
			</PageTitleWrapper>

			<Divider variant={'middle'} />

			<List
			// sx={{
			//     width: '100%',
			//     // hover states
			//     '& .MuiListItem-root:hover': currentSession.item.$capabilities.$canVote
			//         ? {
			//             bgcolor: theme.palette.action.hover,
			//             cursor: 'pointer',
			//         }
			//         : undefined,
			// }}
			>
				{/* {proposals.items
                    .filter((p) => p.proposalId !== '0')
                    .map((proposal) => {
                        const proposalVoterAddresses = _.reduce(
                            voters.items,
                            (acc, v: IVoter, address: string) => {
                                if (v.votedProposalId === proposal.proposalId) {
                                    acc.push(address);
                                }
                                return acc;
                            },
                            [],
                        );

                        return (
                            <ListItem
                                key={`proposal_${proposal.proposalId}`}
                                onClick={() => {
                                    if (currentSession.item.$capabilities.$canVote) {
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
                    })} */}
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
