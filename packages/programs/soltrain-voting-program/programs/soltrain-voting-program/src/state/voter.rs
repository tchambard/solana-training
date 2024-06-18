use anchor_lang::{prelude::*, solana_program::program_pack::IsInitialized};

#[account]
#[derive(InitSpace)]
pub struct VoterAccount { // 8 discriminator
    pub session_id: u64, // 8
    pub voter: Pubkey, // 32
    pub voter_id: u32, // 4
    pub has_voted: bool, // 1
    pub voted_proposal_id: u8, // 1
    pub nb_proposals: u8, // 1
}

impl VoterAccount {
    pub const SEED_PREFIX: &'static [u8; 5] = b"voter";
}

impl IsInitialized for VoterAccount {
    fn is_initialized(&self) -> bool {
        self.voter.is_on_curve()
    }
}

#[event]
pub struct VoterRegistered {
    pub session_id: u64,
    pub voter: Pubkey,
}

#[event]
pub struct Voted {
    pub session_id: u64,
    pub proposal_id: u8,
    pub voter: Pubkey,
}
