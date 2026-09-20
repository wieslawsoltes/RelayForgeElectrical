import {DatabaseSync} from 'node:sqlite';
import {readdirSync,readFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
export function createDatabase(filename=':memory:'){
 const sqlite=new DatabaseSync(filename);sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');sqlite.exec('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY)');
 const dir=path.resolve(import.meta.dirname,'../drizzle');for(const name of readdirSync(dir).filter(x=>x.endsWith('.sql')).sort()){if(!sqlite.prepare('SELECT name FROM _migrations WHERE name=?').get(name)){sqlite.exec('BEGIN');try{sqlite.exec(readFileSync(path.join(dir,name),'utf8'));sqlite.prepare('INSERT INTO _migrations(name) VALUES(?)').run(name);sqlite.exec('COMMIT');}catch(e){sqlite.exec('ROLLBACK');throw e;}}}
 class Statement{constructor(sql,params=[]){this.sql=sql;this.params=params;}bind(...params){return new Statement(this.sql,params);}async first(){return sqlite.prepare(this.sql).get(...this.params)||null;}async all(){return {results:sqlite.prepare(this.sql).all(...this.params)};}async run(){const r=sqlite.prepare(this.sql).run(...this.params);return {success:true,meta:{changes:Number(r.changes)}};}}
 return {prepare:sql=>new Statement(sql),async batch(statements){sqlite.exec('BEGIN IMMEDIATE');try{const rows=[];for(const s of statements){const r=sqlite.prepare(s.sql).run(...s.params);rows.push({success:true,meta:{changes:Number(r.changes)}});}sqlite.exec('COMMIT');return rows;}catch(e){sqlite.exec('ROLLBACK');throw e;}},close:()=>sqlite.close()};
}
