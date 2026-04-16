// Aggregate runner — one command, exit code = failure count.
const {spawnSync} = require('child_process');
const path = require('path');

const tests = [
  'test_rbd_bridge',
  'test_ram_capacity',
  'test_weibull_mle',
  'test_weibull_interval_narrow',
  'test_fta',
  'test_ui_smoke',
];

let fail = 0;
for(const name of tests){
  const file = path.join(__dirname, name + '.js');
  console.log(`\n========== ${name} ==========`);
  const r = spawnSync(process.execPath, [file], {stdio:'inherit'});
  if(r.status !== 0){
    console.error(`>>> FAIL: ${name} (exit ${r.status})`);
    fail++;
  }
}
console.log(`\n${tests.length - fail}/${tests.length} passed.`);
process.exit(fail);
