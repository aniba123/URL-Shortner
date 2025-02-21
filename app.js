import { readFile } from 'fs/promises';
import { createServer } from 'http';
import path from 'path';
import crypto from 'crypto'
import { writeFile } from 'fs/promises';
import { link } from 'fs';
// import { url } from 'inspector';


let Data_file=path.join('data','links.json')
let ServerFile=async (res,filePath,contentType)=>{
    try {
        let data = await readFile(filePath);
        res.writeHead(200, { 'Content-Type':contentType });
        res.end(data);
    } catch (error) {
        res.writeHead(404, { 'Content-Type': contentType });
        res.end('404 page not found!');
    }
}

let LoadLink= async ()=>{
    try {
        let data=await readFile(Data_file,'utf-8')
        return JSON.parse(data)
    } catch (error) {
        if (error.code==='ENOENT') {
            await writeFile(Data_file,JSON.stringify({}))
            return {}
        }
        throw error
    }
}


let saveLinks= async (links)=>{
        await writeFile(Data_file,JSON.stringify(links))
}

let server = createServer(async (req, res) => {
    // console.log(req.url);
    
    if (req.method === 'GET') {
        if (req.url === '/') {
            return ServerFile(res,path.join('public', 'index.html'),'text/html')
        } 

        else  if (req.url === '/link.css') {
                return ServerFile(res,path.join('public', 'link.css'),'text/css')
    
            }

            else if(req.url==='/links'){
                let Links = await LoadLink();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify(Links));
            }
        
        else {
           let links=await LoadLink();
           let shortCode=req.url.slice(1)
           console.log('links redi',req.url);

           if (links[shortCode]) {
            res.writeHead(302,{location:links[shortCode]})
         return   res.end()
           }
           
        }
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        return res.end('URL is found!');
    }

    // post request

    if (req.method === 'POST' && req.url === '/short') {
        let Links = await LoadLink();
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
        });
        req.on('end', async () => {
            console.log(body);
            
            try {
                let { url, shortCode } = JSON.parse(body);
                if (!url) {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    return res.end('URL is required!');
                }
    
                let finalShortCode = shortCode || crypto.randomBytes(4).toString('hex');
                if (Links[finalShortCode]) {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    return res.end('Short code already exists. Choose another one!');
                }
    
                Links[finalShortCode] = url;
                await saveLinks(Links); // Corrected
    
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                console.error('Error parsing body:', err);
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Invalid request body');
            }
        });
    }
    
});

let port = 2000;
server.listen(port, () => {
    console.log(`Your Server is Listening at http://localhost:${port}`);
});
