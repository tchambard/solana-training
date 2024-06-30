import * as _ from 'lodash';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import { styled, useTheme } from '@mui/material/styles';
import {
	Container,
	Divider,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Paper,
} from '@mui/material';
import { Wallet } from '@coral-xyz/anchor';

import PageTitleWrapper from 'src/components/PageTitleWrapper';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useRecoilValue } from 'recoil';
import { votingSessionCurrentState } from '@/store/voting';
import { votingClientState } from '@/store/wallet';
import { useState } from 'react';
import AddressAvatar from '@/components/AddressAvatar';

const Item = styled(Paper)(({ theme }) => ({
	color: theme.palette.text.secondary,
}));

export default () => {
	const theme = useTheme();
	const anchorWallet = useAnchorWallet() as Wallet;
	const votingClient = useRecoilValue(votingClientState);
	const sessionCurrent = useRecoilValue(votingSessionCurrentState);

	const [pending, setPending] = useState(false);

	if (!anchorWallet || !votingClient || !sessionCurrent) return <></>;

	return (
		<>
			<Container maxWidth={'xl'}>
				<Grid
					container
					direction={'row'}
					justifyContent={'center'}
					alignItems={'stretch'}
					spacing={3}
					paddingBottom={'20px'}
				>
					<Grid item xs={12} md={6}>
						<Item>
							<PageTitleWrapper>
								<Grid container justifyContent={'space-between'} alignItems={'center'}>
									<Grid item>
										<Typography variant={'h3'} component={'h3'} gutterBottom>
											Winning proposals
										</Typography>
									</Grid>
								</Grid>
							</PageTitleWrapper>
							<Divider variant={'middle'} />
							<List
								sx={{
									width: '100%',
									maxWidth: 450,
									bgcolor: 'background.paper',
								}}
							>
								{_.map(
									sessionCurrent.session.result.winningProposals,
									(proposalId, idx) => {
										const proposal = _.find(
											sessionCurrent.proposals,
											(p) => p.proposalId === proposalId,
										);
										return proposal ? (
											<ListItem key={`winning_proposal_${idx}`}>
												<ListItemAvatar>
													<AddressAvatar address={proposal.proposer.toString()} />
												</ListItemAvatar>
												<ListItemText
													primary={proposal.description}
													secondary={`Nb votes: ${proposal.voteCount}`}
												/>
											</ListItem>
										) : (
											<></>
										);
									},
								)}
							</List>
						</Item>
					</Grid>
					<Grid item xs={12} md={6}>
						<Item>
							<PageTitleWrapper>
								<Grid container justifyContent={'space-between'} alignItems={'center'}>
									<Grid item>
										<Typography variant={'h3'} component={'h3'} gutterBottom>
											Statistics
										</Typography>
									</Grid>
								</Grid>
							</PageTitleWrapper>
							<Divider variant={'middle'} />
							<div
								style={{
									padding: '20px',
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
								}}
							>
								<div
									style={{
										color: theme.palette.text.secondary,
									}}
								>
									Nb votes
								</div>
								<div style={{ fontSize: '2em' }}>
									{sessionCurrent.session.result.totalVotes}
								</div>

								<div
									style={{
										color: theme.palette.text.secondary,
									}}
								>
									Abstention
								</div>
								<div style={{ fontSize: '2em' }}>
									{sessionCurrent.session.result.abstention}
								</div>

								<div
									style={{
										color: theme.palette.text.secondary,
									}}
								>
									Blank votes
								</div>
								<div style={{ fontSize: '2em' }}>
									{sessionCurrent.session.result.blankVotes}
								</div>
							</div>
						</Item>
					</Grid>
				</Grid>
			</Container>
		</>
	);
};
