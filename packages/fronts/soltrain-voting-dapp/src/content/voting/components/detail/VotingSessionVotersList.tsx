import * as _ from 'lodash';
import { useState } from 'react';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

import SuspenseLoader from 'src/components/SuspenseLoader';
import VotingSessionAddVoterDialog from './VotingSessionAddVoterDialog';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import Chip from '@mui/material/Chip';

export default () => {
	const [addVoterDialogVisible, setAddVoterDialogVisible] = useState(false);
	// const { currentSession, voters, proposals } = useSelector(
	//     (state: RootState) => state.voting,
	// );

	// if (!voters.items || voters.loading) {
	//     return <SuspenseLoader />;
	// }

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
						{/* {currentSession.item.$capabilities.$canRegisterVoter && (
                            <Tooltip placement={'bottom'} title={'Register new voter'}>
                                <IconButton
                                    color={'primary'}
                                    onClick={() => setAddVoterDialogVisible(!addVoterDialogVisible)}
                                >
                                    <AddCircleIcon />
                                </IconButton>
                            </Tooltip>
                        )} */}
					</Grid>
				</Grid>
			</PageTitleWrapper>

			<Divider variant={'middle'} />

			<List sx={{ width: '100%', bgcolor: 'background.paper' }}>
				{/* {_.map(voters.items, (voter, address) => {
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
                })} */}
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
