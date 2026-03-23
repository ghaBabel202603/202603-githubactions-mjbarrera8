const core = require('@actions/core');
async function run() {
    const baseBranch = core.getInput('base-branch');
    const targetBranch = core.getInput('target-branch');
    const workingDirectory = core.getInput('working-directory');
    const ghToken = core.getInput('gh-token');
    const debug = core.getBooleanInput('debug');

    core.info(`Debug mode: ${debug}`);
    core.info(`Base branch: ${baseBranch}`);
    core.info(`Target branch: ${targetBranch}`);
    core.info(`Working directory: ${workingDirectory}`);

    const exec = require('@actions/exec');
    await exec.exec('npm', ['update'], { cwd: workingDirectory });

    let gitStatusOutput = await exec.getExecOutput('git', ['status', '-s', 'package*.json'], { cwd: workingDirectory });
    if (gitStatusOutput.stdout) {
        core.info('There are updates available.');
        const github = require('@actions/github');
        const octokit = github.getOctokit(ghToken);
        try {
            await octokit.rest.pulls.create({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                title: `Update NPM dependencies`,
                body: `This pull request updates NPM packages`,
                base: baseBranch,
                head: targetBranch
            });
        } catch (e) {
                core.error('[js-dependency-update] : Something went wrong while creating the PR. Check logs below.');
                core.setFailed(e.message);
                core.error(e);
        }
    } else {
        core.info('There are no updates at this point in time.');
    }
}

run();
