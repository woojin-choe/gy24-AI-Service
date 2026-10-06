import vinext from 'vinext';
import { defineConfig, loadEnv } from 'vite';
import { sites } from './build/sites-vite-plugin';
import { localApi } from './server/api.mjs';
export default defineConfig(({ mode }) => {
 const env=loadEnv(mode,process.cwd(),'');
 return {server:{host:'127.0.0.1',port:3001,strictPort:true,fs:{deny:['.env','.env.*','*.{crt,pem}','**/.git/**','**/.local/**']},watch:{usePolling:true}},plugins:[localApi(env,process.cwd()),vinext(),sites()]};
});
