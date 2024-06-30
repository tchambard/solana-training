import { useState } from 'react';
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
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useRecoilValue } from 'recoil';
import { votingClientState } from '@/store/wallet';
import { votingSessionCurrentState } from '@/store/voting';
import { Wallet } from '@coral-xyz/anchor';

interface IAddProposalDialogProps {
	dialogVisible: boolean;
	setDialogVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

interface IRegisterProposalParams {
	description: string;
}

export default ({
	dialogVisible,
	setDialogVisible,
}: IAddProposalDialogProps) => {
	const anchorWallet = useAnchorWallet() as Wallet;
	const votingClient = useRecoilValue(votingClientState);
	const sessionCurrent = useRecoilValue(votingSessionCurrentState);

	const [pending, setPending] = useState(false);

	const [formData, setFormData] = useState<Partial<IRegisterProposalParams>>({});

	if (!anchorWallet || !votingClient || !sessionCurrent) return <></>;

	return (
		<Dialog
			disableEscapeKeyDown
			maxWidth={'sm'}
			aria-labelledby={'register-proposal-title'}
			open={dialogVisible}
		>
			<DialogTitle id={'register-proposal-title'}>
				{'Add a new proposal'}
			</DialogTitle>
			<DialogContent dividers>
				<FormContainer
					defaultValues={formData}
					onSuccess={(data: IRegisterProposalParams) => {
						setFormData(data);
						setPending(true);
						votingClient
							?.registerProposal(
								anchorWallet,
								sessionCurrent.session.sessionId,
								data.description,
							)
							.then(() => {
								setPending(false);
								setDialogVisible(false);
							});
					}}
				>
					<Stack direction={'column'}>
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
