use anchor_lang::prelude::*;

use crate::state::{global::*, voting_session::*};

#[derive(Accounts)]
pub struct CreateVotingSessionContextData<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub global_account: Account<'info, GlobalAccount>,

    #[account(
        init,
        payer = owner,
        space = 8 + SessionAccount::INIT_SPACE,
        seeds = [
            SessionAccount::SEED_PREFIX.as_ref(),
            global_account.session_count.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub session_account: Account<'info, SessionAccount>,

    pub system_program: Program<'info, System>,
}

pub fn create_voting_session(
    ctx: Context<CreateVotingSessionContextData>,
    name: String,
    description: String,
) -> Result<()> {
    let global_account = &mut ctx.accounts.global_account;
    let session_account = &mut ctx.accounts.session_account;
    session_account.status = SessionWorkflowStatus::RegisteringVoters;

    session_account.session_id = global_account.session_count;
    session_account.admin = ctx.accounts.owner.key();
    session_account.name = name.clone();
    session_account.description = description.clone();
    session_account.proposals_count = 1; // 0 is abstention vote
    session_account.voters_count = 0;
    session_account.result = SessionResult {
        total_votes: 0,
        blank_votes: 0,
        abstention: 0,
        winning_proposals: Vec::with_capacity(10),
    };

    global_account.session_count += 1;

    emit!(SessionWorkflowStatusChanged {
        session_id: session_account.session_id,
        previous_status: SessionWorkflowStatus::None,
        current_status: SessionWorkflowStatus::RegisteringVoters,
    });
    emit!(SessionCreated {
        session_id: session_account.session_id,
        name,
        description,
    });
    Ok(())
}
