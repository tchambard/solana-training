import * as anchor from '@coral-xyz/anchor';
import { AnchorError, BN, Program, Wallet } from '@coral-xyz/anchor';
import { assert } from 'chai';

import { Voting } from '../client/types/voting';
import { VotingClient, VotingSessionStatus } from '../client';

interface IExpectedError {
	code: string;
	number: number;
	errorMessage: string;
	programId: string;
}

async function assertError(fn: () => Promise<any>, expected: IExpectedError): Promise<void> {
	try {
		await fn();
		assert.ok(false);
	} catch (_err) {
		assert.isArray(_err.logs);
		const err = AnchorError.parse(_err.logs);
		// console.log('err :>> ', err);
		assert.strictEqual(err.error.errorMessage, expected.errorMessage);
		assert.strictEqual(err.error.errorCode.code, expected.code);
		assert.strictEqual(err.error.errorCode.number, expected.number);
		assert.strictEqual(err.program.toString(), expected.programId);
	}
}

describe('voting', () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.Voting as Program<Voting>;
	const connection = program.provider.connection;

	const administrator = provider.wallet as anchor.Wallet;
	const batman = new Wallet(anchor.web3.Keypair.generate());
	const superman = new Wallet(anchor.web3.Keypair.generate());

	const client = new VotingClient(program, { skipPreflight: false, preflightCommitment: 'confirmed' });
	let sessionId: BN;

	before(async () => {
		// initialize program global account
		await client.initGlobal(administrator);

		// request airdrop for voting actors
		await connection.requestAirdrop(batman.publicKey, 1000000000);
		await connection.requestAirdrop(superman.publicKey, 1000000000);
	});

	describe('> createVotingSession', () => {
		it('> should succeed when called with program administrator account', async () => {
			const expectedSessionId = 0;
			const name = 'Session A';
			const description = 'New session A';

			const { accounts, events } = await client.createVotingSession(administrator, name, description);
			const session = await client.getSession(accounts.sessionAccountPubkey);
			assert.equal(session.sessionId.toNumber(), expectedSessionId);
			assert.equal(session.admin.toString(), administrator.payer.publicKey.toString());
			assert.equal(session.name, name);
			assert.equal(session.description, description);
			assert.deepEqual(session.status, VotingSessionStatus.RegisteringVoters);
			assert.equal(session.votersCount, 0);
			assert.equal(session.proposalsCount, 1); // abstention

			const { sessionCreated, sessionWorkflowStatusChanged } = events;
			assert.equal(sessionWorkflowStatusChanged.sessionId.toString(), expectedSessionId);
			assert.deepEqual(sessionWorkflowStatusChanged.previousStatus, { none: {} });
			assert.deepEqual(sessionWorkflowStatusChanged.currentStatus, { registeringVoters: {} });

			assert.equal(sessionCreated.sessionId.toNumber(), expectedSessionId);
			assert.equal(sessionCreated.name, name);
			assert.equal(sessionCreated.description, description);
		});

		it('> should succeed when called with non administrator account', async () => {
			const expectedSessionId = 1;
			const name = 'Session B';
			const description = 'New session B';

			const {
				events,
				accounts: { sessionAccountPubkey },
			} = await client.createVotingSession(batman, name, description);

			const session = await client.getSession(sessionAccountPubkey);
			assert.equal(session.sessionId.toNumber(), expectedSessionId);
			assert.equal(session.admin.toString(), batman.publicKey.toString());
			assert.equal(session.name, name);
			assert.equal(session.description, description);
			assert.deepEqual(session.status, VotingSessionStatus.RegisteringVoters);
			assert.equal(session.votersCount, 0);
			assert.equal(session.proposalsCount, 1);

			const { sessionCreated, sessionWorkflowStatusChanged } = events;
			assert.equal(sessionWorkflowStatusChanged.sessionId.toString(), expectedSessionId);
			assert.deepEqual(sessionWorkflowStatusChanged.previousStatus, { none: {} });
			assert.deepEqual(sessionWorkflowStatusChanged.currentStatus, {
				registeringVoters: {},
			});

			assert.equal(sessionCreated.sessionId.toNumber(), expectedSessionId);
			assert.equal(sessionCreated.name, name);
			assert.equal(sessionCreated.description, description);
		});
	});

	describe('> Voting actions are conditionned by voting session status', () => {
		beforeEach(async () => {
			const {
				accounts: { sessionAccountPubkey },
			} = await client.createVotingSession(administrator, 'Super Heroes', 'A vote for every superheroes to find who will rule the world');
			const session = await client.getSession(sessionAccountPubkey);
			sessionId = session.sessionId;

			// register batman as voter
			await client.registerVoter(administrator, sessionId, batman.publicKey);
		});

		context('## voting status is RegisteringVoters', () => {
			describe('> createVotingSession', () => {
				it('> should succeed when called with non administrator account', async () => {
					const expectedSessionId = await client.getNextSessionId();
					const name = 'New Session';
					const description = 'New session Z';

					const { events } = await client.createVotingSession(batman, name, description);
					const { sessionCreated } = events;

					assert.equal(sessionCreated.sessionId.toNumber(), expectedSessionId.toNumber());
					assert.equal(sessionCreated.name, name);
					assert.equal(sessionCreated.description, description);
				});
			});

			describe('> registerVoter', () => {
				it('> should succeed when called with voting session administrator', async () => {
					const {
						events,
						accounts: { sessionAccountPubkey, voterAccountPubkey },
					} = await client.registerVoter(administrator, sessionId, superman.publicKey);

					const voter = await client.getVoter(voterAccountPubkey);
					assert.isFalse(voter.hasVoted);
					assert.equal(voter.nbProposals, 0);
					assert.equal(voter.votedProposalId, 0);
					assert.equal(voter.voter.toString(), superman.publicKey.toString());

					const { voterRegistered } = events;
					assert.equal(voterRegistered.sessionId.toNumber(), sessionId.toNumber());
					assert.equal(voterRegistered.voter.toString(), superman.publicKey.toString());

					const session = await client.getSession(sessionAccountPubkey);
					assert.equal(session.votersCount, 2);
				});

				it('> should fail when payer is not session administrator', async () => {
					await assertError(() => client.registerVoter(batman, sessionId, batman.publicKey), {
						number: 6002,
						code: 'ForbiddenAsNonAdmin',
						errorMessage: 'Forbidden as non administrator',
						programId: program.programId.toString(),
					});
				});

				it('> should fail when voter address is already registered', async () => {
					await assertError(() => client.registerVoter(administrator, sessionId, batman.publicKey), {
						number: 6004,
						code: 'VoterAlreadyRegistered',
						errorMessage: 'Voter already registered',
						programId: program.programId.toString(),
					});
				});

				it('> should fail when voter address is voting session administrator', async () => {
					await assertError(() => client.registerVoter(administrator, sessionId, administrator.publicKey), {
						number: 6001,
						code: 'AdminForbiddenAsVoter',
						errorMessage: 'Voting session administrator can not be registered as voter',
						programId: program.programId.toString(),
					});
				});
			});

			describe('> startProposalsRegistration', () => {
				it('> should succeed when called with non administrator account', async () => {
					const {
						events,
						accounts: { blankProposalAccountPubkey, sessionAccountPubkey },
					} = await client.startProposalsRegistration(administrator, sessionId);

					const proposal = await client.getProposal(blankProposalAccountPubkey);
					assert.equal(proposal.proposalId, 1);
					assert.equal(proposal.proposer.toString(), administrator.payer.publicKey.toString());
					assert.equal(proposal.description, 'blank');
					assert.equal(proposal.voteCount, 0);

					const session = await client.getSession(sessionAccountPubkey);
					assert.deepEqual(session.status, VotingSessionStatus.ProposalsRegistrationStarted);
					assert.equal(session.proposalsCount, 2);

					const { sessionWorkflowStatusChanged, proposalRegistered } = events;

					assert.equal(sessionWorkflowStatusChanged.sessionId.toString(), sessionId.toString());
					assert.deepEqual(sessionWorkflowStatusChanged.previousStatus, { registeringVoters: {} });
					assert.deepEqual(sessionWorkflowStatusChanged.currentStatus, { proposalsRegistrationStarted: {} });

					assert.equal(proposalRegistered.sessionId.toString(), sessionId.toString());
					assert.deepEqual(proposalRegistered.proposalId, 1);
					assert.deepEqual(proposalRegistered.description, 'blank');
				});

				it('> should fail when payer is not session administrator', async () => {
					await assertError(() => client.startProposalsRegistration(batman, sessionId), {
						number: 6002,
						code: 'ForbiddenAsNonAdmin',
						errorMessage: 'Forbidden as non administrator',
						programId: program.programId.toString(),
					});
				});
			});

			describe('> registerProposal', () => {
				it('> should fail when called with non registered voter address', async () => {
					await assertError(() => client.registerProposal(superman, sessionId, 'proposal 2'), {
						number: 3012,
						code: 'AccountNotInitialized',
						errorMessage: 'The program expected this account to be already initialized',
						programId: program.programId.toString(),
					});
				});

				it('> should fail when called with bad session status', async () => {
					await assertError(() => client.registerProposal(batman, sessionId, 'proposal 2'), {
						number: 6000,
						code: 'UnexpectedSessionStatus',
						errorMessage: 'Unexpected session status',
						programId: program.programId.toString(),
					});
				});
			});

			describe('> stopProposalsRegistration', () => {
				it('> should fail when called with bad session status', async () => {
					await assertError(() => client.stopProposalsRegistration(administrator, sessionId), {
						number: 6000,
						code: 'UnexpectedSessionStatus',
						errorMessage: 'Unexpected session status',
						programId: program.programId.toString(),
					});
				});

				it('> should fail when payer is not session administrator', async () => {
					await assertError(() => client.stopProposalsRegistration(batman, sessionId), {
						number: 6002,
						code: 'ForbiddenAsNonAdmin',
						errorMessage: 'Forbidden as non administrator',
						programId: program.programId.toString(),
					});
				});
			});

			describe('> startVotingSession', () => {
				it('> should fail when called with bad session status', async () => {
					await assertError(() => client.startVotingSession(administrator, sessionId), {
						number: 6000,
						code: 'UnexpectedSessionStatus',
						errorMessage: 'Unexpected session status',
						programId: program.programId.toString(),
					});
				});
			});

			describe('> stopVotingSession', () => {
				it('> should fail when called with bad session status', async () => {
					await assertError(() => client.stopVotingSession(administrator, sessionId), {
						number: 6000,
						code: 'UnexpectedSessionStatus',
						errorMessage: 'Unexpected session status',
						programId: program.programId.toString(),
					});
				});
			});

			context('## voting status is ProposalsRegistrationStarted', () => {
				beforeEach(async () => {
					await client.startProposalsRegistration(administrator, sessionId);
					await client.registerProposal(batman, sessionId, 'proposal 2');
				});

				describe('> createVotingSession', () => {
					it('> should succeed when called with non administrator account', async () => {
						const expectedSessionId = await client.getNextSessionId();
						const name = 'New Session';
						const description = 'New session Z';

						const { events } = await client.createVotingSession(batman, name, description);
						const { sessionCreated } = events;

						assert.equal(sessionCreated.sessionId.toNumber(), expectedSessionId.toNumber());
						assert.equal(sessionCreated.name, name);
						assert.equal(sessionCreated.description, description);
					});
				});

				describe('> registerVoter', () => {
					it('> should fail when called with bad session status', async () => {
						await assertError(() => client.registerVoter(administrator, sessionId, batman.publicKey), {
							number: 6000,
							code: 'UnexpectedSessionStatus',
							errorMessage: 'Unexpected session status',
							programId: program.programId.toString(),
						});
					});
				});

				describe('> startProposalsRegistration', () => {
					it('> should fail when called with bad session status', async () => {
						await assertError(() => client.startProposalsRegistration(administrator, sessionId), {
							number: 6000,
							code: 'UnexpectedSessionStatus',
							errorMessage: 'Unexpected session status',
							programId: program.programId.toString(),
						});
					});
				});

				describe('> registerProposal', () => {
					it('> should fail when called with non registered voter address', async () => {
						it('> should fail when called with non registered voter address', async () => {
							await assertError(() => client.registerProposal(batman, sessionId, 'proposal 3'), {
								number: 6005,
								code: 'ProposerNotRegistered',
								errorMessage: 'Proposer must be registered was voter',
								programId: program.programId.toString(),
							});
						});
					});

					it('> should succeed when called with registered voter address', async () => {
						const {
							events,
							accounts: { proposalAccountPubkey, voterAccountPubkey },
						} = await client.registerProposal(batman, sessionId, 'proposal 3');

						const proposal = await client.getProposal(proposalAccountPubkey);
						assert.equal(proposal.proposalId, 3);
						assert.equal(proposal.proposer.toString(), batman.publicKey.toString());
						assert.equal(proposal.description, 'proposal 3');
						assert.equal(proposal.voteCount, 0);

						const voter = await client.getVoter(voterAccountPubkey);
						assert.equal(voter.voter.toString(), batman.publicKey.toString());
						assert.equal(voter.nbProposals, 2);

						const { proposalRegistered } = events;
						assert.equal(proposalRegistered.sessionId.toNumber(), sessionId.toNumber());
						assert.equal(proposalRegistered.proposalId, 3);
						assert.equal(proposalRegistered.description, 'proposal 3');
					});
				});

				describe('> stopProposalsRegistration', () => {
					it('> should succeed when called with contrat owner address', async () => {
						const { events } = await client.stopProposalsRegistration(administrator, sessionId);
						const { sessionWorkflowStatusChanged } = events;

						assert.equal(sessionWorkflowStatusChanged.sessionId.toString(), sessionId.toString());
						assert.deepEqual(sessionWorkflowStatusChanged.previousStatus, { proposalsRegistrationStarted: {} });
						assert.deepEqual(sessionWorkflowStatusChanged.currentStatus, { proposalsRegistrationEnded: {} });
					});
				});

				context('## voting status is ProposalsRegistrationStopped', () => {
					beforeEach(async () => {
						await client.stopProposalsRegistration(administrator, sessionId);
					});

					describe('> startVotingSession', () => {
						it('> should succeed when called with session administrator', async () => {
							const { events } = await client.startVotingSession(administrator, sessionId);
							const { sessionWorkflowStatusChanged } = events;

							assert.equal(sessionWorkflowStatusChanged.sessionId.toString(), sessionId.toString());
							assert.deepEqual(sessionWorkflowStatusChanged.previousStatus, { proposalsRegistrationEnded: {} });
							assert.deepEqual(sessionWorkflowStatusChanged.currentStatus, { votingSessionStarted: {} });
						});
					});

					describe('> registerVoter', () => {
						it('> should fail when called with bad session status', async () => {
							await assertError(() => client.registerVoter(administrator, sessionId, superman.publicKey), {
								number: 6000,
								code: 'UnexpectedSessionStatus',
								errorMessage: 'Unexpected session status',
								programId: program.programId.toString(),
							});
						});
					});

					describe('> startProposalsRegistration', () => {
						it('> should fail when called with bad session status', async () => {
							await assertError(() => client.startProposalsRegistration(administrator, sessionId), {
								number: 6000,
								code: 'UnexpectedSessionStatus',
								errorMessage: 'Unexpected session status',
								programId: program.programId.toString(),
							});
						});
					});

					describe('> stopProposalsRegistration', () => {
						it('> should fail when called with bad session status', async () => {
							await assertError(() => client.stopProposalsRegistration(administrator, sessionId), {
								number: 6000,
								code: 'UnexpectedSessionStatus',
								errorMessage: 'Unexpected session status',
								programId: program.programId.toString(),
							});
						});
					});

					describe('> registerProposal', () => {
						it('> should fail when called with bad session status', async () => {
							await assertError(() => client.registerProposal(administrator, sessionId, 'proposal N'), {
								number: 3012,
								code: 'AccountNotInitialized',
								errorMessage: 'The program expected this account to be already initialized',
								programId: program.programId.toString(),
							});
						});
					});

					describe('> stopVotingSession', () => {
						it('> should succeed when called with session administrator', async () => {
							await assertError(() => client.registerProposal(administrator, sessionId, 'proposal N'), {
								number: 3012,
								code: 'AccountNotInitialized',
								errorMessage: 'The program expected this account to be already initialized',
								programId: program.programId.toString(),
							});
						});
					});

					describe('> vote', () => {
						it('> should fail when called with bad session status', async () => {
							await assertError(() => client.vote(batman, sessionId, 1), {
								number: 6000,
								code: 'UnexpectedSessionStatus',
								errorMessage: 'Unexpected session status',
								programId: program.programId.toString(),
							});
						});
					});

					context('## voting status is VotingSessionStarted', () => {
						beforeEach(async () => {
							await client.startVotingSession(administrator, sessionId);
						});

						describe('> createVotingSession', () => {
							it('> should succeed when called with non administrator account', async () => {
								const expectedSessionId = await client.getNextSessionId();
								const name = 'New Session';
								const description = 'New session Z';

								const { events } = await client.createVotingSession(batman, name, description);
								const { sessionCreated } = events;

								assert.equal(sessionCreated.sessionId.toNumber(), expectedSessionId.toNumber());
								assert.equal(sessionCreated.name, name);
								assert.equal(sessionCreated.description, description);
							});
						});

						describe('> registerVoter', () => {
							it('> should fail when called with bad session status', async () => {
								await assertError(() => client.registerVoter(administrator, sessionId, superman.publicKey), {
									number: 6000,
									code: 'UnexpectedSessionStatus',
									errorMessage: 'Unexpected session status',
									programId: program.programId.toString(),
								});
							});
						});

						describe('> startProposalsRegistration', () => {
							it('> should fail when called with bad session status', async () => {
								await assertError(() => client.startProposalsRegistration(administrator, sessionId), {
									number: 6000,
									code: 'UnexpectedSessionStatus',
									errorMessage: 'Unexpected session status',
									programId: program.programId.toString(),
								});
							});
						});

						describe('> stopProposalsRegistration', () => {
							it('> should fail when called with bad session status', async () => {
								await assertError(() => client.stopProposalsRegistration(administrator, sessionId), {
									number: 6000,
									code: 'UnexpectedSessionStatus',
									errorMessage: 'Unexpected session status',
									programId: program.programId.toString(),
								});
							});
						});

						describe('> registerProposal', () => {
							it('> should fail when called with bad session status', async () => {
								await assertError(() => client.registerProposal(administrator, sessionId, 'proposal N'), {
									number: 3012,
									code: 'AccountNotInitialized',
									errorMessage: 'The program expected this account to be already initialized',
									programId: program.programId.toString(),
								});
							});
						});

						describe('> startVotingSession', () => {
							it('> should fail when called with bad session status', async () => {
								await assertError(() => client.startVotingSession(administrator, sessionId), {
									number: 6000,
									code: 'UnexpectedSessionStatus',
									errorMessage: 'Unexpected session status',
									programId: program.programId.toString(),
								});
							});
						});

						describe('> stopVotingSession', () => {
							it('> should succeed when called with session administrator', async () => {
								const { events } = await client.stopVotingSession(administrator, sessionId);
								const { sessionWorkflowStatusChanged } = events;

								assert.equal(sessionWorkflowStatusChanged.sessionId.toString(), sessionId.toString());
								assert.deepEqual(sessionWorkflowStatusChanged.previousStatus, { votingSessionStarted: {} });
								assert.deepEqual(sessionWorkflowStatusChanged.currentStatus, { votingSessionEnded: {} });
							});
						});

						describe('> vote', () => {
							it('> should succeed when called with registered voter address', async () => {
								const {
									events,
									accounts: { voterAccountPubkey, proposalAccountPubkey },
								} = await client.vote(batman, sessionId, 1);

								const proposal = await client.getProposal(proposalAccountPubkey);
								assert.equal(proposal.voteCount, 1);

								const voter = await client.getVoter(voterAccountPubkey);
								assert.equal(voter.hasVoted, true);
								assert.equal(voter.votedProposalId, 1);

								const { voted } = events;

								assert.equal(voted.sessionId.toString(), sessionId.toString());
								assert.deepEqual(voted.proposalId, 1);
								assert.deepEqual(voted.voter, batman.publicKey);
							});

							it('> should fail when called with registered voter address that has already voted', async () => {
								await client.vote(batman, sessionId, 2);
								await assertError(() => client.vote(batman, sessionId, 2), {
									number: 6006,
									code: 'VoterAlreadyVoted',
									errorMessage: 'Voter already voted',
									programId: program.programId.toString(),
								});
							});
							it('> should fail when called with non registered voter address', async () => {
								await client.vote(batman, sessionId, 2);
								await assertError(() => client.vote(superman, sessionId, 2), {
									number: 3012,
									code: 'AccountNotInitialized',
									errorMessage: 'The program expected this account to be already initialized',
									programId: program.programId.toString(),
								});
							});
						});

						context('## voting status is VotingSessionEnded', () => {
							beforeEach(async () => {
								await client.stopVotingSession(administrator, sessionId);
							});

							describe('> createVotingSession', () => {
								it('> should succeed when called with non administrator account', async () => {
									const expectedSessionId = await client.getNextSessionId();
									const name = 'New Session';
									const description = 'New session Z';

									const { events } = await client.createVotingSession(batman, name, description);
									const { sessionCreated } = events;

									assert.equal(sessionCreated.sessionId.toNumber(), expectedSessionId.toNumber());
									assert.equal(sessionCreated.name, name);
									assert.equal(sessionCreated.description, description);
								});
							});

							describe('> registerVoter', () => {
								it('> should fail when called with bad session status', async () => {
									await assertError(() => client.registerVoter(administrator, sessionId, superman.publicKey), {
										number: 6000,
										code: 'UnexpectedSessionStatus',
										errorMessage: 'Unexpected session status',
										programId: program.programId.toString(),
									});
								});
							});

							describe('> startProposalsRegistration', () => {
								it('> should fail when called with bad session status', async () => {
									await assertError(() => client.startProposalsRegistration(administrator, sessionId), {
										number: 6000,
										code: 'UnexpectedSessionStatus',
										errorMessage: 'Unexpected session status',
										programId: program.programId.toString(),
									});
								});
							});

							describe('> stopProposalsRegistration', () => {
								it('> should fail when called with bad session status', async () => {
									await assertError(() => client.stopProposalsRegistration(administrator, sessionId), {
										number: 6000,
										code: 'UnexpectedSessionStatus',
										errorMessage: 'Unexpected session status',
										programId: program.programId.toString(),
									});
								});
							});

							describe('> startVotingSession', () => {
								it('> should fail when called with bad session status', async () => {
									await assertError(() => client.startVotingSession(administrator, sessionId), {
										number: 6000,
										code: 'UnexpectedSessionStatus',
										errorMessage: 'Unexpected session status',
										programId: program.programId.toString(),
									});
								});
							});

							describe('> stopVotingSession', () => {
								it('> should fail when called with bad session status', async () => {
									await assertError(() => client.stopVotingSession(administrator, sessionId), {
										number: 6000,
										code: 'UnexpectedSessionStatus',
										errorMessage: 'Unexpected session status',
										programId: program.programId.toString(),
									});
								});
							});

							describe('> registerProposal', () => {
								it('> should fail when called with bad session status', async () => {
									await assertError(() => client.registerProposal(batman, sessionId, 'New proposal'), {
										number: 6000,
										code: 'UnexpectedSessionStatus',
										errorMessage: 'Unexpected session status',
										programId: program.programId.toString(),
									});
								});
							});

							describe('> vote', () => {
								it('> should fail when called with registered voter address', async () => {
									await assertError(() => client.vote(batman, sessionId, 1), {
										number: 6000,
										code: 'UnexpectedSessionStatus',
										errorMessage: 'Unexpected session status',
										programId: program.programId.toString(),
									});
								});
							});

							describe('> tallyVotes', () => {
								it('> should succeed when called with contrat owner address', async () => {
									const {
										events,
										accounts: { sessionAccountPubkey },
									} = await client.tallyVotes(administrator, sessionId);

									const { sessionWorkflowStatusChanged, votesTallied } = events;
									assert.equal(sessionWorkflowStatusChanged.sessionId.toString(), sessionId.toString());
									assert.deepEqual(sessionWorkflowStatusChanged.previousStatus, { votingSessionEnded: {} });
									assert.deepEqual(sessionWorkflowStatusChanged.currentStatus, { votesTallied: {} });

									assert.equal(votesTallied.sessionId.toNumber(), sessionId.toNumber());
									assert.equal(votesTallied.votersCount, 1);
									assert.equal(votesTallied.totalVotes, 0);
									assert.equal(votesTallied.blankVotes, 0);
									assert.equal(votesTallied.abstention, 1);
									assert.isEmpty(votesTallied.winningProposals);

									const session = await client.getSession(sessionAccountPubkey);
									assert.deepEqual(session.status, VotingSessionStatus.VotesTallied);
									assert.equal(session.votersCount, 1);
								});
							});

							context('## voting status is VotesTallied', () => {
								beforeEach(async () => {
									await client.tallyVotes(administrator, sessionId);
								});
								describe('> createVotingSession', () => {
									it('> should succeed when called with non administrator account', async () => {
										const expectedSessionId = await client.getNextSessionId();
										const name = 'New Session';
										const description = 'New session Z';

										const { events } = await client.createVotingSession(batman, name, description);
										const { sessionCreated } = events;

										assert.equal(sessionCreated.sessionId.toNumber(), expectedSessionId.toNumber());
										assert.equal(sessionCreated.name, name);
										assert.equal(sessionCreated.description, description);
									});
								});

								describe('> registerVoter', () => {
									it('> should fail when called with bad session status', async () => {
										await assertError(() => client.registerVoter(administrator, sessionId, superman.publicKey), {
											number: 6000,
											code: 'UnexpectedSessionStatus',
											errorMessage: 'Unexpected session status',
											programId: program.programId.toString(),
										});
									});
								});

								describe('> startProposalsRegistration', () => {
									it('> should fail when called with bad session status', async () => {
										await assertError(() => client.startProposalsRegistration(administrator, sessionId), {
											number: 6000,
											code: 'UnexpectedSessionStatus',
											errorMessage: 'Unexpected session status',
											programId: program.programId.toString(),
										});
									});
								});

								describe('> stopProposalsRegistration', () => {
									it('> should fail when called with bad session status', async () => {
										await assertError(() => client.stopProposalsRegistration(administrator, sessionId), {
											number: 6000,
											code: 'UnexpectedSessionStatus',
											errorMessage: 'Unexpected session status',
											programId: program.programId.toString(),
										});
									});
								});

								describe('> startVotingSession', () => {
									it('> should fail when called with bad session status', async () => {
										await assertError(() => client.startVotingSession(administrator, sessionId), {
											number: 6000,
											code: 'UnexpectedSessionStatus',
											errorMessage: 'Unexpected session status',
											programId: program.programId.toString(),
										});
									});
								});

								describe('> stopVotingSession', () => {
									it('> should fail when called with bad session status', async () => {
										await assertError(() => client.stopVotingSession(administrator, sessionId), {
											number: 6000,
											code: 'UnexpectedSessionStatus',
											errorMessage: 'Unexpected session status',
											programId: program.programId.toString(),
										});
									});
								});

								describe('> registerProposal', () => {
									it('> should fail when called with bad session status', async () => {
										await assertError(() => client.registerProposal(batman, sessionId, 'New proposal'), {
											number: 6000,
											code: 'UnexpectedSessionStatus',
											errorMessage: 'Unexpected session status',
											programId: program.programId.toString(),
										});
									});
								});

								describe('> vote', () => {
									it('> should fail when called with bad session status', async () => {
										await assertError(() => client.vote(batman, sessionId, 1), {
											number: 6000,
											code: 'UnexpectedSessionStatus',
											errorMessage: 'Unexpected session status',
											programId: program.programId.toString(),
										});
									});
								});

								describe('> tallyVotes', () => {
									it('> should fail when called with bad session status', async () => {
										await assertError(() => client.tallyVotes(administrator, sessionId), {
											number: 6000,
											code: 'UnexpectedSessionStatus',
											errorMessage: 'Unexpected session status',
											programId: program.programId.toString(),
										});
									});
								});
							});
						});
					});
				});
			});
		});
	});

	describe('> A complete super heroes voting session', () => {
		const acquaman = new Wallet(anchor.web3.Keypair.generate());
		const ironman = new Wallet(anchor.web3.Keypair.generate());
		const antman = new Wallet(anchor.web3.Keypair.generate());
		const spiderman = new Wallet(anchor.web3.Keypair.generate());
		const wonderwoman = new Wallet(anchor.web3.Keypair.generate());

		before(async () => {
			await connection.requestAirdrop(acquaman.publicKey, 1000000000);
			await connection.requestAirdrop(ironman.publicKey, 1000000000);
			await connection.requestAirdrop(antman.publicKey, 1000000000);
			await connection.requestAirdrop(spiderman.publicKey, 1000000000);
			await connection.requestAirdrop(wonderwoman.publicKey, 1000000000);

			const {
				accounts: { sessionAccountPubkey },
			} = await client.createVotingSession(administrator, 'Super Heroes', 'Complete vote');
			const session = await client.getSession(sessionAccountPubkey);
			sessionId = session.sessionId;

			await client.registerVoter(administrator, sessionId, superman.publicKey);
			await client.registerVoter(administrator, sessionId, batman.publicKey);
			await client.registerVoter(administrator, sessionId, wonderwoman.publicKey);
			await client.registerVoter(administrator, sessionId, acquaman.publicKey);
			await client.registerVoter(administrator, sessionId, ironman.publicKey);
			await client.registerVoter(administrator, sessionId, antman.publicKey);
			await client.registerVoter(administrator, sessionId, spiderman.publicKey);

			await client.startProposalsRegistration(administrator, sessionId);

			await client.registerProposal(superman, sessionId, 'Humans should serve cryptonian people !!'); // 2
			await client.registerProposal(superman, sessionId, 'Cryptonian people should serve me'); // 3
			await client.registerProposal(batman, sessionId, 'We would never put the light in the streets'); // 4
			await client.registerProposal(wonderwoman, sessionId, 'Only women should be allowed to vote here next time'); // 5
			await client.registerProposal(acquaman, sessionId, 'We should make a big tsunami!'); // 6

			await client.stopProposalsRegistration(administrator, sessionId);

			await client.startVotingSession(administrator, sessionId);

			await client.vote(superman, sessionId, 4);
			await client.vote(batman, sessionId, 3);
			await client.vote(wonderwoman, sessionId, 4);
			await client.vote(acquaman, sessionId, 1);
			await client.vote(ironman, sessionId, 6);
			await client.vote(spiderman, sessionId, 3);

			await client.stopVotingSession(administrator, sessionId);
		});

		it('> should allow to fetch registered voters with pagination', async () => {
			const firstSessionId = (await client.getNextSessionId()!).toNumber();
			for (let i = firstSessionId; i < firstSessionId + 10; i++) {
				await client.createVotingSession(administrator, `s${i}`, `The Session ${i}`);
			}
			const sessionsPage1 = await client.listSessions({ page: 1, perPage: 4 });
			const sessionsPage2 = await client.listSessions({ page: 2, perPage: 4 });
			const sessionsPage3 = await client.listSessions({ page: 3, perPage: 4 });
			assert.lengthOf(sessionsPage1, 4);
			assert.lengthOf(sessionsPage2, 4);
			//assert.lengthOf(sessionsPage3, 4);

			const allSessions = await client.listSessions({ page: 1, perPage: 400 });
			allSessions
				.filter((s) => s.description.startsWith('The Session'))
				.forEach((session, i) => {
					assert.isDefined(session.sessionId);
					assert.equal(session.name, `s${session.sessionId}`);
					assert.equal(session.description, `The Session ${session.sessionId}`);
					assert.equal(session.status, VotingSessionStatus.RegisteringVoters);
					assert.equal(session.admin.toString(), administrator.publicKey.toString());
					assert.equal(session.votersCount, 0);
					assert.equal(session.proposalsCount, 1);
					assert.isEmpty(session.result.winningProposals);
				});
		});

		it('> should allow to fetch registered voters with pagination', async () => {
			const votersPage1 = await client.listVoters(sessionId, { page: 1, perPage: 4 });
			assert.sameDeepMembers(votersPage1, [
				{
					sessionId,
					voter: superman.publicKey,
					voterId: 1,
					hasVoted: true,
					votedProposalId: 4,
					nbProposals: 2,
				},
				{
					sessionId,
					voter: batman.publicKey,
					voterId: 2,
					hasVoted: true,
					votedProposalId: 3,
					nbProposals: 1,
				},
				{
					sessionId,
					voter: wonderwoman.publicKey,
					voterId: 3,
					hasVoted: true,
					votedProposalId: 4,
					nbProposals: 1,
				},
				{
					sessionId,
					voter: acquaman.publicKey,
					voterId: 4,
					hasVoted: true,
					votedProposalId: 1,
					nbProposals: 1,
				},
			]);
			const votersPage2 = await client.listVoters(sessionId, { page: 2, perPage: 4 });
			assert.sameDeepMembers(votersPage2, [
				{
					sessionId,
					voter: ironman.publicKey,
					voterId: 5,
					hasVoted: true,
					votedProposalId: 6,
					nbProposals: 0,
				},
				{
					sessionId,
					voter: antman.publicKey,
					voterId: 6,
					hasVoted: false,
					votedProposalId: 0,
					nbProposals: 0,
				},
				{
					sessionId,
					voter: spiderman.publicKey,
					voterId: 7,
					hasVoted: true,
					votedProposalId: 3,
					nbProposals: 0,
				},
			]);
		});

		it('> should allow to fetch registered proposals with pagination', async () => {
			const proposalsPage1 = await client.listProposals(sessionId, { page: 1, perPage: 4 });
			assert.sameDeepMembers(proposalsPage1, [
				{
					sessionId,
					proposalId: 1,
					description: 'blank',
					proposer: administrator.publicKey,
					voteCount: 1,
				},
				{
					sessionId,
					proposalId: 2,
					description: 'Humans should serve cryptonian people !!',
					proposer: superman.publicKey,
					voteCount: 0,
				},
				{
					sessionId,
					proposalId: 3,
					description: 'Cryptonian people should serve me',
					proposer: superman.publicKey,
					voteCount: 2,
				},
				{
					sessionId,
					proposalId: 4,
					description: 'We would never put the light in the streets',
					proposer: batman.publicKey,
					voteCount: 2,
				},
			]);
			const proposalsPage2 = await client.listProposals(sessionId, { page: 2, perPage: 4 });
			assert.sameDeepMembers(proposalsPage2, [
				{
					sessionId,
					proposalId: 5,
					description: 'Only women should be allowed to vote here next time',
					proposer: wonderwoman.publicKey,
					voteCount: 0,
				},
				{
					sessionId,
					proposalId: 6,
					description: 'We should make a big tsunami!',
					proposer: acquaman.publicKey,
					voteCount: 1,
				},
			]);
		});

		it('> should allow to get the voting session result', async () => {
			const { events } = await client.tallyVotes(administrator, sessionId);
			const { sessionWorkflowStatusChanged, votesTallied } = events;
			assert.equal(sessionWorkflowStatusChanged.sessionId.toString(), sessionId.toString());
			assert.deepEqual(sessionWorkflowStatusChanged.previousStatus, { votingSessionEnded: {} });
			assert.deepEqual(sessionWorkflowStatusChanged.currentStatus, { votesTallied: {} });

			assert.equal(votesTallied.sessionId.toNumber(), sessionId.toNumber());
			assert.equal(votesTallied.votersCount, 7);
			assert.equal(votesTallied.totalVotes, 6);
			assert.equal(votesTallied.blankVotes, 1);
			assert.equal(votesTallied.abstention, 1);
			assert.sameMembers(votesTallied.winningProposals, [3, 4]);
		});
	});
});
