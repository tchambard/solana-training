use anchor_lang::prelude::*;

#[error_code]
pub enum VotingError {
    #[msg("Unexpected session status")]
    UnexpectedSessionStatus,
    #[msg("Voting session administrator can not be registered as voter")]
    AdminForbiddenAsVoter,
    #[msg("Forbidden as non administrator")]
    ForbiddenAsNonAdmin,
    #[msg("Forbidden as administrator")]
    ForbiddenAsAdmin,
    #[msg("Voter already registered")]
    VoterAlreadyRegistered,
    #[msg("Proposer must be registered as voter")]
    ProposerNotRegistered,
    #[msg("Voter already voted")]
    VoterAlreadyVoted,
    #[msg("Unexpected voter")]
    UnexpectedVoter,
    #[msg("Abstention can not be voted")]
    ForbiddenAbstention,
    #[msg("Invalid account")]
    InvalidAccountType,
    #[msg("Invalid proposal")]
    InvalidProposalId,
    #[msg("Bad proposals accounts count")]
    BadProposalAccountsCount,
}
