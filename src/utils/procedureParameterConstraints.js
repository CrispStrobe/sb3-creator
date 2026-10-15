// Editable declaration bindings only. This supplies no runtime value facts.
const opcode='arcade_declareParameterConstraint';
const types=new Set(['Number','Boolean','String','Any']);
const read=(block,name)=>{if(block.inputs?.[name])throw Error(name+' must be a fixed selector');return block.fields?.[name]?.[0];};
const child=(blocks,block,name)=>blocks[block.inputs?.[name]?.[1]];
const list=(text,label)=>{let value;try{value=JSON.parse(text);}catch{throw Error('malformed '+label);}if(!Array.isArray(value)||value.some(x=>typeof x!=='string')||new Set(value).size!==value.length)throw Error('duplicate or malformed '+label);return value;};
export function validateProcedureParameterConstraints(project) {
 for(const target of project.targets||[]) {
  const blocks=target.blocks||{},claimed=new Set();
  if(!Object.values(blocks).some(block=>block.opcode===opcode))continue;
  const definitions=Object.entries(blocks).filter(([,block])=>block.opcode==='procedures_definition');
  for(const [definitionId,definition]of definitions) {
   let current=blocks[definition.next];if(current?.opcode!==opcode)continue;
   const prototype=child(blocks,definition,'custom_block'),prototypeId=definition.inputs?.custom_block?.[1],code=prototype?.mutation?.proccode;
   if(definition.topLevel!==true||definition.parent!=null||prototype?.opcode!=='procedures_prototype'||prototype.parent!==definitionId||typeof code!=='string'||Object.values(blocks).filter(block=>block.opcode==='procedures_prototype'&&block.mutation?.proccode===code).length!==1)throw Error('actual procedure prototype is missing or ambiguous');
   const names=list(prototype.mutation.argumentnames,'formal names'),ids=list(prototype.mutation.argumentids,'formal IDs');
   if(names.length!==ids.length||names.some(name=>!name)||(code.match(/%[sbn]/g)||[]).length!==ids.length)throw Error('ordered formal mapping differs');
   for(let i=0;i<ids.length;i++) {const reporter=child(blocks,prototype,ids[i]);if(!reporter||!/^argument_reporter_(string_number|boolean)$/.test(reporter.opcode)||reporter.parent!==prototypeId||reporter.fields?.VALUE?.[0]!==names[i])throw Error('actual formal reporter binding differs');}
   const seen=new Set();let previous=definitionId;
   while(current?.opcode===opcode) {
    if(claimed.has(current)||current.parent!==previous)throw Error('duplicate, cyclic or detached declaration prefix');claimed.add(current);
    const procedure=read(current,'PROCEDURE'),parameter=read(current,'PARAMETER'),type=read(current,'TYPE');
    if(child(blocks,prototype,ids[names.indexOf(parameter)])?.opcode==='argument_reporter_boolean'&&!['Boolean','Any'].includes(type))throw Error('Boolean socket constraint differs');
    if(procedure!==code||!names.includes(parameter)||!types.has(type)||seen.has(parameter))throw Error('missing, stale or duplicate procedure/formal selector');seen.add(parameter);
    previous=Object.keys(blocks).find(id=>blocks[id]===current);current=blocks[current.next];
   }
   for(const call of Object.values(blocks))if(call.opcode==='procedures_call'&&call.mutation?.proccode===code) {
    if(ids.some(id=>!call.inputs?.[id])||JSON.stringify(list(call.mutation.argumentids,'call formal IDs'))!==JSON.stringify(ids))throw Error('current call ordered formal IDs differ');
   }
  }
  if(Object.values(blocks).some(block=>block.opcode===opcode&&!claimed.has(block)))throw Error('declaration must be in its actual DEFINE prefix');
 }
 return project;
}
