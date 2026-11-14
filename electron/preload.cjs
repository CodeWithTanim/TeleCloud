const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('telecloudDesktop', {
  isDesktop: true,
  platform: process.platform,
  version: '1.0.0',
});
