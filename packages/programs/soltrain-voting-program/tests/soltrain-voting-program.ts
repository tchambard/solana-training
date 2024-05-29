import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

import { SoltrainVotingProgram } from "../target/types/soltrain_voting_program.js";

describe("soltrain-voting-program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace
    .SoltrainVotingProgram as Program<SoltrainVotingProgram>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
