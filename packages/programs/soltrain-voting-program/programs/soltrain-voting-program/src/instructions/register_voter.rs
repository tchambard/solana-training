use anchor_lang::prelude::*;

use crate::errors::*;
use crate::state::{voter::*, voting_session::*};

#[derive(Accounts)]
#[instruction(voter: Pubkey)]
pub struct RegisterVoterContextData<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    pub session_account: Account<'info, SessionAccount>,

    #[account(
        init_if_needed,
        payer = admin,
        space = 8 + VoterAccount::INIT_SPACE,
        seeds = [
            VoterAccount::SEED_PREFIX.as_ref(),
            &session_account.session_id.to_le_bytes(),
            voter.key().as_ref()
        ],
        bump
    )]
    pub voter_account: Account<'info, VoterAccount>,

    pub system_program: Program<'info, System>,
}

pub fn register_voter(ctx: Context<RegisterVoterContextData>, voter: Pubkey) -> Result<()> {
    let session_account = &ctx.accounts.session_account;
    let voter_account = &mut ctx.accounts.voter_account;

    if session_account.admin.key() != ctx.accounts.admin.key() {
        return err!(VotingError::ForbiddenAsNonAdmin);
    };
    if session_account.status != SessionWorkflowStatus::RegisteringVoters {
        return err!(VotingError::UnexpectedSessionStatus);
    };
    if session_account.admin.key() == voter.key() {
        return err!(VotingError::AdminForbiddenAsVoter);
    };
    if voter_account.voter.key() == voter.key() {
        return err!(VotingError::VoterAlreadyRegistered);
    };

    voter_account.voter = voter;
    voter_account.voted_proposal_id = 0;
    voter_account.nb_proposals = 0;

    emit!(VoterRegistered {
        session_id: session_account.session_id,
        voter,
    });
    Ok(())
}
