import { walkSync } from 'https://deno.land/std@0.179.0/fs/walk.ts';
import { basename, dirname, join, sep } from 'https://deno.land/std@0.179.0/path/mod.ts';
import { sha256 } from 'https://denopkg.com/chiefbiiko/sha256@v1.0.0/mod.ts';

type Commit = {
   'id': string;
   'subject': string;
   'date': string;
   'github_url': string;
};
type History = Commit[];
type HistoryDict = Record<string, History>;

const getPostPaths = (posts_dir: string): string[] =>
   [
      ...walkSync(posts_dir, {
         includeDirs: false,
         exts: ['md'],
         match: [
            RegExp(
               join(posts_dir, '.+', 'index\.md').replaceAll(sep, '\\' + sep),
            ),
            RegExp(
               join(posts_dir, `[^${sep}]*\.md`).replaceAll(sep, '\\' + sep),
            ),
         ],
      }),
   ].map((entry) => entry.path);

const toNames = (paths: string[]): string[] =>
   paths.map((path) => {
      const filename = basename(path, '.md');
      if (filename === 'index') {
         return basename(dirname(path));
      } else {
         return filename;
      }
   });

const toGitHubUrl = (path: string): string =>
   `https://github.com/k-kuroguro/blog/commit/%H#diff-${sha256(path.replaceAll(sep, '/'), 'utf8', 'hex')}`;

const runGitLog = async (paths: string[]): Promise<{ success: boolean; output: Uint8Array }[]> => {
   const processes = paths.map((path) =>
      Deno.run({
         cmd: [
            'git',
            'log',
            `--pretty=format:{\
               "id":"%H", \
               "subject":"%s", \
               "date":"%aI", \
               "github_url": "${toGitHubUrl(path)}"\
            },`,
            '--',
            path,
         ],
         stdout: 'piped',
         stderr: 'piped',
      })
   );
   const statuses = await Promise.all(processes.map((p) => p.status()));
   return Promise.all([...Array(statuses.length)].map(async (_, i) => ({
      'success': statuses[i].success,
      'output': await processes[i].output(),
   })));
};

const toHistory = (
   raw_output: Uint8Array,
): History => {
   const jsonString = '[' + new TextDecoder().decode(raw_output).slice(0, -1) + ']';
   return JSON.parse(jsonString);
};

const toHistoryDict = (
   post_names: string[],
   histories: History[],
): HistoryDict => {
   const result: HistoryDict = {};
   for (let i = 0; i < post_names.length; i++) {
      const post_name = post_names[i];
      const history = histories[i];
      result[deleteBadChars(post_name)] = history;
   }
   return result;
};

const writeJsonFile = (json: HistoryDict, data_dir: string) =>
   Deno.writeTextFileSync(
      join(data_dir, `commit_history.json`),
      JSON.stringify(json),
   );

// Delete symbols other than underscore because they can't be used in golang template.
const deleteBadChars = (str: string): string => str.replaceAll(/[!-/:-@[-^`{-~]/g, '');

const main = async () => {
   const posts_dir = join('content', 'posts');
   const data_dir = 'data';

   const post_paths = getPostPaths(posts_dir);
   const post_names = toNames(post_paths);
   const results = await runGitLog(post_paths);
   const histories = results
      .filter((result) => result.success)
      .map((result) => toHistory(result.output));
   const json = toHistoryDict(post_names, histories);

   writeJsonFile(json, data_dir);
};

main();
