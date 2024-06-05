import { useEffect } from 'react';
import {
	Container,
	Box,
	Grid,
	Paper,
	Typography,
	useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from 'react-i18next';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function IndexPage() {
	const { t } = useTranslation(['translation']);
	const { publicKey } = useWallet();
	const theme = useTheme();
	const xsDisplay = useMediaQuery(theme.breakpoints.down('sm'));

	useEffect(() => {
		// TODO: fetch item list
	}, [publicKey]);

	if (!publicKey) {
		return (
			<>
				<Container maxWidth="sm">
					<Box py={8}>
						<Paper>
							<Box px={xsDisplay ? 4 : 6} py={6}>
								<Typography variant="h3">{t('pleaseConnect')}</Typography>
								<Box pt={6}>
									<WalletMultiButton />
								</Box>
							</Box>
						</Paper>
					</Box>
				</Container>
			</>
		);
	}

	return (
		<>
			<Container maxWidth="lg">
				<Grid container spacing={4}>
					{/* TODO */}
				</Grid>
			</Container>
		</>
	);
}
