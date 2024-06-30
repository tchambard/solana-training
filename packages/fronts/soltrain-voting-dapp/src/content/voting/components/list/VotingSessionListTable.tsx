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
import { connection, votingClientState } from '@/store/wallet';

export default () => {
	const [sessionList, setSessionList] = useRecoilState(votingSessionListState);
	const votingClient = useRecoilValue(votingClientState);

	useEffect(() => {
		if (!votingClient) return;
		if (sessionList.loaded) return;

		votingClient.listSessions().then((sessions) => {
			console.log('sessions :>> ', sessions);
			setSessionList({
				items: sessions,
				loaded: true,
			});
		});

		const listener = votingClient.addEventListener('sessionCreated', (event) => {
			setSessionList({
				items: sessionList.items,
				loaded: false,
			});
		});
		return () => {
			if (listener) {
				votingClient.program.removeEventListener(listener);
			}
		};
	}, [votingClient, sessionList.loaded]);

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
