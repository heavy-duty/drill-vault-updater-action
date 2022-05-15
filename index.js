const core = require("@actions/core");
const github = require("@actions/github");
const { Connection } = require("@solana/web3.js");

async function run() {
  try {
    const programId = core.getInput("program-id");
    const botId = core.getInput("bot-id");
    const githubRepository = core.getInput("github-repository");
    const rpcEndpoint = core.getInput("rpc-endpoint");
    const cluster = core.getInput("cluster");
    const token = core.getInput("token");

    const [owner, repoName] = githubRepository.split("/");
    const connection = new Connection(rpcEndpoint);
    const octokit = github.getOctokit(token);

    console.log(connection)

    const { data: repository } = await appOctokit.repos.get({
      repo: repoName,
      owner,
    });

		console.log(repository)

    core.setOutput("result", true);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
