import * as _ from 'lodash';
import { useState } from 'react';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import AddCircleIcon from '@mui/icons-material/AddCircle';

import VotingSessionAddVoterDialog from './VotingSessionAddVoterDialog';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import { votingSessionCurrentState } from '@/store/voting';
import { useRecoilValue } from 'recoil';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import AddressAvatar from '@/components/AddressAvatar';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import { VotingSessionStatus } from '@voting';

export default () => {
	const [addVoterDialogVisible, setAddVoterDialogVisible] = useState(false);
	const sessionCurrent = useRecoilValue(votingSessionCurrentState);

	return (
		<>
			<PageTitleWrapper>
				<Grid container justifyContent={'space-between'} alignItems={'center'}>
					<Grid item>
						<Typography variant={'h3'} component={'h3'} gutterBottom>
							List of voters
						</Typography>
					</Grid>
					<Grid item>
						{sessionCurrent?.isAdmin &&
							sessionCurrent.session.status ===
								VotingSessionStatus.RegisteringVoters && (
								<Tooltip placement={'bottom'} title={'Register new voter'}>
									<IconButton
										color={'primary'}
										onClick={() => setAddVoterDialogVisible(!addVoterDialogVisible)}
									>
										<AddCircleIcon />
									</IconButton>
								</Tooltip>
							)}
					</Grid>
				</Grid>
			</PageTitleWrapper>

			<Divider variant={'middle'} />

			<List sx={{ width: '100%', bgcolor: 'background.paper' }}>
				{_.map(sessionCurrent?.voters, (voter, address) => {
					return (
						<ListItem key={`voter_${address}`}>
							<ListItemAvatar>
								<AddressAvatar address={address} />
							</ListItemAvatar>
							<ListItemText
								primary={address}
								secondary={
									voter.hasVoted && (
										<Chip
											label={'voted'}
											color={'success'}
											size={'small'}
											variant={'outlined'}
										/>
									)
								}
							/>
						</ListItem>
					);
				})}
			</List>
			{addVoterDialogVisible && (
				<VotingSessionAddVoterDialog
					dialogVisible={addVoterDialogVisible}
					setDialogVisible={setAddVoterDialogVisible}
				/>
			)}
		</>
	);
};
