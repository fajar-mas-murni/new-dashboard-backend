const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPEG, PNG and PDF files are allowed"), false);
    }
};

const upload = multer({ storage, fileFilter });

module.exports = {
    uploadSingle: (fieldName) => upload.single(fieldName),
    uploadMultiple: (fieldName, maxCount = 5) => upload.array(fieldName, maxCount),
};
