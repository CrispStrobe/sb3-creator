// Editable declaration bindings only. This supplies no runtime value facts.
const opcode='arcade_declareParameterConstraint';
const types=new Set(['Number','Boolean','String','Any']);
const read=(block,name)=>{if(block.inputs?.[name])throw Error(name+' must be a fixed selector');return block.fields?.[name]?.[0];};
const child=(blocks,block,name)=>blocks[block.inputs?.[name]?.[1]];
const exactInputs=(block,names)=>Object.keys(block.inputs||{}).length===names.length&&names.every(name=>Object.hasOwn(block.inputs||{},name));
const list=(text,label)=>{let value;try{value=JSON.parse(text);}catch{throw Error('malformed '+label);}if(!Array.isArray(value)||value.some(x=>typeof x!=='string')||new Set(value).size!==value.length)throw Error('duplicate or malformed '+label);return value;};
export function validateProcedureParameterConstraints(project) {
 for(const target of project.targets||[]) {
  const blocks=target.blocks||{},claimed=new Set();
  if(!Object.values(blocks).some(block=>block?.opcode===opcode))continue;
  const definitions=Object.entries(blocks).filter(([,block])=>block?.opcode==='procedures_definition');
  for(const [definitionId,definition]of definitions) {
   let current=blocks[definition.next];if(current?.opcode!==opcode)continue;
   const prototype=child(blocks,definition,'custom_block'),prototypeId=definition.inputs?.custom_block?.[1],code=prototype?.mutation?.proccode;
   if(definition.topLevel!==true||definition.parent!=null||prototype?.opcode!=='procedures_prototype'||prototype.parent!==definitionId||prototype.topLevel===true||prototype.next!=null||!exactInputs(definition,['custom_block'])||Object.keys(definition.fields||{}).length||Object.keys(prototype.fields||{}).length||typeof code!=='string'||Object.values(blocks).filter(block=>block?.opcode==='procedures_prototype'&&block.mutation?.proccode===code).length!==1)throw Error('actual procedure prototype is missing or ambiguous');
   const names=list(prototype.mutation.argumentnames,'formal names'),ids=list(prototype.mutation.argumentids,'formal IDs');
   let defaults;try{defaults=JSON.parse(prototype.mutation.argumentdefaults);}catch{throw Error('malformed formal defaults');}
   if(!Array.isArray(defaults)||defaults.length!==ids.length||!exactInputs(prototype,ids)||names.length!==ids.length||names.some(name=>!name)||ids.some(id=>!id)||(code.match(/%[sbn]/g)||[]).length!==ids.length)throw Error('ordered formal mapping differs');
   for(let i=0;i<ids.length;i++) {const reporter=child(blocks,prototype,ids[i]);if(!reporter||!/^argument_reporter_(string_number|boolean)$/.test(reporter.opcode)||reporter.parent!==prototypeId||reporter.topLevel===true||reporter.next!=null||Object.keys(reporter.inputs||{}).length||Object.keys(reporter.fields||{}).join(',')!=='VALUE'||reporter.fields?.VALUE?.[0]!==names[i])throw Error('actual formal reporter binding differs');}
   const seen=new Set();let previous=definitionId;
   while(current?.opcode===opcode) {
    if(claimed.has(current)||current.parent!==previous)throw Error('duplicate, cyclic or detached declaration prefix');claimed.add(current);
    if(Object.keys(current.inputs||{}).length||Object.keys(current.fields||{}).sort().join(',')!=='PARAMETER,PROCEDURE,TYPE')throw Error('declaration requires only its three fixed selector fields and zero inputs');
    const procedure=read(current,'PROCEDURE'),parameter=read(current,'PARAMETER'),type=read(current,'TYPE');
    if(child(blocks,prototype,ids[names.indexOf(parameter)])?.opcode==='argument_reporter_boolean'&&!['Boolean','Any'].includes(type))throw Error('Boolean socket constraint differs');
    if(procedure!==code||!names.includes(parameter)||!types.has(type)||seen.has(parameter))throw Error('missing, stale or duplicate procedure/formal selector');seen.add(parameter);
    previous=Object.keys(blocks).find(id=>blocks[id]===current);current=blocks[current.next];
   }
   const walk=(id,parent,seen)=>{
    if(id==null)return;
    if(typeof id!=='string'||!blocks[id])throw Error('body contains a missing current block');
    if(seen.has(id))throw Error('body contains a cycle or shared child');seen.add(id);
    const node=blocks[id];if(node.parent!==parent||node.topLevel===true)throw Error('body parent ownership differs');
    for(const slot of Object.values(node.inputs||{})){const child=slot?.[1];if(typeof child==='string')walk(child,id,seen);}
    walk(node.next,id,seen);
   };
   walk(definition.next,definitionId,new Set());
   for(const [callId,call]of Object.entries(blocks))if(call?.opcode==='procedures_call'&&call.mutation?.proccode===code) {
    if(Object.keys(call.fields||{}).length||!exactInputs(call,ids)||ids.some(id=>!call.inputs?.[id])||JSON.stringify(list(call.mutation.argumentids,'call formal IDs'))!==JSON.stringify(ids))throw Error('current call ordered formal IDs differ');
    const seen=new Set();for(const id of ids){const value=call.inputs[id]?.[1];if(typeof value==='string')walk(value,callId,seen);}
   }
  }
  if(Object.values(blocks).some(block=>block?.opcode===opcode&&!claimed.has(block)))throw Error('declaration must be in its actual DEFINE prefix');
 }
 return project;
}
