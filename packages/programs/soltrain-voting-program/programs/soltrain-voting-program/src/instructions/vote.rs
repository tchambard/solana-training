use anchor_lang::prelude::*;

use crate::errors::*;
use crate::state::{proposal::*, voter::*, voting_session::*};

#[derive(Accounts)]
pub struct VoteContextData<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    pub session_account: Account<'info, SessionAccount>,

    #[account(mut)]
    pub voter_account: Account<'info, VoterAccount>,

    #[account(mut)]
    pub proposal_account: Account<'info, ProposalAccount>,

    pub system_program: Program<'info, System>,
}


pub fn vote(ctx: Context<VoteContextData>) -> Result<()> {
    let voter = &ctx.accounts.voter;
    let session_account = &ctx.accounts.session_account;
    let voter_account = &mut ctx.accounts.voter_account;
    let proposal_account = &mut ctx.accounts.proposal_account;

    if session_account.status != SessionWorkflowStatus::VotingSessionStarted {
        return err!(VotingError::UnexpectedSessionStatus);
    };
    if session_account.admin.key() == voter.key() {
        return err!(VotingError::AdminForbiddenAsVoter);
    };
    if voter_account.voter.key() != voter.key() {
        return err!(VotingError::UnexpectedVoter);
    };
    if voter_account.has_voted {
        return err!(VotingError::VoterAlreadyVoted);
    };

    voter_account.has_voted = true;
    voter_account.voted_proposal_id = proposal_account.proposal_id;

    proposal_account.vote_count += 1;

    emit!(Voted {
        session_id: session_account.session_id,
        proposal_id: proposal_account.proposal_id,
        voter: voter_account.voter,
    });
    Ok(())
}
