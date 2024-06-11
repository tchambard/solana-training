use anchor_lang::prelude::*;

use crate::state::{global::*, voting_session::*};

#[derive(Accounts)]
pub struct CreateVotingSessionContextData<'info> {
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

    #[account(mut, seeds = [GlobalAccount::SEED.as_ref().as_ref()], bump)]
    pub global_account: Account<'info, GlobalAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

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
    session_account.proposal_count = 0;

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
