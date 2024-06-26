import { Card, Container, Grid } from '@mui/material';
import { Helmet } from 'react-helmet-async';

import PageTitleWrapper from 'src/components/PageTitleWrapper';
import VotingSessionsListHeader from './VotingSessionListHeader';
import VotingSessionsListTable from './VotingSessionListTable';

export default () => {
	return (
		<>
			<Helmet>
				<title>Voting sessions</title>
			</Helmet>
			<PageTitleWrapper>
				<VotingSessionsListHeader />
			</PageTitleWrapper>
			<Container maxWidth={'xl'}>
				<Grid
					container
					direction={'row'}
					justifyContent={'center'}
					alignItems={'stretch'}
					spacing={3}
				>
					<Grid item xs={12}>
						<Card>
							<VotingSessionsListTable />
						</Card>
					</Grid>
				</Grid>
			</Container>
		</>
	);
};
