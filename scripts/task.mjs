#!/usr/bin/env node
// Task board for parallel agents. No dependencies, no shared status file:
//   - a task is one file:     docs/tasks/T-012-quest-api.md
//   - its branch:             danny-t012-quest-api
//   - "claimed" = a tag:      claim/T-012 on origin (pushing it is the atomic lock)
//   - "done" = merged:        status: done in the task file on origin/main
//
//   list [--owner NAME]           show the board
//   claim [T-012]                 claim a task (or your next one) and switch to its branch
//   release T-012 [--force]       give a claim back
//   cleanup                       delete local branches and worktrees left by merged PRs
//   check-plan                    validate task files; prove parallel tasks can't collide
//   check-scope [--branch NAME]   fail if this branch touched files it may not touch
//
// Who you are comes from: git config hack.person danny

import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PEOPLE = ['danny', 'siddhant', 'aaron', 'jonas'];
const OWNERS = [...PEOPLE, 'any'];
const TASK_DIR = 'docs/tasks';
const SHARED_FILE = 'docs/shared-paths.txt';
const BASE = 'origin/main';
const TASK_FILE = /^(T-\d{3})-([a-z0-9-]+)\.md$/;
const BRANCH = new RegExp(`^(${PEOPLE.join('|')})-(.+)$`);

const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function die(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function flag(args, name) {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
}

function currentPerson() {
  let person = '';
  try {
    person = git('config', '--get', 'hack.person');
  } catch {
    // unset; handled below
  }
  if (!PEOPLE.includes(person)) {
    die(`set who you are once per clone: git config hack.person <${PEOPLE.join('|')}>`);
  }
  return person;
}

const idOf = (digits) => `T-${digits}`;
const branchFor = (task, person) => {
  const [, id, slug] = task.file.match(TASK_FILE);
  return `${person}-${id.replace('-', '').toLowerCase()}-${slug}`;
};

// --- parsing -----------------------------------------------------------------

// Handles the subset of YAML the template uses: scalars, [a, b] and "- item" lists.
function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const clean = (s) => s.trim().replace(/^['"]|['"]$/g, '');
  const data = {};
  let listKey = null;
  for (const raw of match[1].split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, '');
    const item = line.match(/^\s+-\s+(.+)$/);
    if (item && listKey) {
      data[listKey].push(clean(item[1]));
      continue;
    }
    const pair = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!pair) continue;
    const [, key, value] = pair;
    listKey = null;
    if (value === '') {
      data[key] = [];
      listKey = key;
    } else if (value.startsWith('[')) {
      data[key] = value.replace(/^\[|\]$/g, '').split(',').map(clean).filter(Boolean);
    } else {
      data[key] = clean(value);
    }
  }
  return data;
}

function toTask(file, text) {
  const data = parseFrontmatter(text) ?? {};
  return {
    file,
    path: `${TASK_DIR}/${file}`,
    ...data,
    wave: Number(data.wave),
    owns: data.owns ?? [],
    depends_on: data.depends_on ?? [],
  };
}

function tasksFromDisk() {
  if (!existsSync(TASK_DIR)) return [];
  return readdirSync(TASK_DIR)
    .filter((f) => TASK_FILE.test(f))
    .map((f) => toTask(f, readFileSync(join(TASK_DIR, f), 'utf8')));
}

// The board always reads main, so a stale worktree can't misreport it.
function tasksFromMain() {
  return git('ls-tree', '--name-only', BASE, `${TASK_DIR}/`)
    .split('\n')
    .map((p) => p.split('/').pop())
    .filter((f) => TASK_FILE.test(f))
    .map((f) => toTask(f, git('show', `${BASE}:${TASK_DIR}/${f}`)));
}

function parseShared(text) {
  return text.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}

// --- paths -------------------------------------------------------------------

// Owned paths are an exact file or "dir/**". Keeping to those two forms makes
// overlap detection exact rather than a guess about arbitrary globs.
const isDir = (p) => p.endsWith('/**');
const dirOf = (p) => p.slice(0, -2);
const validPath = (p) => !(isDir(p) ? dirOf(p) : p).includes('*') && !p.startsWith('/');

function pathsOverlap(a, b) {
  if (isDir(a) && isDir(b)) return dirOf(a).startsWith(dirOf(b)) || dirOf(b).startsWith(dirOf(a));
  if (isDir(a)) return b.startsWith(dirOf(a));
  if (isDir(b)) return a.startsWith(dirOf(b));
  return a === b;
}

const covers = (paths, file) => paths.some((p) => pathsOverlap(p, file));

// --- dependency graph --------------------------------------------------------

// Every later task implicitly waits for all of wave 0, the foundation.
function directDeps(task, tasks) {
  const foundation = task.wave > 0 ? tasks.filter((t) => t.wave === 0).map((t) => t.id) : [];
  return [...new Set([...task.depends_on, ...foundation])];
}

function ancestors(id, byId, tasks, seen = new Set()) {
  const task = byId.get(id);
  if (!task) return seen;
  for (const dep of directDeps(task, tasks)) {
    if (seen.has(dep)) continue;
    seen.add(dep);
    ancestors(dep, byId, tasks, seen);
  }
  return seen;
}

// --- board -------------------------------------------------------------------

function claimedIds() {
  const lines = git('ls-remote', '--tags', 'origin', 'refs/tags/claim/*').split('\n').filter(Boolean);
  return new Set(lines.map((l) => l.split('refs/tags/claim/')[1]));
}

function loadBoard() {
  git('fetch', '--prune', '--quiet', 'origin');
  const tasks = tasksFromMain();
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const claimed = claimedIds();
  const branches = new Map();
  const refs = git(
    'for-each-ref',
    '--format=%(refname:lstrip=3)%09%(committerdate:relative)',
    'refs/remotes/origin/',
  );
  for (const line of refs.split('\n').filter(Boolean)) {
    const [branch, when] = line.split('\t');
    const [, who, kind] = branch.match(BRANCH) ?? [];
    const digits = kind?.match(/^t(\d{3})-/)?.[1];
    if (digits) branches.set(idOf(digits), { branch, who, when });
  }
  for (const task of tasks) {
    const waiting = directDeps(task, tasks).filter((d) => byId.get(d)?.status !== 'done');
    task.waiting = waiting;
    task.claim = claimed.has(task.id)
      ? (branches.get(task.id) ?? { who: 'unknown', when: 'no branch' })
      : null;
    if (task.status === 'done') task.state = 'done';
    else if (task.claim) task.state = 'claimed';
    else if (waiting.length) task.state = 'blocked';
    else task.state = 'ready';
  }
  return tasks.sort((a, b) => a.wave - b.wave || a.id.localeCompare(b.id));
}

function list(args) {
  const owner = flag(args, '--owner');
  const tasks = loadBoard().filter((t) => !owner || t.owner === owner || t.owner === 'any');
  if (!tasks.length) return console.log('No tasks on main yet.');
  for (const t of tasks) {
    const note =
      t.state === 'claimed'
        ? `${t.claim.who}, active ${t.claim.when}`
        : t.state === 'blocked'
          ? `waiting on ${t.waiting.join(', ')}`
          : '';
    console.log(
      [t.id, `w${t.wave}`, t.state.padEnd(7), t.owner.padEnd(8), t.title, note && `(${note})`]
        .filter(Boolean)
        .join('  '),
    );
  }
  const count = (s) => tasks.filter((t) => t.state === s).length;
  console.log(
    `\n${count('done')} done, ${count('claimed')} claimed, ${count('ready')} ready, ${count('blocked')} blocked`,
  );
}

// Tags can't be moved without force, so the server lets exactly one agent create
// claim/T-012. --atomic means the loser doesn't leave a branch behind either.
function tryClaim(task, person) {
  const branch = branchFor(task, person);
  const message = `claim ${task.id} [${randomBytes(4).toString('hex')}]`;
  const sha = git('commit-tree', `${BASE}^{tree}`, '-p', BASE, '-m', message);
  try {
    git(
      'push', '--quiet', '--atomic', 'origin',
      `${sha}:refs/tags/claim/${task.id}`,
      `${sha}:refs/heads/${branch}`,
    );
  } catch {
    return null;
  }
  git('switch', '--quiet', '--no-track', '-c', branch, sha);
  git('branch', '--quiet', `--set-upstream-to=origin/${branch}`);
  return branch;
}

function claim(args) {
  const person = currentPerson();
  if (git('rev-parse', '--git-dir') === git('rev-parse', '--git-common-dir')) {
    die('this is the main checkout. Start a worktree session first: claude -w');
  }
  if (git('status', '--porcelain')) die('working tree has uncommitted changes');

  const tasks = loadBoard();
  const id = args.find((a) => /^T-\d{3}$/.test(a));

  let candidates;
  if (id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) die(`${id} is not on ${BASE}`);
    if (task.state === 'claimed') {
      die(`${id} is claimed by ${task.claim.who}. To resume it: git switch ${task.claim.branch}`);
    }
    if (task.state !== 'ready') {
      die(`${id} is ${task.state}${task.waiting.length ? ` on ${task.waiting.join(', ')}` : ''}`);
    }
    candidates = [task];
  } else {
    const ready = tasks.filter((t) => t.state === 'ready');
    candidates = [
      ...ready.filter((t) => t.owner === person),
      ...ready.filter((t) => t.owner === 'any'),
    ];
    if (!candidates.length) die(`nothing ready for ${person}. Run: node scripts/task.mjs list`);
  }

  for (const task of candidates) {
    const branch = tryClaim(task, person);
    if (!branch) continue;
    console.log(`Claimed ${task.id}: ${task.title}`);
    console.log(`Branch:  ${branch}`);
    console.log(`Brief:   ${task.path}`);
    console.log(`Owns:    ${task.owns.join(', ')}`);
    return;
  }
  die(id ? `lost the race for ${id}, another agent claimed it` : 'every ready task was just claimed');
}

function release(args) {
  const id = args[0];
  if (!/^T-\d{3}$/.test(id ?? '')) die('usage: release T-012 [--force]');
  const task = loadBoard().find((t) => t.id === id);
  if (!task?.claim) die(`${id} isn't claimed`);
  if (task.claim.who !== currentPerson() && !args.includes('--force')) {
    die(`${id} belongs to ${task.claim.who}. Check with them, then pass --force`);
  }
  const refs = [`refs/tags/claim/${id}`];
  if (task.claim.branch) refs.push(`refs/heads/${task.claim.branch}`);
  git('push', '--quiet', 'origin', '--delete', ...refs);
  console.log(`Released ${id}. Local commits on its branch are untouched.`);
}

// Only removes what can't lose work: clean worktrees whose branch has a merged PR,
// or that /ship detached onto main. A deleted remote branch alone proves nothing,
// because release deletes one too, and squash merges hide from git's own ancestry.
function hasMergedPr(branch) {
  try {
    const out = execFileSync(
      'gh',
      ['pr', 'list', '--head', branch, '--state', 'merged', '--json', 'number', '--jq', 'length'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    return Number(out.trim()) > 0;
  } catch {
    return false;
  }
}

function cleanup() {
  git('fetch', '--prune', '--quiet', 'origin');
  const here = git('rev-parse', '--show-toplevel');
  const gone = git('for-each-ref', '--format=%(refname:short)%09%(upstream:track)', 'refs/heads/')
    .split('\n')
    .filter((l) => l.endsWith('[gone]'))
    .map((l) => l.split('\t')[0])
    .filter(hasMergedPr);

  const parse = () =>
    git('worktree', 'list', '--porcelain').split('\n\n').map((block) => ({
      path: block.match(/^worktree (.+)$/m)?.[1],
      head: block.match(/^HEAD (.+)$/m)?.[1],
      branch: block.match(/^branch refs\/heads\/(.+)$/m)?.[1],
    }));

  const isMerged = (sha) => {
    try {
      git('merge-base', '--is-ancestor', sha, BASE);
      return true;
    } catch {
      return false;
    }
  };

  let removed = 0;
  for (const wt of parse().slice(1)) {
    if (wt.path === here) continue;
    const finished = wt.branch ? gone.includes(wt.branch) : isMerged(wt.head);
    if (!finished) continue;
    try {
      if (git('-C', wt.path, 'status', '--porcelain')) continue;
      git('worktree', 'remove', wt.path);
      removed += 1;
    } catch {
      console.error(`  skipped ${wt.path}`);
    }
  }

  const inUse = new Set(parse().map((wt) => wt.branch));
  const stale = gone.filter((b) => !inUse.has(b));
  stale.forEach((b) => git('branch', '-D', b));
  git('worktree', 'prune');
  console.log(`Removed ${removed} worktree(s) and ${stale.length} branch(es).`);
}

// --- checks ------------------------------------------------------------------

function checkPlan() {
  const shared = existsSync(SHARED_FILE) ? parseShared(readFileSync(SHARED_FILE, 'utf8')) : [];
  const tasks = tasksFromDisk();
  const byId = new Map();
  const errors = [];

  for (const t of tasks) {
    const where = t.file;
    const fileId = t.file.match(TASK_FILE)[1];
    if (t.id !== fileId) errors.push(`${where}: id "${t.id}" doesn't match the filename`);
    if (byId.has(t.id)) errors.push(`${where}: duplicate id ${t.id}`);
    byId.set(t.id, t);
    if (!t.title) errors.push(`${where}: missing title`);
    if (!OWNERS.includes(t.owner)) errors.push(`${where}: owner must be one of ${OWNERS.join(', ')}`);
    if (!Number.isInteger(t.wave) || t.wave < 0) errors.push(`${where}: wave must be an integer >= 0`);
    if (!['todo', 'done'].includes(t.status)) errors.push(`${where}: status must be todo or done`);
    if (!t.owns.length) errors.push(`${where}: owns is empty`);
    for (const p of t.owns) {
      if (!validPath(p)) errors.push(`${where}: "${p}" must be an exact file or dir/**`);
      if (t.wave > 0 && shared.some((s) => pathsOverlap(s, p))) {
        errors.push(`${where}: "${p}" is a shared path, only wave 0 or a hot branch may change it`);
      }
    }
  }

  for (const t of tasks) {
    for (const dep of t.depends_on) {
      if (!byId.has(dep)) errors.push(`${t.file}: depends on unknown task ${dep}`);
    }
    if (ancestors(t.id, byId, tasks).has(t.id)) errors.push(`${t.file}: dependency cycle`);
  }

  // Two unfinished tasks may share a path only if one is guaranteed to merge first.
  const open = tasks.filter((t) => t.status !== 'done');
  for (const [i, a] of open.entries()) {
    for (const b of open.slice(i + 1)) {
      if (ancestors(a.id, byId, tasks).has(b.id) || ancestors(b.id, byId, tasks).has(a.id)) continue;
      for (const p of a.owns) {
        for (const q of b.owns) {
          if (pathsOverlap(p, q)) {
            errors.push(`${a.id} and ${b.id} can run in parallel but both own "${p}" / "${q}"`);
          }
        }
      }
    }
  }

  if (errors.length) {
    errors.forEach((e) => console.error(`  ${e}`));
    die(`plan check failed with ${errors.length} problem(s)`);
  }
  console.log(`Plan OK: ${tasks.length} task(s), no parallel tasks share a path.`);
}

function checkScope(args) {
  const branch =
    flag(args, '--branch') || process.env.GITHUB_HEAD_REF || git('rev-parse', '--abbrev-ref', 'HEAD');
  const changed = git('diff', '--name-only', '--no-renames', `${BASE}...HEAD`).split('\n').filter(Boolean);
  // Rules come from main, so a branch can't widen its own scope.
  const shared = parseShared(git('show', `${BASE}:${SHARED_FILE}`));

  const kind = branch.match(BRANCH)?.[2];
  if (!kind) die(`branch "${branch}" must start with one of ${PEOPLE.join(', ')}. See CLAUDE.md`);
  const taskDigits = kind.match(/^t(\d{3})-/)?.[1];

  let outside;
  let rule;
  if (taskDigits) {
    const task = tasksFromMain().find((t) => t.id === idOf(taskDigits));
    if (!task) die(`${idOf(taskDigits)} is not on ${BASE}`);
    const allowed = [...task.owns, task.path];
    outside = changed.filter((f) => !covers(allowed, f));
    rule = `outside ${task.id}'s owned paths (${allowed.join(', ')})`;
  } else if (kind.startsWith('hot-')) {
    outside = changed.filter((f) => !covers(shared, f));
    rule = 'outside the shared paths, which is all a hot branch may change';
  } else {
    // Ad-hoc fixes stay clear of hot files and of anything a live task is working on.
    const claimed = claimedIds();
    const live = tasksFromMain().filter((t) => claimed.has(t.id) && t.status !== 'done');
    const offLimits = [...shared, ...live.flatMap((t) => t.owns)];
    outside = changed.filter((f) => covers(offLimits, f));
    rule = 'in shared paths or owned by a task in progress';
  }

  if (outside.length) {
    outside.forEach((f) => console.error(`  ${f}`));
    die(`${outside.length} file(s) ${rule}.\nRevert them, or see "When you need a file you don't own" in CLAUDE.md`);
  }
  console.log(`Scope OK: ${changed.length} changed file(s) on ${branch}.`);
}

// --- entry -------------------------------------------------------------------

const [command, ...args] = process.argv.slice(2);
const commands = {
  list,
  claim,
  release,
  cleanup,
  'check-plan': checkPlan,
  'check-scope': checkScope,
};
if (!commands[command]) die(`usage: task.mjs ${Object.keys(commands).join(' | ')}`);
commands[command](args);
