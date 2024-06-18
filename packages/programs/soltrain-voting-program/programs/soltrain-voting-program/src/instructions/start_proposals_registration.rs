use anchor_lang::prelude::*;

use crate::{
    errors::VotingError,
    instructions::register_proposal::*,
    state::{proposal::ProposalAccount, voting_session::*},
};

#[derive(Accounts)]
pub struct StartProposalRegistrationContextData<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub session_account: Account<'info, SessionAccount>,

    #[account(
        init_if_needed,
        payer = admin,
        space = 8 + ProposalAccount::INIT_SPACE,
        seeds = [
            ProposalAccount::SEED_PREFIX.as_ref(),
            &session_account.session_id.to_le_bytes(),
            &[1]
        ],
        bump
    )]
    pub blank_proposal_account: Account<'info, ProposalAccount>,
    pub system_program: Program<'info, System>,
}

pub fn start_proposals_registration(
    ctx: Context<StartProposalRegistrationContextData>,
) -> Result<()> {
    let session_account = &mut ctx.accounts.session_account;
    let blank_proposal_account = &mut ctx.accounts.blank_proposal_account;

    require!(
        session_account.admin.key() == ctx.accounts.admin.key(),
        VotingError::ForbiddenAsNonAdmin
    );
    require!(
        session_account.status == SessionWorkflowStatus::RegisteringVoters,
        VotingError::UnexpectedSessionStatus
    );

    register_internal_proposal(
        blank_proposal_account,
        session_account.session_id,
        session_account.admin,
        1,
        "blank".to_string(),
    );

    session_account.proposals_count += 1;
    session_account.status = SessionWorkflowStatus::ProposalsRegistrationStarted;

    emit!(SessionWorkflowStatusChanged {
        session_id: session_account.session_id,
        previous_status: SessionWorkflowStatus::RegisteringVoters,
        current_status: SessionWorkflowStatus::ProposalsRegistrationStarted,
    });

    Ok(())
}
