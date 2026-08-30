// Windows 전용 postinstall 패치.
//
// @granite-js/plugin-micro-frontend@1.0.20 와 @apps-in-toss/plugin-compat 가 절대경로를
// path.resolve()/require.resolve() 로 구한 뒤, 백슬래시가 섞인 채로 그대로 JS 문자열
// 리터럴에 꽂아 넣는다(`import ... from '${path.resolve(x)}'`). Windows에서는 이 경로에
// \t, \n, \u 같은 JS 문자열 이스케이프로 해석될 수 있는 조합이 포함돼 있으면 문법이
// 깨져 빌드가 통째로 실패한다("Could not resolve" / "Bad character escape sequence").
//
// npm install 때마다 자동으로 슬래시를 정규화해 재적용한다. 이미 패치돼 있으면 건너뛴다.
// 패치 대상 코드가 바뀌어 패턴을 못 찾으면(패키지 업데이트 등) 조용히 넘어가지 않고
// 경고만 남긴다 — 빌드가 여전히 실패하면 이 스크립트를 다시 손봐야 한다는 신호다.

const fs = require('fs');
const path = require('path');

if (process.platform !== 'win32') {
  process.exit(0);
}

const root = __dirname + '/..';

const patches = [
  {
    file: 'node_modules/@granite-js/plugin-micro-frontend/dist/index.cjs',
    from: "import * as ${identifier} from '${path.default.resolve(modulePath)}';",
    to: "import * as ${identifier} from '${path.default.resolve(modulePath).split(path.default.sep).join('/')}';",
  },
  {
    file: 'node_modules/@granite-js/plugin-micro-frontend/dist/index.js',
    from: "import * as ${identifier} from '${path.resolve(modulePath)}';",
    to: "import * as ${identifier} from '${path.resolve(modulePath).split(path.sep).join('/')}';",
  },
  {
    file: 'node_modules/@apps-in-toss/plugin-compat/dist/index.cjs',
    from: '  const reactUsePolyfillPath = require.resolve("react18-use");\n  const reactEffectEventPolyfillPath = require.resolve("use-effect-event");',
    to: '  const reactUsePolyfillPath = require.resolve("react18-use").split(import_path4.default.sep).join("/");\n  const reactEffectEventPolyfillPath = require.resolve("use-effect-event").split(import_path4.default.sep).join("/");',
  },
  {
    file: 'node_modules/@apps-in-toss/plugin-compat/dist/index.js',
    from: '  const reactUsePolyfillPath = __require.resolve("react18-use");\n  const reactEffectEventPolyfillPath = __require.resolve("use-effect-event");',
    to: '  const reactUsePolyfillPath = __require.resolve("react18-use").split("\\\\").join("/");\n  const reactEffectEventPolyfillPath = __require.resolve("use-effect-event").split("\\\\").join("/");',
  },
];

for (const { file, from, to } of patches) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    console.warn(`[fix-granite-windows-paths] skip (not found): ${file}`);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes(to)) {
    continue; // already patched
  }
  if (!content.includes(from)) {
    console.warn(
      `[fix-granite-windows-paths] expected pattern not found in ${file} — package may have changed, patch may be stale.`
    );
    continue;
  }
  fs.writeFileSync(fullPath, content.replace(from, to));
  console.log(`[fix-granite-windows-paths] patched ${file}`);
}
