"use strict";

const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("genesisDesktop", {
  platform: process.platform,
});
