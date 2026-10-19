const app = require("express")();
const server = require("http").Server(app);
const bodyParser = require("body-parser");
const Datastore = require("@seald-io/nedb");
const validator = require("validator");
const path = require("path");
const appName = process.env.APPNAME;
const appData = process.env.APPDATA;
const dbPath = path.join(
    appData,
    appName,
    "server",
    "databases",
    "suppliers.db",
);

app.use(bodyParser.json());

module.exports = app;

let suppliersDB = new Datastore({
    filename: dbPath,
    autoload: true,
});

suppliersDB.ensureIndex({ fieldName: "_id", unique: true });

/**
 * GET endpoint: Get the welcome message for the Suppliers API.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/", function (req, res) {
    res.send("Suppliers API");
});

/**
 * GET endpoint: Get supplier details by supplier ID.
 *
 * @param {Object} req request object with supplier ID as a parameter.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/supplier/:supplierId", function (req, res) {
    if (!req.params.supplierId) {
        res.status(500).send("ID field is required.");
    } else {
        suppliersDB.findOne(
            {
                _id: parseInt(req.params.supplierId),
            },
            function (err, supplier) {
                if (err) {
                    res.status(500).send("Error fetching supplier.");
                } else {
                    res.send(supplier);
                }
            },
        );
    }
});

/**
 * GET endpoint: Get details of all suppliers.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/all", function (req, res) {
    suppliersDB.find({}).sort({ name: 1 }).exec(function (err, docs) {
        if (err) {
            res.status(500).send("Error fetching suppliers.");
        } else {
            res.send(docs);
        }
    });
});

/**
 * POST endpoint: Create or update a supplier.
 *
 * @param {Object} req request object with supplier data in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/post", function (req, res) {
    // Validate required fields
    if (!req.body.name || validator.escape(req.body.name).trim() === "") {
        return res.status(400).json({
            error: "Validation Error",
            message: "Supplier name is required.",
        });
    }

    let Supplier = {
        name: validator.escape(req.body.name),
        contact_person: validator.escape(req.body.contact_person || ""),
        email: validator.escape(req.body.email || ""),
        phone: validator.escape(req.body.phone || ""),
        address: validator.escape(req.body.address || ""),
        notes: validator.escape(req.body.notes || ""),
        created_at: new Date(),
        updated_at: new Date(),
    };

    if (validator.escape(req.body._id) === "") {
        // Create new supplier
        suppliersDB.find({}).sort({ _id: -1 }).limit(1).exec(function (err, docs) {
            let newId = docs.length > 0 ? docs[0]._id + 1 : 1;
            Supplier._id = newId;

            suppliersDB.insert(Supplier, function (err, newDoc) {
                if (err) {
                    console.error(err);
                    res.status(500).json({
                        error: "Internal Server Error",
                        message: "An unexpected error occurred.",
                    });
                } else {
                    res.status(200).json({
                        success: true,
                        message: "Supplier created successfully.",
                        supplier: newDoc,
                    });
                }
            });
        });
    } else {
        // Update existing supplier
        Supplier._id = parseInt(req.body._id);
        Supplier.updated_at = new Date();

        suppliersDB.update(
            { _id: parseInt(req.body._id) },
            { $set: Supplier },
            {},
            function (err, numReplaced) {
                if (err) {
                    console.error(err);
                    res.status(500).json({
                        error: "Internal Server Error",
                        message: "An unexpected error occurred.",
                    });
                } else {
                    res.status(200).json({
                        success: true,
                        message: "Supplier updated successfully.",
                    });
                }
            },
        );
    }
});

/**
 * DELETE endpoint: Delete a supplier by ID.
 *
 * @param {Object} req request object with supplier ID as a parameter.
 * @param {Object} res response object.
 * @returns {void}
 */
app.delete("/delete/:supplierId", function (req, res) {
    if (!req.params.supplierId) {
        res.status(400).send("ID field is required.");
    } else {
        suppliersDB.remove(
            { _id: parseInt(req.params.supplierId) },
            {},
            function (err, numRemoved) {
                if (err) {
                    console.error(err);
                    res.status(500).json({
                        error: "Internal Server Error",
                        message: "An unexpected error occurred.",
                    });
                } else {
                    res.status(200).json({
                        success: true,
                        message: "Supplier deleted successfully.",
                    });
                }
            },
        );
    }
});
