import { FormContainer } from 'react-hook-form-mui';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Stack,
	Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { LoadingButton } from '@mui/lab';

type IProposal = {
	description: string;
};

interface IConfirmVoteDialogProps {
	proposal: IProposal;
	dialogVisible: boolean;
	setDialogVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export default ({
	proposal,
	dialogVisible,
	setDialogVisible,
}: IConfirmVoteDialogProps) => {
	// const { txPending, currentSession } = useSelector(
	//     (state: RootState) => state.voting,
	// );

	return (
		<Dialog
			disableEscapeKeyDown
			maxWidth={'sm'}
			aria-labelledby={'confirm-vote-title'}
			open={dialogVisible}
		>
			<DialogTitle id={'confirm-vote-title'}>{'Confirm vote'}</DialogTitle>
			<DialogContent dividers>
				<FormContainer
					onSuccess={() => {
						// dispatch(
						//     VOTE.request({
						//         sessionId: currentSession.item.id,
						//         proposalId: proposal.proposalId,
						//     }),
						// );
						setDialogVisible(false);
					}}
				>
					<Stack direction={'column'}>
						<Typography>{proposal.description}</Typography>
						<br />
						<LoadingButton
							// loading={txPending}
							loadingPosition={'end'}
							variant={'contained'}
							color={'primary'}
							endIcon={<SendIcon />}
							type={'submit'}
						>
							Confirm
						</LoadingButton>
					</Stack>
				</FormContainer>
			</DialogContent>
			<DialogActions>
				<Button autoFocus onClick={() => setDialogVisible(false)} color={'primary'}>
					Cancel
				</Button>
			</DialogActions>
		</Dialog>
	);
};
