use anchor_lang::prelude::*;

use crate::instructions::global::*;
use crate::instructions::voting_session::*;

pub mod instructions;
pub mod state;

declare_id!("4PGnHfbudx56T214YReyJ25n3UCfLvWG5icWocESzH6n");

#[program]
pub mod voting {

    use instructions::{global, voting_session};

    use super::*;

    pub fn init_global(ctx: Context<InitGlobalAccount>) -> Result<()> {
        global::init_global(ctx)
    }

    pub fn create_voting_session(
        ctx: Context<InitVotingSessionAccount>,
        name: String,
        description: String,
    ) -> Result<()> {
        voting_session::create_voting_session(ctx, name, description)
    }
}
