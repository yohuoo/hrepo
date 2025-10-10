const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads/videos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名: 时间戳-随机数-原始文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  console.log(`📁 收到文件上传: ${file.originalname}, MIME类型: ${file.mimetype}`);
  
  // 允许的视频格式
  const allowedMimes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/x-matroska',
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
    'audio/mp4',
    'application/octet-stream' // 某些情况下MP4可能被识别为此类型
  ];

  if (allowedMimes.includes(file.mimetype)) {
    console.log(`✅ 文件类型验证通过: ${file.mimetype}`);
    cb(null, true);
  } else {
    console.log(`❌ 不支持的文件类型: ${file.mimetype}`);
    cb(new Error(`不支持的文件格式: ${file.mimetype}，请上传视频或音频文件`), false);
  }
};

// 创建multer实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB
  },
  fileFilter: fileFilter
});

module.exports = { upload };
