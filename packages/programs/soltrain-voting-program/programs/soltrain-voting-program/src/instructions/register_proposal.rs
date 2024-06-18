use anchor_lang::prelude::*;

use crate::{
    errors::VotingError,
    state::{proposal::*, voter::VoterAccount, voting_session::*},
};

#[derive(Accounts)]
pub struct RegisterProposalContextData<'info> {
    #[account(mut)]
    pub proposer: Signer<'info>,

    #[account(mut)]
    pub session_account: Account<'info, SessionAccount>,

    #[account(mut)]
    pub voter_account: Account<'info, VoterAccount>,

    #[account(
        init_if_needed,
        payer = proposer,
        space = 8 + ProposalAccount::INIT_SPACE,
        seeds = [
            ProposalAccount::SEED_PREFIX.as_ref(),
            &session_account.session_id.to_le_bytes(),
            &[session_account.proposals_count],
        ],
        bump
    )]
    pub proposal_account: Account<'info, ProposalAccount>,

    pub system_program: Program<'info, System>,
}

pub fn register_proposal(
    ctx: Context<RegisterProposalContextData>,
    description: String,
) -> Result<()> {
    let session_account = &mut ctx.accounts.session_account;
    let voter_account = &mut ctx.accounts.voter_account;
    let proposal_account = &mut ctx.accounts.proposal_account;

    require!(
        session_account.admin.key() != ctx.accounts.proposer.key(),
        VotingError::ForbiddenAsAdmin
    );

    require!(
        voter_account.voter.key() == ctx.accounts.proposer.key(),
        VotingError::ProposerNotRegistered
    );

    require!(
        session_account.status == SessionWorkflowStatus::ProposalsRegistrationStarted,
        VotingError::UnexpectedSessionStatus
    );

    register_internal_proposal(
        proposal_account,
        session_account.session_id,
        ctx.accounts.proposer.key(),
        session_account.proposals_count,
        description.to_string(),
    );

    session_account.proposals_count += 1;

    voter_account.nb_proposals += 1;

    emit!(SessionWorkflowStatusChanged {
        session_id: session_account.session_id,
        previous_status: SessionWorkflowStatus::ProposalsRegistrationStarted,
        current_status: SessionWorkflowStatus::ProposalsRegistrationEnded,
    });

    Ok(())
}

pub fn register_internal_proposal<'info>(
    proposal: &mut Account<'info, ProposalAccount>,
    session_id: u64,
    proposer: Pubkey,
    proposal_id: u8,
    description: String,
) {
    proposal.session_id = session_id;
    proposal.proposal_id = proposal_id;
    proposal.description = description.to_string();
    proposal.proposer = proposer;
    proposal.vote_count = 0;

    emit!(ProposalRegistered {
        session_id,
        proposal_id,
        description,
    });
}
