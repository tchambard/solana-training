import { useEffect, useState } from 'react';
import { FormContainer, TextFieldElement } from 'react-hook-form-mui';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Stack,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { LoadingButton } from '@mui/lab';
import { votingClient } from '@/services/VotingClientWrapper';
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { votingClientState } from '@/store/wallet';
import { useRecoilValue } from 'recoil';

interface IVoterSessionCreateDialogProps {
	dialogVisible: boolean;
	setDialogVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export default ({
	dialogVisible,
	setDialogVisible,
}: IVoterSessionCreateDialogProps) => {
	const anchorWallet = useAnchorWallet();
	const votingClient = useRecoilValue(votingClientState);
	const [pending, setPending] = useState(false);
	// const [formData, setFormData] = useState<Partial<ICreateVotingSessionParams>>(
	const [formData, setFormData] = useState<Partial<any>>({});

	if (!anchorWallet || !votingClient) return <></>;
	return (
		<Dialog
			disableEscapeKeyDown
			maxWidth={'sm'}
			aria-labelledby={'new-voting-session-title'}
			open={dialogVisible}
		>
			<DialogTitle id={'new-voting-session-title'}>
				{'Create new session'}
			</DialogTitle>
			<DialogContent dividers>
				<FormContainer
					defaultValues={formData}
					onSuccess={(data) => {
						setFormData(data);
						setPending(true);
						votingClient
							.createVotingSession(anchorWallet, data.name, data.description)
							.then(() => {
								setPending(false);
								setDialogVisible(false);
							});
					}}
				>
					<Stack direction={'column'}>
						<TextFieldElement
							type={'text'}
							name={'name'}
							label={'Name'}
							required={true}
						/>
						<br />
						<TextFieldElement
							type={'text'}
							name={'description'}
							label={'Description'}
							required={true}
						/>
						<br />
						<LoadingButton
							loading={pending}
							loadingPosition={'end'}
							variant={'contained'}
							color={'primary'}
							endIcon={<SendIcon />}
							type={'submit'}
						>
							Submit
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
