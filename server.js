const express = require("express");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const FRAMES_FILE = path.join(ROOT, "data", "frames.json");
app.use(express.json({limit:"2mb"}));
app.use(express.static(path.join(ROOT,"public")));
function readFrames(){ return JSON.parse(fs.readFileSync(FRAMES_FILE,"utf8")); }
app.get("/api/frames",(req,res)=>res.json(readFrames()));
app.put("/api/frames/:id/slots",(req,res)=>{
  const frames=readFrames(), id=Number(req.params.id), frame=frames.find(f=>f.id===id);
  if(!frame) return res.status(404).json({error:"Không tìm thấy frame."});
  const slots=req.body.slots;
  if(!Array.isArray(slots)||slots.length<1||slots.length>20) return res.status(400).json({error:"Số ô phải từ 1 đến 20."});
  for(const s of slots){
    if(!Array.isArray(s)||s.length!==4||s.some(n=>!Number.isFinite(n))) return res.status(400).json({error:"Tọa độ ô không hợp lệ."});
    if(s[0]<0||s[1]<0||s[2]<10||s[3]<10||s[0]+s[2]>frame.width||s[1]+s[3]>frame.height) return res.status(400).json({error:"Ô ảnh nằm ngoài frame."});
  }
  frame.slots=slots; frame.slotCount=slots.length; frame.needsReview=false;
  fs.writeFileSync(FRAMES_FILE,JSON.stringify(frames,null,2),"utf8");
  res.json({ok:true,frame});
});
app.get("/api/qr",(req,res)=>{
  const url=String(req.query.url||process.env.PUBLIC_SITE_URL||"").trim();
  if(!/^https?:\/\//i.test(url) || url.includes("your-real-domain.example")) return res.status(400).json({error:"Hãy nhập URL website công khai thật (HTTPS) sau khi deploy."});
  QRCode.toDataURL(url,{width:900,margin:2,errorCorrectionLevel:"H"},(err,data)=>{
    if(err)return res.status(500).json({error:"Không tạo được QR."});
    res.json({url,data});
  });
});
app.get("*",(req,res)=>res.sendFile(path.join(ROOT,"public","index.html")));
app.listen(PORT,"0.0.0.0",()=>{
 console.log(`DuckFrameBooth: http://localhost:${PORT}`);
 console.log(`Mở trên điện thoại cùng Wi-Fi bằng địa chỉ LAN của máy tính, ví dụ http://192.168.x.x:${PORT}`);
});