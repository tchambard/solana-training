use anchor_lang::prelude::*;

declare_id!("Gma1Uuq1wjsg3gsbuaWoHki2QPtWn1ikD46s2WUTyWtE");

#[program]
pub mod soltrain_voting_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
