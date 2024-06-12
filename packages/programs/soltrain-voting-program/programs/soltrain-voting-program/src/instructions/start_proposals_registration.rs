use anchor_lang::prelude::*;

use crate::{errors::VotingError, state::voting_session::*};

#[derive(Accounts)]
pub struct StartProposalRegistrationContextData<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub session_account: Account<'info, SessionAccount>,

    pub system_program: Program<'info, System>,
}

pub fn start_proposals_registration(
    ctx: Context<StartProposalRegistrationContextData>,
) -> Result<()> {
    let session_account = &mut ctx.accounts.session_account;

    if session_account.admin.key() != ctx.accounts.admin.key() {
        return err!(VotingError::ForbiddenAsNonAdmin);
    };
    if session_account.status != SessionWorkflowStatus::RegisteringVoters {
        return err!(VotingError::UnexpectedSessionStatus);
    };
    // register_proposal(_sessionId, "Abstention".to_string());
    // register_proposal(_sessionId, 'Blank'.to_string());

    session_account.status = SessionWorkflowStatus::ProposalsRegistrationStarted;

    emit!(SessionWorkflowStatusChanged {
        session_id: session_account.session_id,
        previous_status: SessionWorkflowStatus::RegisteringVoters,
        current_status: SessionWorkflowStatus::ProposalsRegistrationStarted,
    });

    Ok(())
}
