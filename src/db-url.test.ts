import { test } from 'node:test';
import assert from 'node:assert/strict';
import { singleConnectionUrl } from './db-url';

test('a lock client holds one connection, whatever the URL already asked for', () => {
  assert.equal(singleConnectionUrl('postgresql://u:p@db:5432/app'), 'postgresql://u:p@db:5432/app?connection_limit=1');
  assert.equal(singleConnectionUrl('postgresql://u:p@db:5432/app?sslmode=require&connection_limit=9'), 'postgresql://u:p@db:5432/app?sslmode=require&connection_limit=1');
});

test('a password with reserved characters survives the rewrite', () => {
  const url = `postgresql://applypack:${encodeURIComponent('a/b?c#d')}@127.0.0.1:5434/postgres`;
  const out = new URL(singleConnectionUrl(url));
  assert.equal(decodeURIComponent(out.password), 'a/b?c#d');
  assert.equal(out.searchParams.get('connection_limit'), '1');
});
