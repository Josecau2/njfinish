const base = 'http://localhost:8080/api';

async function httpJson(path, { method = 'GET', token, params, body } = {}) {
  let url = base + path;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    url += '?' + qs;
  }
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = (() => { try { return JSON.parse(text); } catch { return { raw:text }; } })();
  if (!res.ok) {
    const err = new Error('HTTP ' + res.status);
    err.status = res.status;
    err.data = json;
    throw err;
  }
  return json;
}

async function main(){
  try{
    console.log('STEP login');
    const login = await httpJson('/auth/login', { method: 'POST', body: { email:'joseca@symmetricalwolf.com', password:'admin123' } });
    const token = login.token;
    console.log('LOGIN_OK');

    console.log('STEP get gallery categories');
    const g = await httpJson('/v1/modifications/categories', { token, params: { scope: 'gallery' } });
    console.log('CATS_G', g.categories?.length ?? -1);

    console.log('STEP get manufacturer categories');
    const m = await httpJson('/v1/modifications/categories', { token, params: { scope: 'manufacturer', manufacturerId: 1 } });
    console.log('CATS_M', m.categories?.length ?? -1);

    const payload = {
      name: 'Test Mod ' + Date.now(),
      categoryId: null,
      isBlueprint: false,
      manufacturerId: 1,
      defaultPrice: 12.34,
      isReady: false,
      fieldsConfig: {},
      sampleImage: null
    };

    console.log('STEP create manufacturer template');
    const t = await httpJson('/v1/modifications/templates', { method:'POST', token, body: payload });
    console.log('TPL_OK', t.template?.id);
    process.exit(0);
  }catch(e){
    console.log('ERR', e.status, e.data || e.message);
    process.exit(1);
  }
}

main();
