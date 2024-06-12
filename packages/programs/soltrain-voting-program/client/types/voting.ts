/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/voting.json`.
 */
export type Voting = {
	address: '4PGnHfbudx56T214YReyJ25n3UCfLvWG5icWocESzH6n';
	metadata: {
		name: 'voting';
		version: '0.1.0';
		spec: '0.1.0';
		description: 'Created with Anchor';
	};
	instructions: [
		{
			name: 'createVotingSession';
			docs: [
				"* Anyone can create new voting session. Session's creator becomes session administrator.\n     *\n     * @dev An event SessionCreated is emitted\n     *\n     * @param name The session name\n     * @param description The session description",
			];
			discriminator: [241, 56, 27, 243, 109, 166, 75, 93];
			accounts: [
				{
					name: 'owner';
					writable: true;
					signer: true;
				},
				{
					name: 'globalAccount';
					writable: true;
					pda: {
						seeds: [
							{
								kind: 'const';
								value: [103, 108, 111, 98, 97, 108];
							},
						];
					};
				},
				{
					name: 'sessionAccount';
					writable: true;
					pda: {
						seeds: [
							{
								kind: 'const';
								value: [115, 101, 115, 115, 105, 111, 110];
							},
							{
								kind: 'account';
								path: 'global_account.session_count';
								account: 'globalAccount';
							},
						];
					};
				},
				{
					name: 'systemProgram';
					address: '11111111111111111111111111111111';
				},
			];
			args: [
				{
					name: 'name';
					type: 'string';
				},
				{
					name: 'description';
					type: 'string';
				},
			];
		},
		{
			name: 'initGlobal';
			discriminator: [44, 238, 77, 253, 76, 182, 192, 162];
			accounts: [
				{
					name: 'globalAccount';
					writable: true;
					pda: {
						seeds: [
							{
								kind: 'const';
								value: [103, 108, 111, 98, 97, 108];
							},
						];
					};
				},
				{
					name: 'owner';
					writable: true;
					signer: true;
				},
				{
					name: 'systemProgram';
					address: '11111111111111111111111111111111';
				},
			];
			args: [];
		},
		{
			name: 'registerVoter';
			docs: [
				'* Session administrator can register voters.\n     *\n     * @dev voters can be added only by session administrator when status is set to RegisteringVoters\n     * An event VoterRegistered is emitted\n     *\n     * @param voter The address to add into voters registry',
			];
			discriminator: [229, 124, 185, 99, 118, 51, 226, 6];
			accounts: [
				{
					name: 'admin';
					writable: true;
					signer: true;
				},
				{
					name: 'sessionAccount';
				},
				{
					name: 'voterAccount';
					writable: true;
					pda: {
						seeds: [
							{
								kind: 'const';
								value: [118, 111, 116, 101, 114];
							},
							{
								kind: 'account';
								path: 'session_account.session_id';
								account: 'sessionAccount';
							},
							{
								kind: 'arg';
								path: 'voter';
							},
						];
					};
				},
				{
					name: 'systemProgram';
					address: '11111111111111111111111111111111';
				},
			];
			args: [
				{
					name: 'voter';
					type: 'pubkey';
				},
			];
		},
		{
			name: 'startProposalsRegistration';
			docs: [
				'* Administrator can close voters registration and open proposals registration.\n     *\n     * @dev Can be called only when status is set to RegisteringVoters.\n     * Two default proposals are registered at the beginning of this step: `Abstention` and `Blank`.\n     * That means a registered voter that forget to vote will be counted as `abstention` thanks to voter registration account and initialized state\n     * An event WorkflowStatusChanged is emitted\n     *\n     * @param _sessionId The session identifier',
			];
			discriminator: [186, 177, 117, 107, 84, 210, 40, 48];
			accounts: [
				{
					name: 'admin';
					writable: true;
					signer: true;
				},
				{
					name: 'sessionAccount';
					writable: true;
				},
				{
					name: 'systemProgram';
					address: '11111111111111111111111111111111';
				},
			];
			args: [];
		},
	];
	accounts: [
		{
			name: 'globalAccount';
			discriminator: [129, 105, 124, 171, 189, 42, 108, 69];
		},
		{
			name: 'sessionAccount';
			discriminator: [74, 34, 65, 133, 96, 163, 80, 69];
		},
		{
			name: 'voterAccount';
			discriminator: [24, 202, 161, 124, 196, 184, 105, 236];
		},
	];
	events: [
		{
			name: 'sessionCreated';
			discriminator: [107, 111, 254, 25, 21, 122, 220, 225];
		},
		{
			name: 'sessionWorkflowStatusChanged';
			discriminator: [37, 80, 31, 154, 111, 190, 223, 237];
		},
		{
			name: 'voterRegistered';
			discriminator: [184, 179, 209, 46, 125, 60, 51, 197];
		},
	];
	errors: [
		{
			code: 6000;
			name: 'unexpectedSessionStatus';
			msg: 'Unexpected session status';
		},
		{
			code: 6001;
			name: 'adminForbiddenAsVoter';
			msg: 'Voting session administrator can not be registered as voter';
		},
		{
			code: 6002;
			name: 'forbiddenAsNonAdmin';
			msg: 'Forbidden as non administrator';
		},
		{
			code: 6003;
			name: 'voterAlreadyRegistered';
			msg: 'Voter already registered';
		},
	];
	types: [
		{
			name: 'globalAccount';
			type: {
				kind: 'struct';
				fields: [
					{
						name: 'sessionCount';
						type: 'u64';
					},
				];
			};
		},
		{
			name: 'sessionAccount';
			type: {
				kind: 'struct';
				fields: [
					{
						name: 'admin';
						type: 'pubkey';
					},
					{
						name: 'sessionId';
						type: 'u64';
					},
					{
						name: 'name';
						type: 'string';
					},
					{
						name: 'description';
						type: 'string';
					},
					{
						name: 'status';
						type: {
							defined: {
								name: 'sessionWorkflowStatus';
							};
						};
					},
					{
						name: 'proposalCount';
						type: 'u8';
					},
				];
			};
		},
		{
			name: 'sessionCreated';
			type: {
				kind: 'struct';
				fields: [
					{
						name: 'sessionId';
						type: 'u64';
					},
					{
						name: 'name';
						type: 'string';
					},
					{
						name: 'description';
						type: 'string';
					},
				];
			};
		},
		{
			name: 'sessionWorkflowStatus';
			type: {
				kind: 'enum';
				variants: [
					{
						name: 'none';
					},
					{
						name: 'registeringVoters';
					},
					{
						name: 'proposalsRegistrationStarted';
					},
					{
						name: 'proposalsRegistrationEnded';
					},
					{
						name: 'votingSessionStarted';
					},
					{
						name: 'votingSessionEnded';
					},
					{
						name: 'votesTallied';
					},
				];
			};
		},
		{
			name: 'sessionWorkflowStatusChanged';
			type: {
				kind: 'struct';
				fields: [
					{
						name: 'sessionId';
						type: 'u64';
					},
					{
						name: 'previousStatus';
						type: {
							defined: {
								name: 'sessionWorkflowStatus';
							};
						};
					},
					{
						name: 'currentStatus';
						type: {
							defined: {
								name: 'sessionWorkflowStatus';
							};
						};
					},
				];
			};
		},
		{
			name: 'voterAccount';
			type: {
				kind: 'struct';
				fields: [
					{
						name: 'voter';
						type: 'pubkey';
					},
					{
						name: 'hasVoted';
						type: 'bool';
					},
					{
						name: 'votedProposalId';
						type: 'u8';
					},
					{
						name: 'nbProposals';
						type: 'u8';
					},
				];
			};
		},
		{
			name: 'voterRegistered';
			type: {
				kind: 'struct';
				fields: [
					{
						name: 'sessionId';
						type: 'u64';
					},
					{
						name: 'voter';
						type: 'pubkey';
					},
				];
			};
		},
	];
};
