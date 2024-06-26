import { useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';

import VotingSessionDeleteDialog from './VotingSessionDeleteDialog';
import ActionsMenu from 'src/components/ActionsMenu';
import { BN } from '@coral-xyz/anchor';

interface IProps {
	currentView: 'list' | 'edit' | 'detail';
	sessionId: BN;
	// capabilities: IVotingSessionDetailCapabilities;
}

export interface IActionMenuItem {
	title: string;
	url: string;
	color: string;
	icon: any;
	hidden?: boolean;
	description?: string;
	onClick?: () => void;
}

export default ({ sessionId, currentView }: IProps) => {
	const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

	const menuItems: IActionMenuItem[] = [
		{
			title: 'Details',
			description: 'View voting session details',
			url: `/voting/${sessionId}`,
			color: 'primary',
			icon: <AutoGraphIcon fontSize={'small'} />,
			hidden: currentView === 'detail',
		},
		{
			title: 'Delete',
			description: 'Delete voting session',
			color: 'error',
			icon: <DeleteIcon fontSize={'small'} />,
			url: '',
			// hidden: !capabilities.$canDelete,
			onClick: () => setDeleteDialogVisible(!deleteDialogVisible),
		},
	];

	return (
		<>
			<ActionsMenu items={menuItems} />
			{deleteDialogVisible && (
				<VotingSessionDeleteDialog
					sessionId={sessionId}
					dialogVisible={deleteDialogVisible}
					setDialogVisible={setDeleteDialogVisible}
				/>
			)}
		</>
	);
};
