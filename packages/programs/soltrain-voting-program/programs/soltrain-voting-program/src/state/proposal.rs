use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ProposalAccount {
    pub session_id: u64, // 8
    pub proposal_id: u8, // 1
    #[max_len(255)]
    pub description: String, // 255
    pub proposer: Pubkey, // 32
    pub vote_count: u32, // 4
}

impl ProposalAccount {
    pub const SEED_PREFIX: &'static [u8; 8] = b"proposal";
}

#[event]
pub struct ProposalRegistered {
    pub session_id: u64,
    pub proposal_id: u8,
    pub description: String,
}

pub struct WinningProposal {
    pub proposal_id: u8,
    pub description: String,
    pub proposer: Pubkey,
    pub vote_count: u32,
}
