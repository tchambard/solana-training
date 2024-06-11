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
      "name": "initGlobal",
      "discriminator": [
        44,
        238,
        77,
        253,
        76,
        182,
        192,
        162
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
      "name": "sessionWorkflowStatusChanged",
      "discriminator": [
        37,
        80,
        31,
        154,
        111,
        190,
        223,
        237
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
                "name": "sessionWorkflowStatus"
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
      "name": "sessionWorkflowStatus",
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
      "name": "sessionWorkflowStatusChanged",
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
                "name": "sessionWorkflowStatus"
              }
            }
          },
          {
            "name": "currentStatus",
            "type": {
              "defined": {
                "name": "sessionWorkflowStatus"
              }
            }
          }
        ]
      }
    }
  ]
};
