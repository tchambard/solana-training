use anchor_lang::prelude::*;

use crate::instructions::{
    create_voting_session::*, global::*, register_proposal::*, register_voter::*,
    start_proposals_registration::*, start_voting_session::*, stop_proposals_registration::*,
    stop_voting_session::*, tally_votes::*, vote::*,
};

pub mod errors;
pub mod instructions;
pub mod state;

declare_id!("4PGnHfbudx56T214YReyJ25n3UCfLvWG5icWocESzH6n");

#[program]
pub mod voting {

    use instructions::*;

    use super::*;

    pub fn init_global(ctx: Context<InitGlobalContextData>) -> Result<()> {
        global::init_global(ctx)
    }

    /**
     * Anyone can create new voting session. Session's creator becomes session administrator.
     *
     * @dev An event SessionCreated is emitted
     *
     * @param name The session name
     * @param description The session description
     */
    pub fn create_voting_session(
        ctx: Context<CreateVotingSessionContextData>,
        name: String,
        description: String,
    ) -> Result<()> {
        create_voting_session::create_voting_session(ctx, name, description)
    }

    /**
     * Session administrator can register voters.
     *
     * @dev voters can be added only by session administrator when status is set to RegisteringVoters
     * An event VoterRegistered is emitted
     *
     * @param voter The address to add into voters registry
     */
    pub fn register_voter(ctx: Context<RegisterVoterContextData>, voter: Pubkey) -> Result<()> {
        register_voter::register_voter(ctx, voter)
    }

    /**
     * Administrator can close voters registration and open proposals registration.
     *
     * @dev Can be called only when status is set to RegisteringVoters.
     * Two default proposals are registered at the beginning of this step: `Abstention` and `Blank`.
     * That means a registered voter that forget to vote will be counted as `abstention` thanks to voter registration account and initialized state
     * An event WorkflowStatusChanged is emitted
     */
    pub fn start_proposals_registration(
        ctx: Context<StartProposalRegistrationContextData>,
    ) -> Result<()> {
        start_proposals_registration::start_proposals_registration(ctx)
    }

    /**
     * A voter can register a new proposal.
     *
     * @dev Each voter can register many proposals.
     * As the vote is considered to be done in small organization context, and to prevent dos gas limit, the maximum number of proposals is limited to 256.
     * A vote can be added only by registered voter when status is set to VotingSessionStarted
     *
     * @param description The proposal description
     */
    pub fn register_proposal(
        ctx: Context<RegisterProposalContextData>,
        description: String,
    ) -> Result<()> {
        register_proposal::register_proposal(ctx, description)
    }

    /**
     * Administrator can close proposals registration.
     *
     * @dev Can be called only when status is set to ProposalsRegistrationStarted.
     * An event WorkflowStatusChange is emitted
     */
    pub fn stop_proposals_registration(
        ctx: Context<StopProposalRegistrationContextData>,
    ) -> Result<()> {
        stop_proposals_registration::stop_proposals_registration(ctx)
    }

    /**
     * A voter can register his vote for a proposal.
     *
     * @dev Each voter can vote only once for one proposal.
     * Votes can be added only by registered voter when status is set to VotingSessionStarted
     */
    pub fn vote(ctx: Context<VoteContextData>) -> Result<()> {
        vote::vote(ctx)
    }

    /**
     * Administrator can open voting session.
     *
     * @dev Can be called only when status is set to ProposalsRegistrationEnded.
     * An event WorkflowStatusChange is emitted
     */
    pub fn start_voting_session(ctx: Context<StartVotingSessionContextData>) -> Result<()> {
        start_voting_session::start_voting_session(ctx)
    }

    /**
     * Administrator can close voting session.
     *
     * @dev Can be called only when status is set to VotingSessionStarted.
     * An event WorkflowStatusChange is emitted
     */
    pub fn stop_voting_session(ctx: Context<StopVotingSessionContextData>) -> Result<()> {
        stop_voting_session::stop_voting_session(ctx)
    }

    /**
     * Administrator can trigger votes talling.
     *
     * @dev After votes talling, it is possible that we got many winning proposals.
     * Votes talling can be triggered only by voting session administrator when voting session status is set to VotingSessionEnded
     * Events WorkflowStatusChange and VotesTallied are emitted
     *
     */
    pub fn tally_votes<'info>(
        ctx: Context<'_, '_, 'info, 'info, TallyVotesContextData<'info>>,
    ) -> Result<()> {
        tally_votes::tally_votes(ctx)
    }
}
