import ctypes,ctypes.util,json,os,select,time,struct
from pathlib import Path
root=Path('/tmp/shadow-auto-record-probe-20261116')
source=json.loads((root/'exact-current-source.json').read_text())
path=Path(source['path']);thread=source['threadId']
with path.open('rb') as f:
 meta=json.loads(f.readline())
assert meta['type']=='session_meta' and meta['payload']['id']==thread
assert meta['payload']['cwd']=='/home/ena/workspace/ena/agent-foundry/feature/init'
lib=ctypes.CDLL(ctypes.util.find_library('c'),use_errno=True)
lib.inotify_init1.argtypes=[ctypes.c_int];lib.inotify_init1.restype=ctypes.c_int
lib.inotify_add_watch.argtypes=[ctypes.c_int,ctypes.c_char_p,ctypes.c_uint32];lib.inotify_add_watch.restype=ctypes.c_int
fd=lib.inotify_init1(os.O_NONBLOCK|os.O_CLOEXEC)
assert fd>=0
wd=lib.inotify_add_watch(fd,os.fsencode(path),0x2|0x8|0x400|0x800)
assert wd>=0
f=path.open('rb');f.seek(0,2)
startOffset=f.tell();seen=set();saved=[];skipped=0;buffer=b'';reason='timeout';start=time.time_ns();deadline=time.monotonic()+180
out=root/'current-event-records.jsonl';out.touch(exist_ok=False)
receipts=root/'current-event-receipts.jsonl';receipts.touch(exist_ok=False)
(root/'watcher-ready.json').write_text(json.dumps({'pid':os.getpid(),'threadId':thread,'sourceOffset':startOffset,'readyAtNs':start,'mechanism':'Linux inotify IN_MODIFY/IN_CLOSE_WRITE','ttlSeconds':180},indent=2))
print('WATCHER_READY',flush=True)
try:
 while time.monotonic()<deadline:
  if (root/'stop-watcher').exists():reason='controlled_stop';break
  ready,_,_=select.select([fd],[],[],1)
  if not ready:continue
  eventbuf=os.read(fd,65536);i=0
  while i+16<=len(eventbuf):
   watch,mask,cookie,n=struct.unpack_from('iIII',eventbuf,i);i+=16+n
   if mask&(0x400|0x800):raise RuntimeError('source moved/deleted; no automatic reattachment')
  chunk=f.read()
  if not chunk:continue
  buffer+=chunk;parts=buffer.split(b'\n');buffer=parts.pop()
  for line in parts:
   try:event=json.loads(line)
   except ValueError:skipped+=1;continue
   p=event.get('payload',{})
   if event.get('type')!='event_msg' or p.get('type')!='item_completed' or p.get('thread_id')!=thread:skipped+=1;continue
   item=p.get('item',{});kind=item.get('type')
   if kind not in ('UserMessage','AgentMessage'):skipped+=1;continue
   key=(thread,p.get('turn_id'),item.get('id'))
   if key in seen:continue
   seen.add(key)
   content=item.get('content',[])
   text='\n'.join(c['text'] for c in content if c.get('type') in ('Text','text') and isinstance(c.get('text'),str))
   row={'threadId':thread,'turnId':p.get('turn_id'),'itemId':item.get('id'),'role':'user' if kind=='UserMessage' else 'assistant','phase':item.get('phase'),'text':text,'sourceCompletedAtMs':p.get('completed_at_ms'),'observedAtNs':time.time_ns()}
   with out.open('a') as w:w.write(json.dumps(row,ensure_ascii=False)+'\n');w.flush();os.fsync(w.fileno())
   actual=json.loads(out.read_text().splitlines()[-1]);assert actual==row
   receipt={'itemId':row['itemId'],'role':row['role'],'sourceCompletedAtMs':row['sourceCompletedAtMs'],'observedAtNs':row['observedAtNs'],'savedAndReadBackAtNs':time.time_ns(),'fileMtimeNs':out.stat().st_mtime_ns,'textLength':len(text)}
   with receipts.open('a') as w:w.write(json.dumps(receipt)+'\n');w.flush()
   saved.append(receipt)
except Exception as exc:
 reason='error:'+str(exc)
finally:
 f.close();os.close(fd)
 (root/'watcher-result.json').write_text(json.dumps({'reason':reason,'readyAtNs':start,'finishedAtNs':time.time_ns(),'sourceOffset':startOffset,'savedCount':len(saved),'skippedNonVisibleOrOtherEvents':skipped,'receipts':saved},indent=2))
 print(json.dumps({'reason':reason,'savedCount':len(saved),'roles':[r['role'] for r in saved]}),flush=True)
