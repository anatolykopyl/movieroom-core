import fs from 'fs';
import path from 'path';

export function errorResponse(code: String, message: String, status?: number) {
  if (!status) {
    status = 400;
  }
  return { 
    status, 
    body: { code, message }, 
  };
}

export function findInDir(startPath: string, filter: RegExp, callback: Function){
  if (!fs.existsSync(startPath)){
    console.log('No such directory ', startPath);
    return;
  }

  const files = fs.readdirSync(startPath);
  for (let i = 0; i < files.length; i++){
    const filename = path.join(startPath, files[i]);
    const stat = fs.lstatSync(filename);
    if (stat.isDirectory()){
      findInDir(filename, filter, callback);
    } else if (filter.test(filename)) callback(filename);
  }
}

