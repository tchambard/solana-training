import * as _ from 'lodash';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { styled, useTheme } from '@mui/material/styles';
import { Container, Divider, Paper } from '@mui/material';

import SuspenseLoader from 'src/components/SuspenseLoader';
import PageTitleWrapper from 'src/components/PageTitleWrapper';

const Item = styled(Paper)(({ theme }) => ({
	color: theme.palette.text.secondary,
}));

export default () => {
	const theme = useTheme();

	// const { result } = useSelector((state: RootState) => state.voting);

	// if (result.loading) {
	//     return <SuspenseLoader />;
	// }

	// if (!result.data) {
	//     return <></>;
	// }

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
								{/* {_.map(result.data.winningProposals, (proposal, idx) => {
                                    return (
                                        <ListItem key={`winning_proposal_${idx}`}>
                                            <ListItemAvatar>
                                                <AddressAvatar address={proposal.proposer} />
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={proposal.description}
                                                secondary={`Nb votes: ${proposal.voteCount}`}
                                            />
                                        </ListItem>
                                    );
                                })} */}
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
									Nb voters
								</div>
								{/* <div style={{ fontSize: '2em' }}>{result.data.votersCount}</div>

                                <div
                                    style={{
                                        color: theme.palette.text.secondary,
                                    }}
                                >
                                    Nb votes
                                </div>
                                <div style={{ fontSize: '2em' }}>{result.data.totalVotes}</div>

                                <div
                                    style={{
                                        color: theme.palette.text.secondary,
                                    }}
                                >
                                    Abstention
                                </div>
                                <div style={{ fontSize: '2em' }}>{result.data.abstention}</div>

                                <div
                                    style={{
                                        color: theme.palette.text.secondary,
                                    }}
                                >
                                    Blank votes
                                </div>
                                <div style={{ fontSize: '2em' }}>{result.data.blankVotes}</div> */}
							</div>
						</Item>
					</Grid>
				</Grid>
			</Container>
		</>
	);
};
