const app = require("express")();
const server = require("http").Server(app);
const bodyParser = require("body-parser");
const Datastore = require("@seald-io/nedb");
const multer = require("multer");
const sanitizeFilename = require('sanitize-filename');
const fs = require("fs");
const path = require("path");
const validator = require("validator");
const appName = process.env.APPNAME;
const appData = process.env.APPDATA;
const validFileTypes = [
    "image/jpg",
    "image/jpeg",
    "image/png",
    "image/webp"];
const maxFileSize = 2097152 //2MB = 2*1024*1024
const defaultLogoName = "logo";
const {filterFile} = require('../assets/js/utils');
const dbPath = path.join(
    appData,
    appName,
    "server",
    "databases",
    "settings.db",
);

const storage = multer.diskStorage({
    destination: path.join(appData, appName, "uploads"),
    filename: function (req, file, callback) {
        callback(null, defaultLogoName+path.extname(file.originalname));
    },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: maxFileSize },
  fileFilter: filterFile,
}).single("imagename");


app.use(bodyParser.json());

module.exports = app;

let settingsDB = new Datastore({
    filename: dbPath,
    autoload: true,
});

settingsDB.ensureIndex({ fieldName: "_id", unique: true });
/**
 * GET endpoint: Get the welcome message for the Settings API.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */

app.get("/", function (req, res) {
    res.send("Settings API");
});

/**
 * GET endpoint: Get settings details.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/get", function (req, res) {
    settingsDB.findOne(
        {
            _id: 1,
        },
        function (err, docs) {
            res.send(docs);
        },
    );
});

/**
 * POST endpoint: Create or update settings.
 *
 * @param {Object} req request object with settings data in the body.
 * @param {Object} res response object.
 * @returns {void}
 */

app.post("/post", function (req, res) {
    upload(req, res, function (err) {

        if (err) {
            if (err instanceof multer.MulterError) {
                console.error('Upload Error:', err);
                return res.status(400).json({
                    error: 'Upload Error',
                    message: err.message,
                });
            } else {
                console.error('Unknown Error:', err);
                return res.status(500).json({
                    error: 'Internal Server Error',
                    message: err.message,
                });
            }
        }

    let image = "";

    if (validator.escape(req.body.img) !== "") {
        image = sanitizeFilename(req.body.img);
    }

    if (req.file) {
        image = sanitizeFilename(req.file.filename);
    }


    if (validator.escape(req.body.remove) === "1") {
            try {
                let imgPath = path.join(
                appData,
                appName,
                "uploads",
                image,
                );

                if (!req.file) {
                fs.unlinkSync(imgPath);
                image = "";
                }
                
            } catch (err) {
                console.error(err);
            }

        }
        
    let Settings = {
        _id: 1,
        settings: {
            app: validator.escape(req.body.app),
            store: validator.escape(req.body.store),
            address_one: validator.escape(req.body.address_one),
            address_two: validator.escape(req.body.address_two),
            contact: validator.escape(req.body.contact),
            tax: validator.escape(req.body.tax),
            symbol: validator.escape(req.body.symbol),
            percentage: validator.escape(req.body.percentage),
            charge_tax: req.body.charge_tax === 'on',
            footer: validator.escape(req.body.footer),
            img: image,
        },
    };

    if (validator.escape(req.body.id) === "") {
        settingsDB.insert(Settings, function (err, settings) {
            if (err) {
                console.error(err);
                res.status(500).json({
                    error: "Internal Server Error",
                    message: "An unexpected error occurred.",
                });
            } else {
                res.sendStatus(200);
            }
        });
    } else {
        settingsDB.update(
            {
                _id: 1,
            },
            Settings,
            {},
            function (err, numReplaced, settings) {
                if (err) {
                    console.error(err);
                    res.status(500).json({
                        error: "Internal Server Error",
                        message: "An unexpected error occurred.",
                    });
                } else {
                    res.sendStatus(200);
                }
            },
        );
    }
});

});

/**
 * DELETE endpoint: Clear all data from the system.
 * This removes all products, transactions, customers, categories, and suppliers.
 * Settings and users are preserved.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.delete("/clear-all-data", function (req, res) {
    const dbBasePath = path.join(appData, appName, "server", "databases");
    
    // List of databases to clear (excluding users and settings)
    const dbsToClear = [
        "products.db",
        "transactions.db",
        "customers.db",
        "categories.db",
        "suppliers.db"
    ];
    
    let errors = [];
    let cleared = 0;
    
    dbsToClear.forEach(dbFile => {
        const dbFilePath = path.join(dbBasePath, dbFile);
        
        try {
            // Check if file exists before trying to delete
            if (fs.existsSync(dbFilePath)) {
                fs.unlinkSync(dbFilePath);
                cleared++;
            }
        } catch (err) {
            console.error(`Error clearing ${dbFile}:`, err);
            errors.push(dbFile);
        }
    });
    
    // Also clear product images
    const productImagesPath = path.join(appData, appName, "uploads", "product_image");
    try {
        if (fs.existsSync(productImagesPath)) {
            const files = fs.readdirSync(productImagesPath);
            files.forEach(file => {
                fs.unlinkSync(path.join(productImagesPath, file));
            });
        }
    } catch (err) {
        console.error("Error clearing product images:", err);
    }
    
    if (errors.length > 0) {
        res.status(500).json({
            error: "Partial clear",
            message: `Failed to clear: ${errors.join(", ")}`,
            cleared: cleared
        });
    } else {
        res.json({
            success: true,
            message: "All data cleared successfully. Please restart the application.",
            cleared: cleared
        });
    }
});