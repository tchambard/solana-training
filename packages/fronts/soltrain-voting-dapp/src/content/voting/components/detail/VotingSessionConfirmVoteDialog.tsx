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
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useRecoilValue } from 'recoil';
import { votingClientState } from '@/store/wallet';
import { votingSessionCurrentState } from '@/store/voting';
import { useState } from 'react';
import { Wallet } from '@coral-xyz/anchor';
import { Proposal } from '@voting';

interface IConfirmVoteDialogProps {
	proposal?: Proposal;
	dialogVisible: boolean;
	setDialogVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export default ({
	proposal,
	dialogVisible,
	setDialogVisible,
}: IConfirmVoteDialogProps) => {
	const anchorWallet = useAnchorWallet() as Wallet;
	const votingClient = useRecoilValue(votingClientState);
	const sessionCurrent = useRecoilValue(votingSessionCurrentState);

	const [pending, setPending] = useState(false);

	if (!anchorWallet || !votingClient || !sessionCurrent || !proposal)
		return <></>;

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
						setPending(true);
						votingClient
							?.vote(
								anchorWallet,
								sessionCurrent.session.sessionId,
								proposal.proposalId,
							)
							.then(() => {
								setPending(false);
								setDialogVisible(false);
							});
					}}
				>
					<Stack direction={'column'}>
						<Typography>{proposal.description}</Typography>
						<br />
						<LoadingButton
							loading={pending}
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
