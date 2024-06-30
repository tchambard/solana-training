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
import { votingClientState } from '@/store/wallet';
import { useRecoilValue } from 'recoil';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { Wallet } from '@coral-xyz/anchor';
import { votingSessionCurrentState } from '@/store/voting';
import { PublicKey } from '@solana/web3.js';

interface IAddVoterDialogProps {
	dialogVisible: boolean;
	setDialogVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

interface IRegisterVoterParams {
	address: string;
}

export default ({ dialogVisible, setDialogVisible }: IAddVoterDialogProps) => {
	const anchorWallet = useAnchorWallet() as Wallet;
	const votingClient = useRecoilValue(votingClientState);
	const sessionCurrent = useRecoilValue(votingSessionCurrentState);

	const [pending, setPending] = useState(false);

	const [formData, setFormData] = useState<Partial<IRegisterVoterParams>>({});

	if (!anchorWallet || !votingClient || !sessionCurrent) return <></>;

	return (
		<Dialog
			disableEscapeKeyDown
			maxWidth={'sm'}
			aria-labelledby={'register-voter-title'}
			open={dialogVisible}
		>
			<DialogTitle id={'register-voter-title'}>{'Add a new voter'}</DialogTitle>
			<DialogContent dividers>
				<FormContainer
					defaultValues={formData}
					onSuccess={(data: IRegisterVoterParams) => {
						setFormData(data);
						setPending(true);
						votingClient
							?.registerVoter(
								anchorWallet,
								sessionCurrent.session.sessionId,
								new PublicKey(data.address),
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
							name={'address'}
							label={'Address'}
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
