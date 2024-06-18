use anchor_lang::prelude::*;

use crate::{errors::VotingError, state::voting_session::*};

#[derive(Accounts)]
pub struct StopVotingSessionContextData<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub session_account: Account<'info, SessionAccount>,

    pub system_program: Program<'info, System>,
}

pub fn stop_voting_session(ctx: Context<StopVotingSessionContextData>) -> Result<()> {
    let session_account = &mut ctx.accounts.session_account;

    require!(
        session_account.admin.key() == ctx.accounts.admin.key(),
        VotingError::ForbiddenAsNonAdmin
    );
    require!(
        session_account.status == SessionWorkflowStatus::VotingSessionStarted,
        VotingError::UnexpectedSessionStatus
    );

    session_account.status = SessionWorkflowStatus::VotingSessionEnded;

    emit!(SessionWorkflowStatusChanged {
        session_id: session_account.session_id,
        previous_status: SessionWorkflowStatus::VotingSessionStarted,
        current_status: SessionWorkflowStatus::VotingSessionEnded,
    });

    Ok(())
}
