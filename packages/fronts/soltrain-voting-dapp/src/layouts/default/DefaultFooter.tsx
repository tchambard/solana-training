import { Container, Toolbar, Typography, Box, IconButton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { useRecoilValue } from 'recoil';
import { colorModeState } from '@/store/colorMode';
import { EpicsGrey } from '@/constants/colors';

export default function DefaultFooter() {
	const colorMode = useRecoilValue(colorModeState);
	return (
		<>
			<Container maxWidth="lg">
				<Toolbar>
					<Typography variant="caption">
						Alyra - Solana Foundation - ©2024
					</Typography>
				</Toolbar>
			</Container>
		</>
	);
}
