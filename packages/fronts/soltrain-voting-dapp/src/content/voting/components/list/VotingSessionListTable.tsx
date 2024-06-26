import { useEffect, useState } from 'react';
import {
	Card,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import { Link } from 'react-router-dom';

import VotingSessionListItemActions from './VotingSessionListItemActions';

import { votingSessionListState } from '@/store/voting';
import { useRecoilState, useRecoilValue } from 'recoil';
import { votingClientState } from '@/store/wallet';

export default () => {
	const [sessionList, setSessionList] = useRecoilState(votingSessionListState);
	const votingClient = useRecoilValue(votingClientState);

	useEffect(() => {
		if (!votingClient) return;
		votingClient.listSessions().then((sessions) => {
			setSessionList({
				items: sessions,
			});
		});
		// dispatch(LISTEN_VOTING_SESSION_CREATED.request());
	}, [votingClient]);

	return (
		<>
			<Card>
				<TableContainer>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>Name</TableCell>
								<TableCell>Description</TableCell>
								<TableCell align={'right'}>Actions</TableCell>
							</TableRow>
						</TableHead>

						<TableBody>
							{sessionList.items.map((session) => {
								return (
									<TableRow hover key={session.sessionId.toString()}>
										<TableCell>
											<Link to={`/voting/${session.sessionId}`}>
												<Typography
													variant={'body1'}
													fontWeight={'bold'}
													color={'text.primary'}
													gutterBottom
													noWrap
												>
													{session.name}
												</Typography>
											</Link>
										</TableCell>
										<TableCell>
											<Typography
												variant={'body1'}
												fontWeight={'bold'}
												color={'text.primary'}
												gutterBottom
												noWrap
											>
												{session.description}
											</Typography>
										</TableCell>
										<TableCell align={'right'}>
											<VotingSessionListItemActions
												currentView={'list'}
												sessionId={session.sessionId}
												// capabilities={session.$capabilities}
											/>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
			</Card>
		</>
	);
};
