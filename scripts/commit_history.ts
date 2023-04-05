import { walkSync } from 'https://deno.land/std@0.179.0/fs/walk.ts';
import { join } from 'https://deno.land/std@0.179.0/path/posix.ts';

const root = join('content', 'posts');

const posts = [
  ...walkSync(root, { includeDirs: false, exts: ['md'], match: [RegExp(/a/)] }),
];
console.log(posts);

//git log--pretty = format: '{%n "id" : %H, "subject" : %s, "date" : "%aI" %n},' -- path
