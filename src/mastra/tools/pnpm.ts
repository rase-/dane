import { createTool } from '@mastra/core';
import chalk from 'chalk';
import { execa, ExecaError } from 'execa';
import { readFileSync } from 'fs';
import path from 'path';
import { z } from 'zod';

export const pnpmBuild = createTool({
  id: 'pnpmBuild',
  name: 'PNPM Build Tool',
  description: 'Used to build the pnpm module',
  inputSchema: z.object({
    name: z.string(),
    packagePath: z.string(),
  }),
  outputSchema: z.object({
    message: z.string(),
  }),
  execute: async ({ context: { name, packagePath } }) => {
    try {
      console.log(chalk.green(`Building: ${name} at ${packagePath}`));
      const p = execa(`pnpm`, ['build'], {
        stdio: 'inherit',
        cwd: packagePath,
        reject: false,
      });
      console.log(`\n`);
      await p;
      return { message: 'Done' };
    } catch (e) {
      console.error(e);
      if (e instanceof ExecaError) {
        return { message: e.message };
      }
      return { message: 'Error' };
    }
  },
});

export const pnpmChangesetStatus = createTool({
  id: 'pnpmChangesetStatus',
  name: 'PNPM Changeset Status Tool',
  description: 'Used to check which pnpm modules need to be published',
  inputSchema: z.object({}),
  outputSchema: z.object({
    message: z.array(z.string()),
  }),
  execute: async () => {
    try {
      console.log('Checking');
      const { stdout } = await execa('pnpm', ['publish', '-r', '--dry-run', '--no-git-checks'], {
        all: true,
        // We want to see stderr too since pnpm sometimes puts important info there
        stderr: 'inherit',
      });

      const lines = stdout.split('\n');
      const filteredLines = lines.filter(line => line.startsWith('+'));
      const packages = filteredLines.map(line => line.trim().substring(2).split('@').slice(0, -1).join('@'));

      return { message: packages };
    } catch (e) {
      console.error(e);
      if (e instanceof ExecaError) {
        return { message: [e.message] };
      }
      return { message: ['Error'] };
    }
  },
});

export const pnpmChangesetPublish = createTool({
  id: 'pnpmChangesetPublish',
  name: 'PNPM Changeset Publish Tool',
  description: 'Used to publish the pnpm module',
  inputSchema: z.object({}),
  outputSchema: z.object({
    message: z.string(),
  }),
  execute: async () => {
    try {
      console.log(chalk.green(`Publishing...`));
      const p = execa(`pnpm`, ['changeset', 'publish'], {
        stdio: 'inherit',
        reject: false,
      });
      console.log(`\n`);
      await p;
      return { message: 'Done' };
    } catch (e) {
      console.error(e);
      if (e instanceof ExecaError) {
        return { message: e.message };
      }
      return { message: 'Error' };
    }
  },
});

export const activeDistTag = createTool({
  id: 'activeDistTag',
  name: 'PNPM Changeset set active tag',
  description: 'Used to set active tag on the pnpm module',
  inputSchema: z.object({
    packagePath: z.string(),
  }),
  outputSchema: z.object({
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const pkgJson = JSON.parse(readFileSync(path.join(context.packagePath, 'package.json'), 'utf-8'));
      const version = pkgJson.version;
      console.log(chalk.green(`Setting active tag to latest for ${pkgJson.name}@${version}`));
      const p = execa(`npm`, ['dist-tag', `add`, `${pkgJson.name}@${version}`, `latest`], {
        stdio: 'inherit',
        reject: false,
      });
      console.log(`\n`);
      await p;
      return { message: 'Done' };
    } catch (e) {
      console.error(e);
      if (e instanceof ExecaError) {
        return { message: e.message };
      }
      return { message: 'Error' };
    }
  },
});
