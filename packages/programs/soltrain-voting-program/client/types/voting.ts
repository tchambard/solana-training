/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/voting.json`.
 */
export type Voting = {
  "address": "4PGnHfbudx56T214YReyJ25n3UCfLvWG5icWocESzH6n",
  "metadata": {
    "name": "voting",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createVotingSession",
      "discriminator": [
        241,
        56,
        27,
        243,
        109,
        166,
        75,
        93
      ],
      "accounts": [
        {
          "name": "sessionAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "global_account.session_count",
                "account": "globalAccount"
              }
            ]
          }
        },
        {
          "name": "globalAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        }
      ]
    },
    {
      "name": "initProgram",
      "discriminator": [
        56,
        120,
        211,
        99,
        196,
        190,
        129,
        187
      ],
      "accounts": [
        {
          "name": "globalAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "globalAccount",
      "discriminator": [
        129,
        105,
        124,
        171,
        189,
        42,
        108,
        69
      ]
    },
    {
      "name": "sessionAccount",
      "discriminator": [
        74,
        34,
        65,
        133,
        96,
        163,
        80,
        69
      ]
    }
  ],
  "events": [
    {
      "name": "sessionCreated",
      "discriminator": [
        107,
        111,
        254,
        25,
        21,
        122,
        220,
        225
      ]
    },
    {
      "name": "workflowStatusChanged",
      "discriminator": [
        251,
        158,
        53,
        53,
        186,
        134,
        118,
        144
      ]
    }
  ],
  "types": [
    {
      "name": "globalAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "sessionCount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "sessionAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "sessionId",
            "type": "u64"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "workflowStatus"
              }
            }
          },
          {
            "name": "proposalCount",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "sessionCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "sessionId",
            "type": "u64"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "workflowStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "none"
          },
          {
            "name": "registeringVoters"
          },
          {
            "name": "proposalsRegistrationStarted"
          },
          {
            "name": "proposalsRegistrationEnded"
          },
          {
            "name": "votingSessionStarted"
          },
          {
            "name": "votingSessionEnded"
          },
          {
            "name": "votesTallied"
          }
        ]
      }
    },
    {
      "name": "workflowStatusChanged",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "sessionId",
            "type": "u64"
          },
          {
            "name": "previousStatus",
            "type": {
              "defined": {
                "name": "workflowStatus"
              }
            }
          },
          {
            "name": "currentStatus",
            "type": {
              "defined": {
                "name": "workflowStatus"
              }
            }
          }
        ]
      }
    }
  ]
};
