use std::collections::HashMap;

use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct SessionAccount {
    pub admin: Pubkey,
    pub session_id: u64,
    #[max_len(20)]
    pub name: String,
    #[max_len(80)]
    pub description: String,
    pub status: SessionWorkflowStatus,

    pub voters_count: u32,
    pub proposals_count: u8,
    #[max_len(10)]
    pub winning_proposal_id: Vec<u8>,
}

impl SessionAccount {
    pub const SEED_PREFIX: &'static [u8; 7] = b"session";
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize, InitSpace, PartialEq)]
pub enum SessionWorkflowStatus {
    None,
    RegisteringVoters,
    ProposalsRegistrationStarted,
    ProposalsRegistrationEnded,
    VotingSessionStarted,
    VotingSessionEnded,
    VotesTallied,
}

#[event]
pub struct SessionWorkflowStatusChanged {
    pub session_id: u64,
    pub previous_status: SessionWorkflowStatus,
    pub current_status: SessionWorkflowStatus,
}

#[event]
pub struct SessionCreated {
    pub session_id: u64,
    pub name: String,
    pub description: String,
}

#[event]
pub struct VotesTallied {
    pub session_id: u64,
    pub voters_count: u32,
    pub total_votes: u32,
    pub blank_votes: u32,
    pub abstention: u32,
    pub winning_proposals: Vec<u8>,
}
