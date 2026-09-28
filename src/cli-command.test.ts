import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCliCommand, shimScript, type CliLookup } from './cli-command';

// TASKS S8: the shim npm writes for a package's bin on Windows (cmd-shim), and the older form.
const CMD_SHIM = [
  '@ECHO off',
  'GOTO start',
  ':find_dp0',
  'SET dp0=%~dp0',
  'EXIT /b',
  ':start',
  'SETLOCAL',
  'CALL :find_dp0',
  'IF EXIST "%dp0%\\node.exe" (',
  '  SET "_prog=%dp0%\\node.exe"',
  ') ELSE (',
  '  SET "_prog=node"',
  '  SET PATHEXT=%PATHEXT:;.JS;=;%',
  ')',
  'endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & "%_prog%"  "%dp0%\\node_modules\\@anthropic-ai\\claude-code\\cli.js" %*',
].join('\r\n');
const OLD_SHIM = '@"%~dp0\\node.exe"  "%~dp0\\..\\@google\\gemini-cli\\dist\\index.js" %*';

test('a shim is read for the script it runs', () => {
  assert.equal(
    shimScript(CMD_SHIM, 'C:\\Users\\me\\AppData\\Roaming\\npm'),
    'C:\\Users\\me\\AppData\\Roaming\\npm\\node_modules\\@anthropic-ai\\claude-code\\cli.js',
  );
  assert.equal(shimScript(OLD_SHIM, 'C:\\npm\\bin'), 'C:\\npm\\@google\\gemini-cli\\dist\\index.js');
  assert.equal(shimScript('@echo off\r\nstart something.exe %*', 'C:\\x'), null);
});

function lookup(files: Record<string, string>, over: Partial<CliLookup> = {}): CliLookup {
  return {
    platform: 'win32',
    env: { PATH: 'C:\\Windows\\system32;C:\\Users\\me\\AppData\\Roaming\\npm;C:\\Users\\me\\.local\\bin', PATHEXT: '.COM;.EXE;.BAT;.CMD' },
    node: 'C:\\Program Files\\nodejs\\node.exe',
    exists: (f) => f in files,
    read: (f) => files[f] ?? '',
    ...over,
  };
}

test('on Windows an npm shim runs as Node and its script — no shell reads the prompt', () => {
  const files = { 'C:\\Users\\me\\AppData\\Roaming\\npm\\claude.cmd': CMD_SHIM };
  assert.deepEqual(resolveCliCommand('claude', lookup(files)), {
    file: 'C:\\Program Files\\nodejs\\node.exe',
    prefix: ['C:\\Users\\me\\AppData\\Roaming\\npm\\node_modules\\@anthropic-ai\\claude-code\\cli.js'],
  });
});

test('a native .exe found first on PATH runs as itself', () => {
  const files = { 'C:\\Users\\me\\.local\\bin\\claude.exe': '', 'C:\\Users\\me\\AppData\\Roaming\\npm\\claude.cmd': CMD_SHIM };
  // PATH order decides, as it does for cmd.exe: the npm folder comes before .local\bin here.
  assert.equal(resolveCliCommand('claude', lookup(files)).file, 'C:\\Program Files\\nodejs\\node.exe');
  assert.deepEqual(resolveCliCommand('claude', lookup({ 'C:\\Users\\me\\.local\\bin\\claude.exe': '' })), {
    file: 'C:\\Users\\me\\.local\\bin\\claude.exe',
    prefix: [],
  });
});

test('everything else is left to execFile: other systems, a name not on PATH, a shim of another shape', () => {
  assert.deepEqual(resolveCliCommand('claude', lookup({}, { platform: 'darwin' })), { file: 'claude', prefix: [] });
  assert.deepEqual(resolveCliCommand('codex', lookup({})), { file: 'codex', prefix: [] });
  const odd = { 'C:\\tools\\gemini.cmd': '@echo off\r\ngemini-native.exe %*' };
  assert.deepEqual(resolveCliCommand('C:\\tools\\gemini.cmd', lookup(odd)), { file: 'C:\\tools\\gemini.cmd', prefix: [] });
});
