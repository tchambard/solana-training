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

interface IAddProposalDialogProps {
	dialogVisible: boolean;
	setDialogVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export default ({
	dialogVisible,
	setDialogVisible,
}: IAddProposalDialogProps) => {
	// const { txPending, currentSession } = useSelector(
	// 	(state: RootState) => state.voting,
	// );
	// const [formData, setFormData] = useState<Partial<IRegisterProposalParams>>({});
	const [formData, setFormData] = useState<Partial<any>>({});

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
					// onSuccess={(data: IRegisterProposalParams) => {
					//     setFormData(data);
					//     // dispatch(
					//     //     REGISTER_PROPOSAL.request({
					//     //         sessionId: currentSession.item.id,
					//     //         description: data.description,
					//     //     }),
					//     // );
					//     setDialogVisible(false);
					// }}
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
							// loading={txPending}
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
