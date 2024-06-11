use anchor_lang::prelude::*;

#[error_code]
pub enum VotingError {
    #[msg("Unexpected session status")]
    UnexpectedSessionStatus,
    #[msg("Voting session administrator can not be registered as voter")]
    AdminForbiddenAsVoter,
    #[msg("Voter already registered")]
    VoterAlreadyRegistered,
}
