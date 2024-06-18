use std::collections::HashMap;

use anchor_lang::{prelude::*, solana_program::log::sol_log_compute_units};

use crate::{
    errors::VotingError,
    state::{proposal::*, voting_session::*},
};

#[derive(Accounts)]
pub struct TallyVotesContextData<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub session_account: Account<'info, SessionAccount>,

    pub system_program: Program<'info, System>,
}

pub fn tally_votes<'info>(
    ctx: Context<'_, '_, 'info, 'info, TallyVotesContextData<'info>>,
) -> Result<()> {
    let session_account = &mut ctx.accounts.session_account;

    require!(
        session_account.status == SessionWorkflowStatus::VotingSessionEnded,
        VotingError::UnexpectedSessionStatus
    );

    let voters_count = session_account.voters_count;
    let proposals_count = session_account.proposals_count as usize - 1;
    let remaining_accounts = &ctx.remaining_accounts;

    require!(
        remaining_accounts.len() == proposals_count,
        VotingError::BadProposalAccountsCount
    );

    let proposal_accounts = &ctx.remaining_accounts[..proposals_count];

    let mut total_votes = 0;
    let mut blank_votes = 0;
    let mut votes_count: HashMap<u8, u32> = HashMap::new();

    for proposal_account in proposal_accounts.iter() {
        let proposal: Account<ProposalAccount> = Account::try_from(proposal_account)?;
        let vote_count = proposal.vote_count;
        if vote_count > 0 {
            if proposal.proposal_id == 1 {
                blank_votes += vote_count;
            } else {
                votes_count.insert(proposal.proposal_id, vote_count);
            }
            total_votes += vote_count;
        }
    }
    let abstention = voters_count - total_votes;

    // sort to order by votes count
    let mut winning_proposals: Vec<(u8, u32)> = votes_count.into_iter().collect();
    winning_proposals.sort_by(|a, b| b.1.cmp(&a.1));

    // keep max votes count
    let max_votes = winning_proposals
        .first()
        .map(|&(_, votes)| votes)
        .unwrap_or(0);

    let winning_proposal_ids: Vec<u8> = winning_proposals
        .iter()
        .filter(|&&(_, votes)| votes == max_votes)
        .map(|&(id, _)| id)
        .collect();

    session_account.status = SessionWorkflowStatus::VotesTallied;

    emit!(VotesTallied {
        session_id: session_account.session_id,
        voters_count,
        total_votes,
        blank_votes,
        abstention,
        winning_proposals: winning_proposal_ids,
    });

    emit!(SessionWorkflowStatusChanged {
        session_id: session_account.session_id,
        previous_status: SessionWorkflowStatus::VotingSessionEnded,
        current_status: SessionWorkflowStatus::VotesTallied,
    });

    session_account.status = SessionWorkflowStatus::VotesTallied;

    sol_log_compute_units();

    Ok(())
}
