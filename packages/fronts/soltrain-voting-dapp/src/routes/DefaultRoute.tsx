import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLoading from '@/components/loading/AppLoading';
import VotingWrapper from '@/content/voting/components/VotingWrapper';

export class RoutePaths {
	public static ROOT = `/`;

	public static VOTING_SESSION_LIST = `/voting`;
	public static VOTING_SESSION_DETAIL = `${RoutePaths.VOTING_SESSION_LIST}/:sessionId`;
}

const fallback = {
	from: '*',
	to: RoutePaths.ROOT,
};

const pages = [
	{
		component: lazy(() => import('@/pages/IndexPage')),
		path: RoutePaths.ROOT,
	},
	{
		component: lazy(
			() =>
				import('src/content/voting/components/list/VotingSessionListContainer'),
		),
		path: RoutePaths.VOTING_SESSION_LIST,
	},
	{
		component: lazy(
			() => import('src/content/voting/components/detail/VotingSessionContainer'),
		),
		path: RoutePaths.VOTING_SESSION_DETAIL,
	},
];

export default function DefaultRoute() {
	return (
		<Routes>
			{pages.map((page) => (
				<Route
					key={page.path}
					path={page.path}
					element={
						<Suspense fallback={<AppLoading />}>
							<VotingWrapper>
								<page.component />
							</VotingWrapper>
						</Suspense>
					}
				/>
			))}
			<Route
				path={fallback.from}
				element={<Navigate to={{ pathname: fallback.to }} replace />}
			/>
		</Routes>
	);
}
