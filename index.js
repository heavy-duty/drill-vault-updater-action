const core = require("@actions/core");
const github = require("@actions/github");
const { getAccount, getMint } = require("@solana/spl-token");
const { TokenListProvider } = require("@solana/spl-token-registry");
const { Connection, PublicKey } = require("@solana/web3.js");
const { Program, AnchorProvider } = require("@heavy-duty/anchor");
const BN = require("bn.js");

const IDL = {
  version: "0.1.0",
  name: "drill",
  instructions: [
    {
      name: "initializeBoard",
      accounts: [
        {
          name: "board",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "board",
              },
              {
                kind: "arg",
                type: "u32",
                path: "board_id",
              },
            ],
          },
        },
        {
          name: "acceptedMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "boardVault",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "board_vault",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Board",
                path: "board",
              },
            ],
          },
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "boardId",
          type: "u32",
        },
        {
          name: "lockTime",
          type: "i64",
        },
      ],
    },
    {
      name: "setBoardAuthority",
      accounts: [
        {
          name: "board",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "board",
              },
              {
                kind: "arg",
                type: "u32",
                path: "board_id",
              },
            ],
          },
        },
        {
          name: "authority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "newAuthority",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "boardId",
          type: "u32",
        },
      ],
    },
    {
      name: "initializeBounty",
      accounts: [
        {
          name: "board",
          isMut: false,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "board",
              },
              {
                kind: "arg",
                type: "u32",
                path: "board_id",
              },
            ],
          },
        },
        {
          name: "bounty",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "bounty",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Board",
                path: "board",
              },
              {
                kind: "arg",
                type: "u32",
                path: "bounty_id",
              },
            ],
          },
        },
        {
          name: "acceptedMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "bountyVault",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "bounty_vault",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Bounty",
                path: "bounty",
              },
            ],
          },
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "boardId",
          type: "u32",
        },
        {
          name: "bountyId",
          type: "u32",
        },
      ],
    },
    {
      name: "deposit",
      accounts: [
        {
          name: "board",
          isMut: false,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "board",
              },
              {
                kind: "arg",
                type: "u32",
                path: "board_id",
              },
            ],
          },
        },
        {
          name: "bounty",
          isMut: false,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "bounty",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Board",
                path: "board",
              },
              {
                kind: "arg",
                type: "u32",
                path: "bounty_id",
              },
            ],
          },
        },
        {
          name: "bountyVault",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "bounty_vault",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Bounty",
                path: "bounty",
              },
            ],
          },
        },
        {
          name: "sponsorVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "boardId",
          type: "u32",
        },
        {
          name: "bountyId",
          type: "u32",
        },
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "closeBounty",
      accounts: [
        {
          name: "board",
          isMut: false,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "board",
              },
              {
                kind: "arg",
                type: "u32",
                path: "board_id",
              },
            ],
          },
        },
        {
          name: "bounty",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "bounty",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Board",
                path: "board",
              },
              {
                kind: "arg",
                type: "u32",
                path: "bounty_id",
              },
            ],
          },
        },
        {
          name: "authority",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "boardId",
          type: "u32",
        },
        {
          name: "bountyId",
          type: "u32",
        },
        {
          name: "bountyHunter",
          type: {
            option: "string",
          },
        },
      ],
    },
    {
      name: "setBountyHunter",
      accounts: [
        {
          name: "board",
          isMut: false,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "board",
              },
              {
                kind: "arg",
                type: "u32",
                path: "board_id",
              },
            ],
          },
        },
        {
          name: "bounty",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "bounty",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Board",
                path: "board",
              },
              {
                kind: "arg",
                type: "u32",
                path: "bounty_id",
              },
            ],
          },
        },
        {
          name: "authority",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "boardId",
          type: "u32",
        },
        {
          name: "bountyId",
          type: "u32",
        },
        {
          name: "bountyHunter",
          type: "string",
        },
      ],
    },
    {
      name: "sendBounty",
      accounts: [
        {
          name: "board",
          isMut: false,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "board",
              },
              {
                kind: "arg",
                type: "u32",
                path: "board_id",
              },
            ],
          },
        },
        {
          name: "bounty",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "bounty",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Board",
                path: "board",
              },
              {
                kind: "arg",
                type: "u32",
                path: "bounty_id",
              },
            ],
          },
        },
        {
          name: "bountyVault",
          isMut: true,
          isSigner: false,
          pda: {
            seeds: [
              {
                kind: "const",
                type: "string",
                value: "bounty_vault",
              },
              {
                kind: "account",
                type: "publicKey",
                account: "Bounty",
                path: "bounty",
              },
            ],
          },
        },
        {
          name: "userVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "boardId",
          type: "u32",
        },
        {
          name: "bountyId",
          type: "u32",
        },
        {
          name: "bountyHunter",
          type: "string",
        },
      ],
    },
  ],
  accounts: [
    {
      name: "board",
      type: {
        kind: "struct",
        fields: [
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "boardId",
            type: "u32",
          },
          {
            name: "acceptedMint",
            type: "publicKey",
          },
          {
            name: "lockTime",
            type: "i64",
          },
          {
            name: "boardBump",
            type: "u8",
          },
          {
            name: "boardVaultBump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "bounty",
      type: {
        kind: "struct",
        fields: [
          {
            name: "boardId",
            type: "u32",
          },
          {
            name: "bountyId",
            type: "u32",
          },
          {
            name: "bountyHunter",
            type: {
              option: "string",
            },
          },
          {
            name: "closedAt",
            type: {
              option: "i64",
            },
          },
          {
            name: "isClosed",
            type: "bool",
          },
          {
            name: "bountyBump",
            type: "u8",
          },
          {
            name: "bountyVaultBump",
            type: "u8",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "BountyLockedError",
      msg: "BountyLockedError",
    },
  ],
};

function getProgram(programId, connection) {
  const anchorProvider = new AnchorProvider(
    connection,
    {},
    AnchorProvider.defaultOptions()
  );

  return new Program(IDL, programId, anchorProvider);
}

async function getBoard(program, boardId) {
  const [boardPublicKey] = await PublicKey.findProgramAddress(
    [
      Buffer.from("board", "utf8"),
      new BN(boardId).toArrayLike(Buffer, "le", 4),
    ],
    program.programId
  );
  const boardAccount = await program.account.board.fetchNullable(
    boardPublicKey
  );

  if (boardAccount === null) {
    return null;
  }

  return {
    id: boardId,
    publicKey: boardPublicKey,
    acceptedMint: boardAccount.acceptedMint,
    authority: boardAccount.authority,
    lockTime: boardAccount.lockTime,
    boardBump: boardAccount.boardBump,
    boardVaultBump: boardAccount.boardVaultBump,
  };
}

async function getBounty(program, boardId, bountyId) {
  const [boardPublicKey] = await PublicKey.findProgramAddress(
    [
      Buffer.from("board", "utf8"),
      new BN(boardId).toArrayLike(Buffer, "le", 4),
    ],
    program.programId
  );
  const [bountyPublicKey] = await PublicKey.findProgramAddress(
    [
      Buffer.from("bounty", "utf8"),
      boardPublicKey.toBuffer(),
      new BN(bountyId).toArrayLike(Buffer, "le", 4),
    ],
    program.programId
  );
  const bountyAccount = await program.account.bounty.fetchNullable(
    bountyPublicKey
  );

  if (bountyAccount === null) {
    return null;
  }

  return {
    publicKey: bountyPublicKey,
    boardId: bountyAccount.boardId,
    id: bountyAccount.bountyId,
    bountyBump: bountyAccount.bountyBump,
    bountyHunter: bountyAccount.bountyHunter,
    bountyVaultBump: bountyAccount.bountyVaultBump,
    closedAt: bountyAccount.closedAt
      ? new Date(bountyAccount.closedAt.toNumber() * 1000)
      : null,
    isClosed: bountyAccount.isClosed,
  };
}

function getExplorerUrl(type, signature, cluster, rpcEndpoint) {
  core.notice("GETTING URLS");
  const explorerUrl = new URL(
    `https://explorer.solana.com/${type}/${signature}`
  );

  explorerUrl.searchParams.append("cluster", cluster);

  if (cluster === "custom") {
    explorerUrl.searchParams.append("customUrl", rpcEndpoint);
  }

  return explorerUrl.toString();
}

function getBountyEnabledCommentBody(
  board,
  bounty,
  githubRepository,
  explorerUrl,
  boardPublicKeyUrl,
  boardAuthorityUrl,
  bountyPublicKeyUrl,
  bountyVaultPublicKeyUrl,
  imagePath
) {
  core.notice("INITING MESSAGES");
  const _initMessage = `
  # 💰 Drill Bounty Program 💰
  
  Drill was configured successfully, this issue has an active bounty. [Inspect the transaction](${explorerUrl}) in the Solana Explorer. Below you'll find more details about the Bounty you just created. If you want to get more info about this tool, please read our official doc [here](https://heavyduty.builders/)
  `;
  core.notice("Passed 1");
  const _boardInfo = `
  ## 💾 Board info
  
  All about your board.
  
  🔢 **ID**: ${board.id}.  
  🔑 **Public Key**: [${board.publicKey}](${boardPublicKeyUrl})  
  ⏱️ **Lock Time (ms)**:${board.lockTime}  
  🔒 **Auhtority**:[${board.authority}](${boardAuthorityUrl})
  `;
  core.notice("Passed 2");
  const _bountyInfo = `
  ## 🏦 Bounty info
  
  All about your new bounty.
  
  🔢 **ID**: ${bounty.id}.  
  🔑 **Public Key**: [${bounty.publicKey}](${bountyPublicKeyUrl})  
  🧰 **Vault ATA**:[${bounty.vaultATA}](${bountyVaultPublicKeyUrl})
  
  > _You can use this information and our CLI to fetch more detailed data, like the Bump and others solana detail you may need in some cases._
  `;
  core.notice("Passed 3");
  const _solanaPay = `
  ## 🤳 Solana pay
  
  Use the following QR to send funds to bounty vault, please be sure what you are doing before make the transfer, this can't be undone.
  
  ![Solana pay QR](https://raw.githubusercontent.com/${githubRepository}/master/${imagePath})
  
  ### 🪙💵 **CURRENT DEPOSIT AMOUNT: ${bounty.vaultAmount}** 💵🪙
  `;
  core.notice("Passed 4");
  const _disclaimer = `
  ## 🚨 Disclaimer
  
  _PLEASE BE SURE YOU KNOW THIS REPO AND ALREADY SPOKE WITH SOME ADMIN. IS IMPORTANT TO KEEP IN MIND that THIS COMMENT (INCLUDING THE ADDRESS AND THE QR IMAGE) CAN BE MODIFIED FOR ANY PERSON WITH THE SUFFICIENT PRIVILEGE IN THIS REPO. DRILL NOR HEAVYDUTY BE RESPONSIBLE FOR ANY SCAM OR BAD USE OF THIS SOFTWARE._
  `;
  core.notice("Passed 5");
  const fullComment = `${_initMessage}\n---\n${_boardInfo}\n&nbsp;\n${_bountyInfo}\n---\n${_solanaPay}---\n${_disclaimer}\n`;
  core.notice("Passed 6");
  return `${fullComment}\n`;
}

// main function
async function run() {
  try {
    core.notice("ENTRAAA");
    const programId = core.getInput("program-id");
    const githubRepository = core.getInput("github-repository");
    const rpcEndpoint = core.getInput("rpc-endpoint");
    const cluster = core.getInput("cluster");
    const token = core.getInput("token");

    const [owner, repoName] = githubRepository.split("/");
    const connection = new Connection(rpcEndpoint);
    const program = getProgram(programId, connection);
    const octokit = github.getOctokit(token);

    const { data: repository } = await octokit.rest.repos.get({
      repo: repoName,
      owner,
    });

    const [boardPublicKey] = await PublicKey.findProgramAddress(
      [
        Buffer.from("board", "utf8"),
        new BN(repository.id).toArrayLike(Buffer, "le", 4),
      ],
      new PublicKey(programId)
    );

    const boardAccount = await getBoard(program, repository.id);

    // get all issues with a bounty enabled
    const { data: issuesForRepo } = await octokit.rest.issues.listForRepo({
      repo: repoName,
      owner,
      labels: "drill:bounty:enabled",
      state: "open",
    });
    core.notice("Issues: " + issuesForRepo.length);
    issuesForRepo.forEach(async (issue) => {
      // find bounty enabled comment
      const { data: issueComments } = await octokit.rest.issues.listComments({
        owner,
        repo: repoName,
        issue_number: issue.number,
      });
      core.notice("Comments: " + issueComments.length);
      const bountyEnabledComment = issueComments.find((comment) => {
        return comment.body?.toLowerCase().includes("drill bounty program");
      });

      if (bountyEnabledComment !== undefined) {
        core.notice("ENTER TO THE IF");
        // find bounty vault account
        const [bountyPublicKey] = await PublicKey.findProgramAddress(
          [
            Buffer.from("bounty", "utf8"),
            boardPublicKey.toBuffer(),
            new BN(issue.number).toArrayLike(Buffer, "le", 4),
          ],
          new PublicKey(programId)
        );
        const [bountyVaultPublicKey] = await PublicKey.findProgramAddress(
          [Buffer.from("bounty_vault", "utf8"), bountyPublicKey.toBuffer()],
          new PublicKey(programId)
        );

        const bountyVaultAccount = await getAccount(
          connection,
          bountyVaultPublicKey
        );
        const acceptedMint = await getMint(connection, bountyVaultAccount.mint);

        const tokens = await new TokenListProvider().resolve();
        core.notice("I did all my fetched");
        const tokenList = tokens.filterByClusterSlug(cluster).getList();
        const mintDetails = tokenList.find(
          (token) => token.address === acceptedMint.address.toBase58()
        );

        const bountyVaultUserAmount = (
          Number(bountyVaultAccount.amount) /
          Math.pow(10, acceptedMint.decimals)
        ).toLocaleString(undefined, {
          currencySign: mintDetails?.symbol,
          minimumFractionDigits: 2,
        });

        const explorerUrl = new URL(
          `https://explorer.solana.com/address/${bountyVaultPublicKey.toBase58()}`
        );

        explorerUrl.searchParams.append("cluster", cluster);

        if (cluster === "custom") {
          explorerUrl.searchParams.append("customUrl", rpcEndpoint);
        }

        core.notice("Cluster passed");
        const bountyAccount = await getBounty(
          program,
          repository.id,
          issue.number
        );
        const boardMessageData = {
          id: bountyAccount.boardId,
          publicKey: boardPublicKey.toBase58(),
          lockTime: boardAccount.lockTime,
          authority: boardAccount.authority.toBase58(),
        };

        const bountyMessageData = {
          id: bountyAccount.id,
          publicKey: bountyPublicKey.toBase58(),
          vaultATA: bountyVaultAccount.address.toBase58(),
          vaultAmount: bountyVaultUserAmount,
        };

        const imagePath = `.drill/${issue.number}.jpg`;
        core.notice("Board and Bounty fetched");
        const body = getBountyEnabledCommentBody(
          boardMessageData,
          bountyMessageData,
          `${repository.owner.login}/${repository.name}`,
          getExplorerUrl("tx", "signature", cluster, connection.rpcEndpoint),
          getExplorerUrl(
            "address",
            boardMessageData.publicKey,
            cluster,
            connection.rpcEndpoint
          ),
          getExplorerUrl(
            "address",
            boardMessageData.authority,
            cluster,
            connection.rpcEndpoint
          ),
          getExplorerUrl(
            "address",
            bountyMessageData.publicKey,
            cluster,
            connection.rpcEndpoint
          ),
          getExplorerUrl(
            "address",
            bountyMessageData.vaultATA,
            cluster,
            connection.rpcEndpoint
          ),
          imagePath
        );

        core.notice("body: " + body);
        core.notice("comment_id: number -> " + Number(bountyEnabledComment.id));
        core.notice("owner: " + owner);
        core.notice("repo2: " + repoName);

        await octokit.issues.addLabels(
          context.issue({
            labels: ["drill:bounty-updated:true"],
          })
        );
        // await octokit.issues.updateComment({
        //   body,
        //   comment_id: Number(bountyEnabledComment.id),
        //   owner,
        //   repo: repoName,
        // });
      }
    });

    core.setOutput("result", true);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
