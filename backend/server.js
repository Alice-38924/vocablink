const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'vocablink-dev-secret';
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BOOKS_FILE = path.join(DATA_DIR, 'books.json');
const USERDATA_FILE = path.join(DATA_DIR, 'userdata.json');

// ---- helpers ----
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readJSON(f, def) {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return def; }
}
function writeJSON(f, d) { fs.writeFileSync(f, JSON.stringify(d, null, 2)); }

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: '未登录' });
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch { return res.status(401).json({ error: '登录已过期' }); }
}

// ---- default books ----
const TOEFL_WORDS = [
  {en:'abandon',zh:'放弃'},{en:'abundant',zh:'丰富的'},{en:'accumulate',zh:'积累'},{en:'accurate',zh:'精确的'},{en:'acquire',zh:'获得'},
  {en:'adequate',zh:'足够的'},{en:'advocate',zh:'倡导'},{en:'ambiguous',zh:'模糊的'},{en:'analyze',zh:'分析'},{en:'annual',zh:'每年的'},
  {en:'apparent',zh:'明显的'},{en:'assess',zh:'评估'},{en:'assume',zh:'假设'},{en:'available',zh:'可用的'},{en:'benefit',zh:'好处'},
  {en:'capacity',zh:'能力'},{en:'challenge',zh:'挑战'},{en:'circumstance',zh:'环境'},{en:'clarify',zh:'澄清'},{en:'collapse',zh:'崩溃'},
  {en:'compensate',zh:'补偿'},{en:'complex',zh:'复杂的'},{en:'component',zh:'组成部分'},{en:'concentrate',zh:'集中'},{en:'concept',zh:'概念'},
  {en:'conclude',zh:'得出结论'},{en:'concrete',zh:'具体的'},{en:'conduct',zh:'进行'},{en:'confirm',zh:'确认'},{en:'conflict',zh:'冲突'},
  {en:'consequence',zh:'后果'},{en:'considerable',zh:'相当大的'},{en:'constant',zh:'不变的'},{en:'consume',zh:'消耗'},{en:'contemporary',zh:'当代的'},
  {en:'contradict',zh:'矛盾'},{en:'contribute',zh:'贡献'},{en:'conventional',zh:'传统的'},{en:'convince',zh:'使确信'},{en:'coordinate',zh:'协调'},
  {en:'crucial',zh:'关键的'},{en:'decade',zh:'十年'},{en:'decline',zh:'下降'},{en:'demonstrate',zh:'展示'},{en:'derive',zh:'源于'},
  {en:'diminish',zh:'减少'},{en:'distinct',zh:'不同的'},{en:'distinguish',zh:'区分'},{en:'diverse',zh:'多样的'},{en:'domestic',zh:'国内的'},
  {en:'dominant',zh:'主导的'},{en:'dynamic',zh:'动态的'},{en:'efficient',zh:'高效的'},{en:'eliminate',zh:'消除'},{en:'emerge',zh:'出现'},
  {en:'emphasis',zh:'强调'},{en:'enable',zh:'使能够'},{en:'enormous',zh:'巨大的'},{en:'establish',zh:'建立'},{en:'evaluate',zh:'评估'},
  {en:'evident',zh:'明显的'},{en:'evolve',zh:'进化'},{en:'expand',zh:'扩展'},{en:'explicit',zh:'明确的'},{en:'feasible',zh:'可行的'},
  {en:'flexible',zh:'灵活的'},{en:'fluctuate',zh:'波动'},{en:'focus',zh:'集中'},{en:'function',zh:'功能'},{en:'fundamental',zh:'基本的'},
  {en:'generate',zh:'产生'},{en:'genuine',zh:'真正的'},{en:'global',zh:'全球的'},{en:'guarantee',zh:'保证'},{en:'harmony',zh:'和谐'},
  {en:'highlight',zh:'强调'},{en:'hypothesis',zh:'假设'},{en:'identify',zh:'识别'},{en:'illustrate',zh:'说明'},{en:'impact',zh:'影响'},
  {en:'implement',zh:'实施'},{en:'imply',zh:'暗示'},{en:'inevitable',zh:'不可避免的'},{en:'influence',zh:'影响'},{en:'initial',zh:'最初的'},
  {en:'integrate',zh:'整合'},{en:'interpret',zh:'解释'},{en:'investigate',zh:'调查'},{en:'involve',zh:'涉及'},{en:'isolate',zh:'隔离'},
  {en:'justify',zh:'证明'},{en:'launch',zh:'发射'},{en:'logical',zh:'逻辑的'},{en:'maintain',zh:'维持'},{en:'massive',zh:'大量的'},
  {en:'mature',zh:'成熟的'},{en:'method',zh:'方法'},{en:'migrate',zh:'迁徙'},{en:'modify',zh:'修改'},{en:'negotiate',zh:'谈判'},
  {en:'nevertheless',zh:'然而'},{en:'objective',zh:'目标'},{en:'obtain',zh:'获得'},{en:'obvious',zh:'明显的'},{en:'occupy',zh:'占据'},
  {en:'option',zh:'选项'},{en:'outcome',zh:'结果'},{en:'participate',zh:'参与'},{en:'perceive',zh:'感知'},{en:'persist',zh:'坚持'},
  {en:'perspective',zh:'观点'},{en:'phenomenon',zh:'现象'},{en:'potential',zh:'潜力'},{en:'precise',zh:'精确的'},{en:'predict',zh:'预测'},
  {en:'preserve',zh:'保存'},{en:'previous',zh:'之前的'},{en:'principle',zh:'原则'},{en:'priority',zh:'优先'},{en:'procedure',zh:'程序'},
  {en:'promote',zh:'促进'},{en:'qualified',zh:'合格的'},{en:'random',zh:'随机的'},{en:'range',zh:'范围'},{en:'rational',zh:'理性的'},
  {en:'recover',zh:'恢复'},{en:'reduce',zh:'减少'},{en:'reflect',zh:'反映'},{en:'regulate',zh:'监管'},{en:'reject',zh:'拒绝'},
  {en:'relevant',zh:'相关的'},{en:'reluctant',zh:'不情愿的'},{en:'rely',zh:'依赖'},{en:'represent',zh:'代表'},{en:'resolve',zh:'解决'},
  {en:'resource',zh:'资源'},{en:'restore',zh:'恢复'},{en:'restrict',zh:'限制'},{en:'reveal',zh:'揭示'},{en:'revenue',zh:'收入'},
  {en:'revise',zh:'修订'},{en:'schedule',zh:'日程'},{en:'secure',zh:'安全的'},{en:'significant',zh:'重要的'},{en:'similar',zh:'相似的'},
  {en:'sophisticated',zh:'复杂的'},{en:'source',zh:'来源'},{en:'specific',zh:'具体的'},{en:'stable',zh:'稳定的'},{en:'strategy',zh:'策略'},
  {en:'structure',zh:'结构'},{en:'subsequent',zh:'随后的'},{en:'substantial',zh:'大量的'},{en:'sufficient',zh:'足够的'},{en:'summarize',zh:'总结'},
  {en:'temporary',zh:'暂时的'},{en:'tend',zh:'倾向'},{en:'therefore',zh:'因此'},{en:'thorough',zh:'彻底的'},{en:'transfer',zh:'转移'},
  {en:'transform',zh:'转变'},{en:'transition',zh:'过渡'},{en:'trigger',zh:'触发'},{en:'ultimate',zh:'最终的'},{en:'undergo',zh:'经历'},
  {en:'unique',zh:'独特的'},{en:'universal',zh:'普遍的'},{en:'valid',zh:'有效的'},{en:'vary',zh:'变化'},{en:'vast',zh:'广阔的'},
  {en:'virtual',zh:'虚拟的'},{en:'visible',zh:'可见的'},{en:'vital',zh:'至关重要的'},{en:'vulnerable',zh:'脆弱的'},{en:'widespread',zh:'广泛的'},
  {en:'withstand',zh:'承受'},{en:'yield',zh:'产出'},
];
const DEFAULT_BOOK_NAME = '托福核心词汇';

// ---- init data files ----
if (!fs.existsSync(USERS_FILE)) writeJSON(USERS_FILE, {});
if (!fs.existsSync(BOOKS_FILE)) {
  writeJSON(BOOKS_FILE, { [DEFAULT_BOOK_NAME]: { words: [...TOEFL_WORDS], isDefault: true } });
}
if (!fs.existsSync(USERDATA_FILE)) writeJSON(USERDATA_FILE, {});

// ====================== AUTH ======================
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password || !email)
      return res.status(400).json({ error: '请填写所有字段' });
    if (password.length < 4)
      return res.status(400).json({ error: '密码至少 4 位' });
    if (!email.includes('@'))
      return res.status(400).json({ error: '邮箱格式不正确' });

    const users = readJSON(USERS_FILE, {});
    if (users[username])
      return res.status(409).json({ error: '用户名已存在' });

    const hash = await bcrypt.hash(password, 10);
    users[username] = { password: hash, email, createdAt: new Date().toISOString().split('T')[0] };
    writeJSON(USERS_FILE, users);

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username });
  } catch (e) {
    res.status(500).json({ error: '服务器错误' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = readJSON(USERS_FILE, {});
    const user = users[username];
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: '用户名或密码错误' });

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username });
  } catch (e) {
    res.status(500).json({ error: '服务器错误' });
  }
});

app.get('/api/user', auth, (req, res) => {
  const users = readJSON(USERS_FILE, {});
  const user = users[req.user.username];
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({ username: req.user.username, email: user.email });
});

// ====================== PASSWORD RESET ======================
app.post('/api/forgot-password', (req, res) => {
  const { username } = req.body;
  const users = readJSON(USERS_FILE, {});
  const user = users[username];
  if (!user) return res.status(404).json({ error: '用户不存在' });
  if (!user.email) return res.status(400).json({ error: '该用户未绑定邮箱' });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const today = new Date().toISOString().split('T')[0];
  user.resetCode = code;
  user.resetExp = today;
  writeJSON(USERS_FILE, users);

  res.json({ email: user.email, maskedEmail: user.email[0] + '***@' + user.email.split('@')[1], code });
});

app.post('/api/reset-password', async (req, res) => {
  const { username, code, newPassword } = req.body;
  const users = readJSON(USERS_FILE, {});
  const user = users[username];
  if (!user) return res.status(404).json({ error: '用户不存在' });
  if (user.resetCode !== code) return res.status(400).json({ error: '重置码错误' });
  if (user.resetExp !== new Date().toISOString().split('T')[0])
    return res.status(400).json({ error: '重置码已过期' });
  if (!newPassword || newPassword.length < 4)
    return res.status(400).json({ error: '密码至少 4 位' });

  user.password = await bcrypt.hash(newPassword, 10);
  delete user.resetCode;
  delete user.resetExp;
  writeJSON(USERS_FILE, users);
  res.json({ success: true });
});

// ====================== BOOKS ======================
app.get('/api/books', (req, res) => {
  res.json(readJSON(BOOKS_FILE, {}));
});

app.post('/api/books', auth, (req, res) => {
  const books = readJSON(BOOKS_FILE, {});
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: '请输入名称' });
  if (books[name]) return res.status(409).json({ error: '已存在' });
  books[name] = { words: [], isDefault: false };
  writeJSON(BOOKS_FILE, books);
  res.json({ success: true });
});

app.delete('/api/books/:name', auth, (req, res) => {
  const books = readJSON(BOOKS_FILE, {});
  const name = decodeURIComponent(req.params.name);
  if (!books[name]) return res.status(404).json({ error: '不存在' });
  if (books[name].isDefault) return res.status(403).json({ error: '默认词汇书不可删除' });
  delete books[name];
  writeJSON(BOOKS_FILE, books);
  res.json({ success: true });
});

app.post('/api/books/:name/words', auth, (req, res) => {
  const books = readJSON(BOOKS_FILE, {});
  const name = decodeURIComponent(req.params.name);
  if (!books[name]) return res.status(404).json({ error: '词汇书不存在' });
  const { en, zh } = req.body;
  if (!en || !zh) return res.status(400).json({ error: '请填写英文和中文' });
  books[name].words.push({ en, zh });
  writeJSON(BOOKS_FILE, books);
  res.json({ success: true });
});

app.delete('/api/books/:name/words/:word', auth, (req, res) => {
  const books = readJSON(BOOKS_FILE, {});
  const name = decodeURIComponent(req.params.name);
  if (!books[name]) return res.status(404).json({ error: '词汇书不存在' });
  if (books[name].isDefault) return res.status(403).json({ error: '默认词汇书不可删除单词' });
  const idx = books[name].words.findIndex(w => w.en === req.params.word);
  if (idx === -1) return res.status(404).json({ error: '单词不存在' });
  books[name].words.splice(idx, 1);
  writeJSON(BOOKS_FILE, books);
  res.json({ success: true });
});

// ====================== USER DATA ======================
app.get('/api/user-data', auth, (req, res) => {
  const all = readJSON(USERDATA_FILE, {});
  res.json(all[req.user.username] || { stats: { checkInDates: [], totalWords: 0, totalSessions: 0 }, wordProgress: {}, bookProgress: {}, savedState: null });
});

app.put('/api/user-data', auth, (req, res) => {
  const all = readJSON(USERDATA_FILE, {});
  all[req.user.username] = req.body;
  writeJSON(USERDATA_FILE, all);
  res.json({ success: true });
});

// ====================== STATIC ======================
app.use(express.static(path.join(__dirname, '..')));

app.listen(PORT, () => {
  console.log('VocabLink backend running on http://localhost:' + PORT);
});
