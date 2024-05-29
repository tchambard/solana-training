use anchor_lang::prelude::*;

declare_id!("4PGnHfbudx56T214YReyJ25n3UCfLvWG5icWocESzH6n");

#[program]
pub mod soltrain_voting_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
