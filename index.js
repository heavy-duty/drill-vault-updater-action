const core = require("@actions/core");
const github = require("@actions/github");
const { getAccount, getMint } = require("@solana/spl-token");
const { TokenListProvider } = require("@solana/spl-token-registry");
const { Connection, PublicKey } = require("@solana/web3.js");
const BN = require("bn.js");

async function run() {
  try {
    const programId = core.getInput("program-id");
    const githubRepository = core.getInput("github-repository");
    const rpcEndpoint = core.getInput("rpc-endpoint");
    const cluster = core.getInput("cluster");
    const token = core.getInput("token");

    const [owner, repoName] = githubRepository.split("/");
    const connection = new Connection(rpcEndpoint);
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

    // get all issues with a bounty enabled
    const { data: issuesForRepo } = await octokit.rest.issues.listForRepo({
      repo: repoName,
      owner,
      labels: "drill:bounty:enabled",
      state: "open",
    });
  
    issuesForRepo.forEach(async (issue) => {
      // find bounty enabled comment
      const { data: issueComments } = await octokit.rest.issues.listComments({
        owner,
        repo: repoName,
        issue_number: issue.number,
      });

      const bountyEnabledComment = issueComments.find((comment) => {
        return (
          comment.body?.toLowerCase().includes("bounty enabled")
        );
      });

      if (bountyEnabledComment !== undefined) {
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
        const tokenList = tokens.filterByClusterSlug(cluster).getList();
        const mintDetails = tokenList.find(
          (token) => token.address === acceptedMint.address.toBase58()
        );
  
        const bodyAsArray = bountyEnabledComment.body
          ?.split("\n")
          .filter((segment) => segment !== "");
  
        const bountyVaultUserAmount = (
          Number(bountyVaultAccount.amount) / Math.pow(10, acceptedMint.decimals)
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
  
        let body = "";
  
        if (bodyAsArray?.length === 2) {
          body = [
            ...bodyAsArray,
            `Total: ${bountyVaultUserAmount}${
              mintDetails === undefined ? " (Unknown Token)" : ""
            } [view in explorer](${explorerUrl.toString()}).`,
          ].join("\n");
        } else if (bodyAsArray?.length === 3) {
          body = [
            ...bodyAsArray.slice(0, -1),
            `Total: ${bountyVaultUserAmount}${
              mintDetails === undefined ? " (Unknown Token)" : ""
            } [view in explorer](${explorerUrl.toString()}).`,
          ].join("\n");
        }

        console.log(body);
  
        /* await octokit.issues.updateComment({
          body,
          comment_id: bountyEnabledComment.id,
          owner,
          repo: repoName,
        }); */
      }
    });

    core.setOutput("result", true);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
