use anchor_lang::prelude::*;

use crate::instructions::{
    create_voting_session::*, global::*, register_voter::*, start_proposals_registration::*,
};

pub mod errors;
pub mod instructions;
pub mod state;

declare_id!("4PGnHfbudx56T214YReyJ25n3UCfLvWG5icWocESzH6n");

#[program]
pub mod voting {

    use instructions::{
        create_voting_session, global, register_voter, start_proposals_registration,
    };

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
     *
     * @param _sessionId The session identifier
     */
    pub fn start_proposals_registration(
        ctx: Context<StartProposalRegistrationContextData>,
    ) -> Result<()> {
        start_proposals_registration::start_proposals_registration(ctx)
    }
}
