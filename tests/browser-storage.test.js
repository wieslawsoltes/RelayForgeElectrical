import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject, clone, createEntity} from '../packages/core/index.js';
import {diffProject} from '../packages/collaboration/operations.js';
import {makeLocalRecord, commitLocalOperation} from '../app/browser-storage.js';
const packet = (base, next, id='one', revision=1) => ({operationId:id, baseRevision:revision, changes:diffProject(base,next)});
test('browser storage saves immutable snapshots and revision history', () => {
 const p=createProject('Local'), next=clone(p); next.name='Changed';
 const record=makeLocalRecord(p), result=commitLocalOperation(record,packet(p,next));
 assert.equal(record.revision,1); assert.equal(result.record.revision,2);
 assert.equal(result.record.history.at(-1).project.name,'Changed');
});
test('browser storage replays acknowledgements without duplicate revisions', () => {
 const p=createProject('Local'), next=clone(p); next.name='Changed'; const op=packet(p,next);
 const saved=commitLocalOperation(makeLocalRecord(p),op).record;
 assert.equal(commitLocalOperation(saved,op).result.duplicate,true);
 assert.throws(()=>commitLocalOperation(saved,{...op,changes:[]}),/reused/);
});
test('browser storage merges independent fields from stale tabs', () => {
 const p=createProject('Local'), a=clone(p), b=clone(p); a.name='A'; b.number='B';
 let record=commitLocalOperation(makeLocalRecord(p),packet(p,a)).record;
 record=commitLocalOperation(record,packet(p,b,'two')).record;
 assert.equal(record.project.name,'A'); assert.equal(record.project.number,'B');
});
test('browser storage reports overlapping edits without losing saved data', () => {
 const p=createProject('Local'), a=clone(p), b=clone(p); a.name='A'; b.name='B';
 const record=commitLocalOperation(makeLocalRecord(p),packet(p,a)).record;
 assert.throws(()=>commitLocalOperation(record,packet(p,b,'two')),error=>error.status===409&&error.data.project.name==='A');
});
test('browser storage retains the last 100 local revisions', () => {
 let record=makeLocalRecord(createProject('Local'));
 for(let i=0;i<105;i++){const next=clone(record.project);next.name='Revision '+i;record=commitLocalOperation(record,packet(record.project,next,'op'+i,record.revision)).record;}
 assert.equal(record.history.length,100);assert.equal(record.revision,106);assert.equal(record.history[0].revision,7);
});
test('browser storage blocks deleted identity resurrection', () => {
 const p=createProject('Local');p.pages[0].entities.push(createEntity(p,'coil',100,100));
 const next=clone(p);next.pages[0].entities=[];
 const record=commitLocalOperation(makeLocalRecord(p),packet(p,next)).record;
 assert.throws(()=>commitLocalOperation(record,packet(next,p,'restore',2)),/Deleted identities/);
});
test('browser storage rejects future revisions and changed project IDs', () => {
 const p=createProject('Local'), next=clone(p);next.name='A';
 assert.throws(()=>commitLocalOperation(makeLocalRecord(p),packet(p,next,'future',99)),/Future/);
 next.id='different';assert.throws(()=>commitLocalOperation(makeLocalRecord(p),packet(p,next)),/ID cannot change/);
});
test('browser storage validates operation packet shapes', () => {
 const record=makeLocalRecord(createProject('Local'));
 for(const op of [null,{}, {operationId:'x',baseRevision:0,changes:[]}, {operationId:'x',baseRevision:1,changes:{}}])assert.throws(()=>commitLocalOperation(record,op),/Invalid operation/);
});
