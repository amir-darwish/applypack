import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listsModel, parseModelList, parseOllamaTags, preferredModel } from './server-models';

test('a model list is its ids, once each and sorted; anything else is no list', () => {
  assert.deepEqual(parseModelList({ object: 'list', data: [{ id: 'qwen2.5:14b' }, { id: 'llama3.1:8b' }, { id: 'llama3.1:8b' }] }), [
    'llama3.1:8b',
    'qwen2.5:14b',
  ]);
  assert.deepEqual(parseModelList({ data: [] }), []);
  assert.equal(parseModelList({ models: ['x'] }), null);
  assert.equal(parseModelList(null), null);
});

test('the model offered first is a chat model when the server has one', () => {
  assert.equal(preferredModel(['all-minilm:latest', 'llama3.1:8b', 'nomic-embed-text:latest']), 'llama3.1:8b');
  assert.equal(preferredModel(['bge-m3:latest', 'qwen2.5:7b']), 'qwen2.5:7b');
  assert.equal(preferredModel(['nomic-embed-text:latest']), 'nomic-embed-text:latest');
  assert.equal(preferredModel([]), null);
});

test('a model named without its tag is the one Ollama lists as :latest', () => {
  assert.equal(listsModel(['llama3.1:latest'], 'llama3.1'), true);
  assert.equal(listsModel(['llama3.1:8b'], 'llama3.1:8b'), true);
  assert.equal(listsModel(['llama3.1:8b'], 'llama3.1'), false);
});

test("Ollama's /api/tags reads as the same list", () => {
  assert.deepEqual(
    parseOllamaTags({ models: [{ name: 'qwen2.5:14b', size: 9_000_000_000 }, { name: 'llama3.1:8b', details: { family: 'llama' } }] }),
    ['llama3.1:8b', 'qwen2.5:14b'],
  );
  assert.equal(parseOllamaTags({ data: [{ id: 'x' }] }), null);
});
