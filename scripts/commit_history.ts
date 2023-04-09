import { walkSync } from 'https://deno.land/std@0.179.0/fs/walk.ts';
import { basename, dirname, join, sep } from 'https://deno.land/std@0.179.0/path/mod.ts';
import { sha256 } from 'https://denopkg.com/chiefbiiko/sha256@v1.0.0/mod.ts';
import { equal } from 'https://deno.land/x/equal@v1.5.0/mod.ts';

const Keys = ['id', 'subject', 'date', 'github_url'] as const;
type Commit<T> = {
   'id': T;
   'subject': T;
   'date': T;
   'github_url': T;
};
type History = Commit<string>[];
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

const runGitLog = async (
   paths: string[],
): Promise<({ success: true; output: Commit<Uint8Array> } | { success: false; output: undefined })[]> => {
   const run = (path: string, key: keyof Commit<string>): Deno.Process => {
      const formats: Commit<string> = { 'id': '%H', 'subject': '%s', 'date': '%aI', 'github_url': toGitHubUrl(path) };
      return Deno.run({
         cmd: [
            'git',
            'log',
            // Use <double_quote> to simplify escaping of double quotes.
            `--pretty=format: <double_quote>${formats[key as keyof Commit<string>]}<double_quote>,`,
            '--',
            path,
         ],
         stdout: 'piped',
         stderr: 'piped',
      });
   };

   return await Promise.all(paths.map(async (path) => {
      const processes = Keys.map((k) => run(path, k));
      const success = (
         await Promise.all(processes.map((p) => p.status()))
      ).every((status) => status.success);
      if (success) {
         return {
            success,
            output: {
               'id': await processes[0].output(),
               'subject': await processes[1].output(),
               'date': await processes[2].output(),
               'github_url': await processes[3].output(),
            },
         };
      } else {
         return {
            success,
            output: undefined,
         };
      }
   }));
};

// Escape double quotes except the first and last.
const escape = (str: string): string => str.replaceAll('"', '\\"').replaceAll('<double_quote>', '"');

const toHistory = (
   raw_output: Commit<Uint8Array>,
): History => {
   const json_outputs: string[][] = Keys.map((k) =>
      JSON.parse(escape('[' + new TextDecoder().decode(raw_output[k]).slice(0, -1) + ']'))
   );
   const history: History = [];
   for (let i = 0; i < json_outputs[0].length; i++) {
      history.push({
         'id': json_outputs[0][i],
         'subject': json_outputs[1][i],
         'date': json_outputs[2][i],
         'github_url': json_outputs[3][i],
      });
   }
   return history.filter((commit) => commit.subject.startsWith('docs:')).map((commit) => ({
      ...commit,
      subject: commit.subject.replace(/^docs: /, ''),
   }));
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

const readJsonFile = (data_file: string): HistoryDict => {
   try {
      const str = Deno.readTextFileSync(data_file);
      return JSON.parse(str);
   } catch {
      return {};
   }
};

const writeJsonFile = (json: HistoryDict, data_file: string) =>
   Deno.writeTextFileSync(
      data_file,
      JSON.stringify(json),
   );

// Delete symbols other than underscore because they can't be used in golang template.
const deleteBadChars = (str: string): string => str.replaceAll(/[!-/:-@[-^`{-~]/g, '');

const main = async () => {
   const posts_dir = join('content', 'posts');
   const data_file = join('data', 'commit_history.json');

   const post_paths = getPostPaths(posts_dir);
   const post_names = toNames(post_paths);
   const results = await runGitLog(post_paths);
   const histories = (results
      .filter((result) => result.success) as { success: true; output: Commit<Uint8Array> }[])
      .map((result) => toHistory(result.output));
   const json = toHistoryDict(post_names, histories);

   const old = readJsonFile(data_file);
   if (!equal(json, old)) writeJsonFile(json, data_file);
};

main();
