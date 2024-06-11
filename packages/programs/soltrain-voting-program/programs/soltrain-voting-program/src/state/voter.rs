use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct VoterAccount {
    pub voter: Pubkey,
    pub has_voted: bool,
    pub voted_proposal_id: u8,
    pub nb_proposals: u8,
}

impl VoterAccount {
    pub const SEED_PREFIX: &'static [u8; 5] = b"voter";
}

#[event]
pub struct VoterRegistered {
    pub session_id: u64,
    pub voter: Pubkey,
}
