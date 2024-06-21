import { useEffect, useState } from 'react';
import {
	Container,
	Box,
	Grid,
	Paper,
	Typography,
	useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from 'react-i18next';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { getSolanaBalance, votingClient } from '@/services/VotingClientWrapper';

export default function IndexPage() {
	const { t } = useTranslation(['translation']);
	const { publicKey } = useWallet();
	const anchorWallet = useAnchorWallet();
	const theme = useTheme();
	const xsDisplay = useMediaQuery(theme.breakpoints.down('sm'));
	const [solanaBalance, setSolanaBalance] = useState<number | null>(null);

	useEffect(() => {
		if (!anchorWallet) return;
		votingClient;
		// .createVotingSession(anchorWallet, 'test', 'aaa')
		// .then((session) => {
		// 	console.log('session :>> ', session);
		// });
	}, [publicKey]);

	useEffect(() => {
		if (publicKey) {
			getSolanaBalance(publicKey.toBase58()).then((balance) =>
				setSolanaBalance(balance),
			);
		} else {
			setSolanaBalance(null);
		}
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
					<div>
						{solanaBalance !== null && (
							<div>
								<p>Balance: {solanaBalance} SOL</p>
							</div>
						)}
						<WalletMultiButton></WalletMultiButton>
					</div>
				</Grid>
			</Container>
		</>
	);
}
