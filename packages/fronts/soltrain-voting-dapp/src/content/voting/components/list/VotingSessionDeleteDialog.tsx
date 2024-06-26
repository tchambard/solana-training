import * as React from 'react';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { RoutePaths } from '@/routes/DefaultRoute';
import { BN } from '@coral-xyz/anchor';

interface IVotingSessionDeleteDialogProps {
	sessionId: BN;
	dialogVisible: boolean;
	setDialogVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export default ({
	sessionId,
	dialogVisible,
	setDialogVisible,
}: IVotingSessionDeleteDialogProps) => {
	const navigate = useNavigate();

	return (
		<Dialog
			disableEscapeKeyDown
			maxWidth={'sm'}
			aria-labelledby={'delete-session-title'}
			open={dialogVisible}
		>
			<DialogTitle id={'delete-session-title'}>
				{'Are you sure to delete this session ?'}
			</DialogTitle>
			<DialogContent dividers>
				<DialogContentText id={'alert-dialog-description'}>
					This operation will remove all data related to the voting session.
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button autoFocus onClick={() => setDialogVisible(false)} color={'primary'}>
					Cancel
				</Button>
				<Button
					color={'primary'}
					onClick={() => {
						// dispatch(DELETE_VOTING_SESSION.request({ sessionId }));

						setDialogVisible(false);
						navigate(RoutePaths.VOTING_SESSION_LIST);
					}}
				>
					Ok
				</Button>
			</DialogActions>
		</Dialog>
	);
};
