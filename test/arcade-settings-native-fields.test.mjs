import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import {legacySettingType,normalizeArcadeBlockSchema} from '../src/utils/arcadeDialect.js';

const legacy=(opcode='arcade_settingsWrite',value='StringArray')=>{
    const name=opcode==='arcade_settingsWrite'?'settingWriteTypes':'settingReadTypes';
    const block={opcode,fields:{},inputs:{TYPE:[1,'menu'],VALUE:[3,'value','shadow']}};
    const menu={opcode:`arcade_menu_${name}`,fields:{[name]:[value,null]},inputs:{},shadow:true,topLevel:false,parent:'command'};
    return {block,blocks:{command:block,menu,value:{opcode:'data_variable',fields:{VARIABLE:['items','v']},inputs:{}}}};
};
for(const opcode of ['arcade_settingsWrite','arcade_settingsRead'])test(`${opcode} migrates only its actual literal menu shadow and preserves value identity`,()=>{
    const {block,blocks}=legacy(opcode);const value=blocks.value;
    assert.equal(legacySettingType(block,blocks),'StringArray');
    assert.equal(normalizeArcadeBlockSchema(block,{id:'command',blocks}),true);
    assert.deepEqual(block.fields.TYPE,['StringArray',null]);assert.equal(block.inputs.TYPE,undefined);
    assert.equal(blocks.menu,undefined);assert.equal(blocks.value,value);assert.deepEqual(block.inputs.VALUE,[3,'value','shadow']);
    assert.equal(normalizeArcadeBlockSchema(block,{id:'command',blocks}),false);
});
test('shared menu shadows are retained when another input still owns them',()=>{
    const {block,blocks}=legacy();blocks.other={opcode:'example',inputs:{SELECT:[1,'menu']},fields:{}};
    normalizeArcadeBlockSchema(block,{id:'command',blocks});assert.ok(blocks.menu);
});
for(const shape of ['computed','unknown','wrongMenu','notShadow','missing','executableNext','connectedInput','extraTuple'])test(`legacy settings ${shape} is refused without inventing Number`,()=>{
    const {block,blocks}=legacy();
    if(shape==='computed')block.inputs.TYPE=[3,'variable','menu'];
    if(shape==='unknown')blocks.menu.fields.settingWriteTypes[0]='NotAType';
    if(shape==='wrongMenu')blocks.menu.opcode='arcade_menu_settingReadTypes';
    if(shape==='notShadow')blocks.menu.shadow=false;
    if(shape==='missing')delete blocks.menu;
    if(shape==='executableNext')blocks.menu.next='value';
    if(shape==='connectedInput')blocks.menu.inputs.EXTRA=[1,'value'];
    if(shape==='extraTuple')block.inputs.TYPE.push('value');
    const before=structuredClone({block,blocks});assert.equal(legacySettingType(block,blocks),undefined);
    assert.equal(normalizeArcadeBlockSchema(block,{id:'command',blocks}),false);assert.deepEqual({block,blocks},before);
});
test('legacy StringArray decompilation uses its genuine literal menu before regeneration',()=>{
    const original=new SB3Creator();original.parse('DEVICE ARCADE\nSPRITE Game:\nWHEN flag clicked:\n  arcade write setting ("key") type StringArray value (undefined value)');
    const target=original.project.targets.find(t=>t.name==='Game'),pair=Object.entries(target.blocks).find(([,b])=>b.opcode==='arcade_settingsWrite'),[id,block]=pair;
    delete block.fields.TYPE;block.inputs.TYPE=[1,'legacy-menu'];target.blocks['legacy-menu']={opcode:'arcade_menu_settingWriteTypes',fields:{settingWriteTypes:['StringArray',null]},inputs:{},parent:id,shadow:true,topLevel:false};
    const code=original.decompile();assert.match(code,/type StringArray/);const fresh=new SB3Creator();fresh.parse(code);assert.deepEqual(fresh.warnings,[]);
    const write=fresh.project.targets.flatMap(t=>Object.values(t.blocks)).find(b=>b.opcode==='arcade_settingsWrite');assert.deepEqual(write.fields.TYPE,['StringArray',null]);assert.equal(write.inputs.TYPE,undefined);
});

test('a native selection wins and only its obsolete unshared literal shadow is removed',()=>{
    const {block,blocks}=legacy();block.fields.TYPE=['Buffer',null];
    normalizeArcadeBlockSchema(block,{id:'command',blocks});
    assert.deepEqual(block.fields.TYPE,['Buffer',null]);assert.equal(block.inputs.TYPE,undefined);assert.equal(blocks.menu,undefined);
});
for (const [opcode, types] of [['arcade_settingsWrite',['Number','String','NumberArray','StringArray','Buffer']],
    ['arcade_settingsRead',['Number','String','NumberArray','StringArray','Buffer','List']]]) {
    for (const type of types) test(`${opcode} ${type} is a direct field through editable Code round trips`,()=>{
        const c=new SB3Creator();const verb=opcode==='arcade_settingsWrite'?'write':'read';
        const command=verb==='write'?`arcade write setting ("key") type ${type} value (undefined value)`:
            `set [result] to (arcade read setting ("key") type ${type})`;
        c.parse(`DEVICE ARCADE\nSPRITE Game:\nWHEN flag clicked:\n  ${command}`);
        assert.deepEqual(c.warnings,[]);
        const b=c.project.targets.flatMap(t=>Object.values(t.blocks)).find(b=>b.opcode===opcode);
        assert.deepEqual(b.fields.TYPE,[type,null]);assert.equal(b.inputs.TYPE,undefined);
        b.fields.TYPE[0]=types.at(-1);const second=new SB3Creator();second.parse(c.decompile());
        assert.deepEqual(second.warnings,[]);const again=second.project.targets.flatMap(t=>Object.values(t.blocks)).find(b=>b.opcode===opcode);
        assert.deepEqual(again.fields.TYPE,[types.at(-1),null]);assert.equal(again.inputs.TYPE,undefined);
    });
}
