use anchor_lang::prelude::*;

use crate::instructions::{create_voting_session::*, global::*, register_voter::*};

pub mod instructions;
pub mod state;
pub mod errors;

declare_id!("4PGnHfbudx56T214YReyJ25n3UCfLvWG5icWocESzH6n");

#[program]
pub mod voting {

    use instructions::{create_voting_session, global, register_voter};

    use super::*;

    pub fn init_global(ctx: Context<InitGlobalContextData>) -> Result<()> {
        global::init_global(ctx)
    }

    pub fn create_voting_session(
        ctx: Context<CreateVotingSessionContextData>,
        name: String,
        description: String,
    ) -> Result<()> {
        create_voting_session::create_voting_session(ctx, name, description)
    }

    pub fn register_voter(ctx: Context<RegisterVoterContextData>, voter: Pubkey) -> Result<()> {
        register_voter::register_voter(ctx, voter)
    }
}
