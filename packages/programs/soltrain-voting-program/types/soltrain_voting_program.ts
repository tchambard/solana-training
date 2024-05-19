/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/soltrain_voting_program.json`.
 */
export type SoltrainVotingProgram = {
  address: "Gma1Uuq1wjsg3gsbuaWoHki2QPtWn1ikD46s2WUTyWtE";
  metadata: {
    name: "soltrainVotingProgram";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "initialize";
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
      accounts: [];
      args: [];
    },
  ];
};
