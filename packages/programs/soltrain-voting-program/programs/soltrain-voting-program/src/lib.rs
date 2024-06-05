use anchor_lang::prelude::*;

declare_id!("4PGnHfbudx56T214YReyJ25n3UCfLvWG5icWocESzH6n");

#[program]
pub mod voting {
    use super::*;

    pub fn create_voting_session(
        ctx: Context<InitSession>,
        name: String,
        description: String,
    ) -> Result<()> {
        let global_account = &mut ctx.accounts.global_account;
        let session_account = &mut ctx.accounts.session_account;
        session_account.status = WorkflowStatus::None;

        session_account.session_id = global_account.session_count;
        session_account.name = name;
        session_account.description = description;
        session_account.proposal_count = 0;

        global_account.session_count += 1;
        Ok(())
    }

    pub fn init_program(ctx: Context<InitGlobal>) -> Result<()> {
        let global_account = &mut ctx.accounts.global_account;
        global_account.session_count = 0;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitSession<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + SessionAccount::INIT_SPACE,
        seeds = [
            b"session".as_ref(),
            &global_account.session_count.to_le_bytes()
        ],
        bump
    )]
    pub session_account: Account<'info, SessionAccount>,

    #[account(mut, seeds = [b"global".as_ref()], bump)]
    pub global_account: Account<'info, GlobalAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitGlobal<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + GlobalAccount::INIT_SPACE,
        seeds = [b"global".as_ref()],
        bump,
    )]
    pub global_account: Account<'info, GlobalAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct GlobalAccount {
    pub session_count: u64,
}

#[account]
#[derive(InitSpace)]
pub struct SessionAccount {
    pub session_id: u64,
    #[max_len(20)]
    pub name: String,
    #[max_len(80)]
    pub description: String,
    pub status: WorkflowStatus,
    pub proposal_count: u64,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize, InitSpace)]
pub enum WorkflowStatus {
    None,
    RegisteringVoters,
    ProposalsRegistrationStarted,
    ProposalsRegistrationEnded,
    VotingSessionStarted,
    VotingSessionEnded,
    VotesTallied,
}
