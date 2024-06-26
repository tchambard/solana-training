import { useState } from 'react';
import { Grid, IconButton, Tooltip, Typography } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';

import VotingSessionCreateDialog from './VotingSessionCreateDialog';

export default () => {
	const [createDialogVisible, setCreateDialogVisible] = useState(false);

	return (
		<>
			<Grid container justifyContent={'space-between'} alignItems={'center'}>
				<Grid item>
					<Typography variant={'h3'} component={'h3'} gutterBottom>
						VotingSessions
					</Typography>
				</Grid>
				<Grid item>
					<Tooltip placement={'bottom'} title={'Create new session'}>
						<IconButton
							color={'primary'}
							onClick={() => setCreateDialogVisible(!createDialogVisible)}
						>
							<AddCircleIcon />
						</IconButton>
					</Tooltip>
				</Grid>
			</Grid>
			{createDialogVisible && (
				<VotingSessionCreateDialog
					dialogVisible={createDialogVisible}
					setDialogVisible={setCreateDialogVisible}
				/>
			)}
		</>
	);
};
