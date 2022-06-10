// import inventory controller
require("dotenv").config();
const mongoose = require("mongoose");
require("../server/config/mongoose.config");
const InventoryControllers = require("../server/controllers/inventory.controller");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const path = require("path");
const mongoURI = process.env.MONGO_URI;

console.log(":::::: INVENTORY ROUTES :::::::");
console.log(":::::::::::::::: process.env.MONGO_URI ::::::::::::::::::::::::");
// console.log("mongoose", mongoose);

const conn = mongoose.createConnection(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
console.log(":::::: conn :::::::");

let gfs;
conn.once("open", () => {
  console.log("MongoDB database connection established successfully");
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "InventoryImagesBucket"
  });
});
//
console.log(":::::: gfs :::::::", gfs);

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "client/public/inventoryImages");
//   },
//   filename: function (req, file, cb) {
//     cb(null, uuidv4() + "__" + Date.now() + "__" + path.basename(file.originalname, path.extname(file.originalname)) + "__" + path.extname(file.originalname));
//   }
// });

const storage = new GridFsStorage({
  url: mongoURI,
  options: { useUnifiedTopology: true },
  file: (req, file) => {
    console.log(":::::::::::::::: storage ::::::::::::::::::::::::");
    console.log(":::::::::::::::: file ::::::::::::::::::::::::", file);
    console.log(":::::::::::::::: req ::::::::::::::::::::::::");

    // this file runs each time a new file is uploaded
    return new Promise((resolve, reject) => {
      console.log(":::::::::::::::: within the Promise ::::::::::::::::::::::::");
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + "__" + Date.now() + "__" + path.basename(file.originalname, path.extname(file.originalname)) + "__" + path.extname(file.originalname);
        console.log(":::::::::::::::: within the Promise__ filename ::::::::::::::::::::::::", filename);
        const fileInfo = {
          filename: filename,
          bucketName: "InventoryImagesBucket"
        };
        console.log(":::::::::::::::: within the Promise__ fileInfo ::::::::::::::::::::::::", fileInfo);
        // resolve these properties to add to the file
        resolve(fileInfo);
      });
    });
  }
});

// set up multer to use the gridfs storage
const store = multer(
  console.log(":::::::::::::::: Entering store / Multer ::::::::::::::::::::::::"),
  {
    storage,
    // limit the size to 20mb for any files coming in
    limits: { fileSize: 20000000 },
    // filer out invalid filetypes
    fileFilter: function (req, file, cb) {
      checkFileType(file, cb);
    }
  },
  console.log("===== passing through multer =====")
);
console.log(":::::::::::::::: store ::::::::::::::::::::::::");

const checkFileType = (file, cb) => {
  console.log(":::::::::::::::: checkFileType - file ::::::::::::::::::::::::", file);
  // allowed filetypes
  const filetypes = /jpg|jpeg|png|gif/;
  console.log(":::::::::::::::: checkFileType - filetypes ::::::::::::::::::::::::", filetypes);
  // check the file ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  console.log(":::::::::::::::: checkFileType - extname ::::::::::::::::::::::::", extname);
  // check the mimetype
  const mimetype = filetypes.test(file.mimetype);
  console.log(":::::::::::::::: checkFileType - mimetype ::::::::::::::::::::::::", mimetype);
  // if both are true continue on
  if (mimetype && extname) {
    console.log("file is an image");
    console.log("===== Exiting checkFileType =====");
    return cb(null, true);
  }
  // if not return error
  cb("Error: file is NOT an image, select Images Only!");
};

const uploadMiddleware = (req, res, next) => {
  console.log(":::::::::::::::: uploadMiddleware ::::::::::::::::::::::::");
  const upload = store.single("inventoryImage");
  upload(req, res, function (err) {
    // console.log(":::::::::::::::: uploadMiddleware ==> upload-req  ::::::::::::::::::::::::");
    console.log(":::::::::::::::: uploadMiddleware ==> upload-req  ::::::::::::::::::::::::", req);
    console.log(":::::::::::::::: uploadMiddleware ==> upload-res ::::::::::::::::::::::::", res);
    console.log(":::::::::::::::: uploadMiddleware ==> upload-err  ::::::::::::::::::::::::", err);
    if (err instanceof multer.MulterError) {
      return res.status(400).send("File too large");
    } else if (err) {
      // check if our filetype error occurred
      if (err === "filetype") return res.status(400).send("Image files only");
      // An unknown error occurred when uploading.
      return res.sendStatus(500);
    }
    // all good, proceed
    console.log(":::::::::::::::: uploadMiddleware ==> next  ::::::::::::::::::::::::");
    // set the body.inventoryImage to the file id of the uploaded file
    // res.body.inventoryImage = res.file.id;
    next();
  });
};

// let upload = multer({ storage, fileFilter });

// console.log("ROUTES__Storage---->", storage);
// console.log("ROUTES__Storage.destination---->", storage.destination);
// console.log("ROUTES__Storage.filename---->", storage.filename);

// console.log("ROUTES__fileFilter---->", fileFilter);
// console.log("ROUTES__Upload---->", upload);

// export routes
module.exports = (app) => {
  // put static routes at the top and dynamic routes at the bottom

  //* :::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // testing connection with sayHello
  app.get("/api/hello/inventory", InventoryControllers.sayHello);
  // getting all the inventory items no sort
  app.get("/api/inventory/user/:user_id", InventoryControllers.getAllInventoryItems);
  // getting all the inventory items sorted by none - a previous way I sorted  items
  // app.get("/api/inventory/none", InventoryControllers.getAllInventoryItems);
  // getting inventory count
  // app.get("/api/inventory/count", InventoryControllers.getCountOfInventory);
  // getting one random inventory item
  // app.get("/api/inventory/random", InventoryControllers.getOneRandomInventory);
  // create new inventory item
  app.post("/api/inventory/new", uploadMiddleware, InventoryControllers.createInventoryItem);
  // updating an inventory item by id
  // console.log("ROUTES__app.put---->");
  app.put("/api/inventory/update/:_id", uploadMiddleware, InventoryControllers.updateExistingInventoryItem);
  // get one inventory item by id
  app.get("/api/inventory/getOne/:_id", InventoryControllers.getOneInventoryItem);
  // deleting a inventory item by id
  app.delete("/api/inventory/delete/:_id", InventoryControllers.deleteInventoryItem);
  // all inventory sorted dynamically
  // app.get("/api/inventory/:sorttype/:sortdirection", InventoryControllers.getAllInventorySort);
  //* :::::::::::::::::::::::::::::::::::::::::::::::::::::::
};
