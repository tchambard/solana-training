use anchor_lang::prelude::*;

declare_id!("7V6xnj4pkQY96MWF8PKmHMgTKHS2YFLZP632ZFx6QSdE");

#[program]
pub mod soltrain_voting_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
