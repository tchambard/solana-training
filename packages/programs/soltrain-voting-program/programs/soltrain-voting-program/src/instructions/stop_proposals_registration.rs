use anchor_lang::prelude::*;

use crate::{errors::VotingError, state::voting_session::*};

#[derive(Accounts)]
pub struct StopProposalRegistrationContextData<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub session_account: Account<'info, SessionAccount>,

    pub system_program: Program<'info, System>,
}

pub fn stop_proposals_registration(
    ctx: Context<StopProposalRegistrationContextData>,
) -> Result<()> {
    let session_account = &mut ctx.accounts.session_account;

    require!(
        session_account.admin.key() == ctx.accounts.admin.key(),
        VotingError::ForbiddenAsNonAdmin
    );
    require!(
        session_account.status == SessionWorkflowStatus::ProposalsRegistrationStarted,
        VotingError::UnexpectedSessionStatus
    );

    session_account.status = SessionWorkflowStatus::ProposalsRegistrationEnded;

    emit!(SessionWorkflowStatusChanged {
        session_id: session_account.session_id,
        previous_status: SessionWorkflowStatus::ProposalsRegistrationStarted,
        current_status: SessionWorkflowStatus::ProposalsRegistrationEnded,
    });

    Ok(())
}
