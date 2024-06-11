use anchor_lang::prelude::*;

use super::global::*;

#[derive(Accounts)]
pub struct InitSession<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + SessionAccount::INIT_SPACE,
        seeds = [
            SessionAccount::SEED_PREFIX.as_ref(),
            &global_account.session_count.to_le_bytes()
        ],
        bump
    )]
    pub session_account: Account<'info, SessionAccount>,

    #[account(mut, seeds = [GlobalAccount::SEED], bump)]
    pub global_account: Account<'info, GlobalAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct SessionAccount {
    pub session_id: u64,
    #[max_len(20)]
    pub name: String,
    #[max_len(80)]
    pub description: String,
    pub status: SessionWorkflowStatus,
    pub proposal_count: u8,
}

impl SessionAccount {
    pub const SEED_PREFIX: &'static [u8; 7] = b"session";
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize, InitSpace)]
pub enum SessionWorkflowStatus {
    None,
    RegisteringVoters,
    ProposalsRegistrationStarted,
    ProposalsRegistrationEnded,
    VotingSessionStarted,
    VotingSessionEnded,
    VotesTallied,
}

#[event]
pub struct SessionWorkflowStatusChanged {
    pub session_id: u64,
    pub previous_status: SessionWorkflowStatus,
    pub current_status: SessionWorkflowStatus,
}

#[event]
pub struct SessionCreated {
    pub session_id: u64,
    pub name: String,
    pub description: String,
}
