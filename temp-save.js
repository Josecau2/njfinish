const controller = require('./controllers/loginCustomizationController');
const { getLoginCustomization } = require('./services/loginCustomizationCache');

(async () => {
  const existing = await getLoginCustomization(true);
  const updated = {
    ...existing,
    rightTitle: 'CONTRACTOR PORTAL',
    rightSubtitle: 'See Your Cabinet Price in Seconds!1',
    rightTagline: 'NJ CONTRACTORS',
    rightDescription: 'Manage end-to-end flow with NJ Contractors.',
  };

  const mockRes = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      console.log('status', this.statusCode, 'keys', Object.keys(payload));
      this.payload = payload;
      return this;
    }
  };

  await controller.saveCustomization({ body: updated }, mockRes);
  console.log('done');
})();
